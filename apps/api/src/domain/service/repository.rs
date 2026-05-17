use async_trait::async_trait;
use super::types::{LogEntry, LogOptions, ServiceAction, ServiceInfo, ServiceStatus};
use crate::domain::error::KoasResult;

#[async_trait]
pub trait ServiceRepository: Send + Sync {
    async fn list(&self) -> KoasResult<Vec<ServiceInfo>>;
    async fn get(&self, name: &str) -> KoasResult<ServiceStatus>;
    async fn execute_action(&self, name: &str, action: &ServiceAction) -> KoasResult<()>;
    async fn get_logs(&self, name: &str, opts: &LogOptions) -> KoasResult<Vec<LogEntry>>;
}
