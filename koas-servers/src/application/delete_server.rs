use std::sync::Arc;
use uuid::Uuid;
use koas_errors::AppError;
use crate::domain::repository::ServerRepository;

pub struct DeleteServer {
    repo: Arc<dyn ServerRepository>,
}

impl DeleteServer {
    pub fn new(repo: Arc<dyn ServerRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self, id: Uuid) -> Result<(), AppError> {
        self.repo
            .find_by_id(id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Server {} not found", id)))?;
        self.repo.delete(id).await
    }
}
