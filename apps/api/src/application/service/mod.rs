use std::sync::Arc;
use crate::domain::error::KoasResult;
use crate::domain::service::{LogEntry, LogOptions, ServiceAction, ServiceInfo, ServiceRepository, ServiceStatus};

pub struct ListServicesUseCase {
    repo: Arc<dyn ServiceRepository>,
}
impl ListServicesUseCase {
    pub fn new(repo: Arc<dyn ServiceRepository>) -> Self { Self { repo } }
    pub async fn execute(&self) -> KoasResult<Vec<ServiceInfo>> { self.repo.list().await }
}

pub struct GetServiceUseCase {
    repo: Arc<dyn ServiceRepository>,
}
impl GetServiceUseCase {
    pub fn new(repo: Arc<dyn ServiceRepository>) -> Self { Self { repo } }
    pub async fn execute(&self, name: &str) -> KoasResult<ServiceStatus> { self.repo.get(name).await }
}

pub struct ServiceActionUseCase {
    repo: Arc<dyn ServiceRepository>,
}
impl ServiceActionUseCase {
    pub fn new(repo: Arc<dyn ServiceRepository>) -> Self { Self { repo } }
    pub async fn execute(&self, name: &str, action: &ServiceAction) -> KoasResult<()> {
        self.repo.execute_action(name, action).await
    }
}

pub struct GetServiceLogsUseCase {
    repo: Arc<dyn ServiceRepository>,
}
impl GetServiceLogsUseCase {
    pub fn new(repo: Arc<dyn ServiceRepository>) -> Self { Self { repo } }
    pub async fn execute(&self, name: &str, opts: &LogOptions) -> KoasResult<Vec<LogEntry>> {
        self.repo.get_logs(name, opts).await
    }
}
