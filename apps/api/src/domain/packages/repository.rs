use async_trait::async_trait;
use super::types::Package;
use crate::domain::error::KoasResult;

#[async_trait]
pub trait PackageRepository: Send + Sync {
    fn manager_name(&self) -> &str;
    async fn list_installed(&self) -> KoasResult<Vec<Package>>;
    async fn search(&self, query: &str) -> KoasResult<Vec<Package>>;
    async fn install(&self, name: &str) -> KoasResult<()>;
    async fn remove(&self, name: &str) -> KoasResult<()>;
    async fn upgrade_all(&self) -> KoasResult<()>;
}
