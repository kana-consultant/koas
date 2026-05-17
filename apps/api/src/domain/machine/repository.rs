use async_trait::async_trait;
use super::types::{CreateMachineRequest, Machine, UpdateMachineRequest};
use crate::domain::error::KoasResult;

#[async_trait]
pub trait MachineRepository: Send + Sync {
    async fn list(&self) -> KoasResult<Vec<Machine>>;
    async fn get(&self, id: &str) -> KoasResult<Machine>;
    async fn create(&self, req: CreateMachineRequest) -> KoasResult<Machine>;
    async fn update(&self, id: &str, req: UpdateMachineRequest) -> KoasResult<Machine>;
    async fn delete(&self, id: &str) -> KoasResult<()>;
    async fn test_connection(&self, id: &str) -> KoasResult<Machine>;
}
