use crate::features::{AuthorFeatures, PostFeatures, UserFeatures};

/// Multi-task prediction heads — mirrors X's Heavy Ranker architecture.
/// Production loads ONNX/TorchScript weights; this uses a calibrated heuristic model.
pub struct HeavyRanker {
    weights: ModelWeights,
}

#[derive(Debug, Clone)]
pub struct PredictionScores {
    pub p_like: f64,
    pub p_repost: f64,
    pub p_reply: f64,
    pub p_click: f64,
    pub p_dwell: f64,
}

struct ModelWeights {
    recency_decay: f64,
    engagement_boost: f64,
    author_trust: f64,
}

impl HeavyRanker {
    pub fn load_default() -> Self {
        Self {
            weights: ModelWeights {
                recency_decay: 0.95,
                engagement_boost: 0.1,
                author_trust: 0.15,
            },
        }
    }

    pub fn predict(
        &self,
        user: &UserFeatures,
        post: &PostFeatures,
        author: &AuthorFeatures,
    ) -> PredictionScores {
        let recency = self.weights.recency_decay.powf(post.age_hours / 24.0);
        let engagement = (post.like_count + post.repost_count * 2.0 + post.reply_count * 1.5)
            / (post.age_hours + 1.0);
        let author_signal = if author.verified {
            self.weights.author_trust * 2.0
        } else {
            self.weights.author_trust * (author.avg_engagement_rate * 10.0).min(1.0)
        };

        let base = recency * (1.0 + self.weights.engagement_boost * engagement.ln_1p()) + author_signal;

        PredictionScores {
            p_like: sigmoid(base * 0.8 + user.likes_per_day * 0.01),
            p_repost: sigmoid(base * 0.4),
            p_reply: sigmoid(base * 0.3 + if post.reply_count > 5.0 { 0.2 } else { 0.0 }),
            p_click: sigmoid(base * 0.9 + if post.has_media { 0.15 } else { 0.0 }),
            p_dwell: sigmoid(base * 0.6 + user.avg_dwell_secs * 0.02),
        }
    }
}

fn sigmoid(x: f64) -> f64 {
    1.0 / (1.0 + (-x).exp())
}