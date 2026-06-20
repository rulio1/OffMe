use super::{RankRequest, RankedCandidate};
use crate::features::FeatureHydrator;
use crate::ranker::HeavyRanker;

pub struct RecsPipeline {
    hydrator: FeatureHydrator,
    ranker: HeavyRanker,
}

impl RecsPipeline {
    pub async fn new(redis_url: &str) -> Result<Self, redis::RedisError> {
        Ok(Self {
            hydrator: FeatureHydrator::new(redis_url).await?,
            ranker: HeavyRanker::load_default(),
        })
    }

    /// Full ranking pipeline: hydrate → infer → aggregate scores.
    pub async fn rank(&self, req: &RankRequest) -> Vec<RankedCandidate> {
        let user_features = self.hydrator.get_user_features(req.user_id).await;
        let post_features = self
            .hydrator
            .get_post_features(&req.candidate_post_ids)
            .await;

        let mut ranked: Vec<RankedCandidate> = req
            .candidate_post_ids
            .iter()
            .zip(req.candidate_author_ids.iter())
            .enumerate()
            .map(|(i, (&post_id, &author_id))| {
                let uf = &user_features;
                let pf = post_features.get(i).cloned().unwrap_or_default();
                let author_f = self.hydrator.get_author_features_sync(author_id);

                let scores = self.ranker.predict(uf, &pf, &author_f);

                // Weighted multi-task score (mirrors X's open-source algorithm weights)
                let final_score = 0.3 * scores.p_like
                    + 0.2 * scores.p_repost
                    + 0.15 * scores.p_reply
                    + 0.2 * scores.p_click
                    + 0.15 * scores.p_dwell;

                RankedCandidate {
                    post_id,
                    score: final_score,
                    p_like: scores.p_like,
                    p_repost: scores.p_repost,
                    p_reply: scores.p_reply,
                    p_click: scores.p_click,
                    p_dwell: scores.p_dwell,
                }
            })
            .collect();

        ranked.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap());
        ranked
    }
}