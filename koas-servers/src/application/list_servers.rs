use std::sync::Arc;
use koas_errors::AppError;
use crate::domain::{repository::ServerRepository, server::Server};

pub struct ListServers {
    repo: Arc<dyn ServerRepository>,
}

impl ListServers {
    pub fn new(repo: Arc<dyn ServerRepository>) -> Self {
        Self { repo }
    }

    pub async fn execute(&self) -> Result<Vec<Server>, AppError> {
        self.repo.list().await
    }
}
