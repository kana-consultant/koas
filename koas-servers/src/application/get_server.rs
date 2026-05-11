use std::sync::Arc;
use uuid::Uuid;
use koas_errors::AppError;
use crate::domain::{repository::ServerRepository, server::Server};

pub struct GetServer {
    repo: Arc<dyn ServerRepository>,
}

impl GetServer {
    pub fn new(repo: Arc<dyn ServerRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, id: Uuid) -> Result<Server, AppError> {
        self.repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Server {} not found", id)))
    }
}
