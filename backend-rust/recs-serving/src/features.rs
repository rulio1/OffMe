use redis::aio::ConnectionManager;
use serde::Deserialize;

#[derive(Debug, Clone, Default, Deserialize)]
pub struct UserFeatures {
    pub follower_count: f64,
    pub following_count: f64,
    pub avg_dwell_secs: f64,
    pub likes_per_day: f64,
    pub preferred_languages: Vec<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct PostFeatures {
    pub age_hours: f64,
    pub like_count: f64,
    pub repost_count: f64,
    pub reply_count: f64,
    pub has_media: bool,
    pub text_length: f64,
}

#[derive(Debug, Clone, Default, Deserialize)]
pub struct AuthorFeatures {
    pub follower_count: f64,
    pub verified: bool,
    pub avg_engagement_rate: f64,
}

pub struct FeatureHydrator {
    redis: ConnectionManager,
}

impl FeatureHydrator {
    pub async fn new(redis_url: &str) -> Result<Self, redis::RedisError> {
        let client = redis::Client::open(redis_url)?;
        let redis = ConnectionManager::new(client).await?;
        Ok(Self { redis })
    }

    pub async fn get_user_features(&self, user_id: i64) -> UserFeatures {
        let key = format!("feat:user:{}", user_id);
        self.get_json(&key).await.unwrap_or_default()
    }

    pub async fn get_post_features(&self, post_ids: &[i64]) -> Vec<PostFeatures> {
        let mut features = Vec::with_capacity(post_ids.len());
        for post_id in post_ids {
            let key = format!("feat:post:{}", post_id);
            features.push(self.get_json(&key).await.unwrap_or_default());
        }
        features
    }

    pub fn get_author_features_sync(&self, author_id: i64) -> AuthorFeatures {
        // In production: batched MGET from Redis pipeline
        AuthorFeatures {
            follower_count: 1000.0,
            verified: false,
            avg_engagement_rate: 0.05,
        }
    }

    async fn get_json<T: for<'de> Deserialize<'de> + Default>(&self, key: &str) -> Option<T> {
        let mut conn = self.redis.clone();
        let val: Option<String> = redis::cmd("GET")
            .arg(key)
            .query_async(&mut conn)
            .await
            .ok()?;
        val.and_then(|s| serde_json::from_str(&s).ok())
    }
}