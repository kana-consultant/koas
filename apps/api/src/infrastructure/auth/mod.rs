use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone)]
pub struct AuthState {
    pub username: String,
    pub password_hash: String,
    pub sessions: Arc<RwLock<HashSet<String>>>,
    pub enabled: bool,
    pub sessions_file: PathBuf,
}

impl AuthState {
    pub fn from_env(data_dir: &PathBuf) -> Self {
        let enabled = std::env::var("KOAS_AUTH_ENABLED")
            .map(|v| v != "false" && v != "0")
            .unwrap_or(true);
        let username = std::env::var("KOAS_AUTH_USERNAME").unwrap_or_else(|_| "admin".to_string());
        let password = std::env::var("KOAS_AUTH_PASSWORD").unwrap_or_else(|_| "koas".to_string());
        let sessions_file = data_dir.join("sessions.json");
        let sessions = std::fs::read_to_string(&sessions_file)
            .ok()
            .and_then(|c| serde_json::from_str::<HashSet<String>>(&c).ok())
            .unwrap_or_default();
        Self {
            username,
            password_hash: simple_hash(&password),
            sessions: Arc::new(RwLock::new(sessions)),
            enabled,
            sessions_file,
        }
    }

    pub fn verify_password(&self, password: &str) -> bool {
        simple_hash(password) == self.password_hash
    }

    pub async fn create_session(&self) -> String {
        let token = uuid::Uuid::new_v4().to_string();
        self.sessions.write().await.insert(token.clone());
        self.persist().await;
        token
    }

    pub async fn validate_session(&self, token: &str) -> bool {
        self.sessions.read().await.contains(token)
    }

    pub async fn invalidate_session(&self, token: &str) {
        self.sessions.write().await.remove(token);
        self.persist().await;
    }

    async fn persist(&self) {
        let sessions = self.sessions.read().await;
        if let Ok(json) = serde_json::to_string(&*sessions) {
            let _ = tokio::fs::write(&self.sessions_file, json).await;
        }
    }
}

fn simple_hash(input: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut h = DefaultHasher::new();
    format!("koas-salt-{}", input).hash(&mut h);
    format!("{:x}", h.finish())
}
