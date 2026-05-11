use std::sync::Arc;
use chrono::Utc;
use uuid::Uuid;
use koas_errors::AppError;
use crate::domain::{repository::ServerRepository, server::Server};

pub struct CreateServerInput {
    pub name: String,
    pub host: String,
    pub port: u16,
    pub token: String,
}

pub struct CreateServer {
    repo: Arc<dyn ServerRepository>,
}

impl CreateServer {
    pub fn new(repo: Arc<dyn ServerRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, input: CreateServerInput) -> Result<Server, AppError> {
        let now = Utc::now();
        let server = Server {
            id: Uuid::new_v4(),
            name: input.name,
            host: input.host,
            port: input.port,
            token: input.token,
            created_at: now,
            updated_at: now,
        };
        self.repo.create(server).await
    }
}
