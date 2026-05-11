use async_trait::async_trait;
use uuid::Uuid;
use koas_errors::AppError;
use super::server::Server;

#[async_trait]
pub trait ServerRepository: Send + Sync {
    async fn list(&self) -> Result<Vec<Server>, AppError>;
    async fn find_by_id(&self, id: Uuid) -> Result<Option<Server>, AppError>;
    async fn create(&self, server: Server) -> Result<Server, AppError>;
    async fn delete(&self, id: Uuid) -> Result<(), AppError>;
}
