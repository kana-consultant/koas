use std::sync::Arc;
use crate::domain::error::KoasResult;
use crate::domain::packages::{Package, PackageRepository};

pub struct ListPackagesUseCase {
    repo: Arc<dyn PackageRepository>,
}
impl ListPackagesUseCase {
    pub fn new(repo: Arc<dyn PackageRepository>) -> Self { Self { repo } }
    pub async fn execute(&self) -> KoasResult<Vec<Package>> { self.repo.list_installed().await }
    pub fn manager_name(&self) -> &str { self.repo.manager_name() }
}

pub struct SearchPackagesUseCase {
    repo: Arc<dyn PackageRepository>,
}
impl SearchPackagesUseCase {
    pub fn new(repo: Arc<dyn PackageRepository>) -> Self { Self { repo } }
    pub async fn execute(&self, query: &str) -> KoasResult<Vec<Package>> { self.repo.search(query).await }
}

pub struct InstallPackageUseCase {
    repo: Arc<dyn PackageRepository>,
}
impl InstallPackageUseCase {
    pub fn new(repo: Arc<dyn PackageRepository>) -> Self { Self { repo } }
    pub async fn execute(&self, name: &str) -> KoasResult<()> { self.repo.install(name).await }
}

pub struct RemovePackageUseCase {
    repo: Arc<dyn PackageRepository>,
}
impl RemovePackageUseCase {
    pub fn new(repo: Arc<dyn PackageRepository>) -> Self { Self { repo } }
    pub async fn execute(&self, name: &str) -> KoasResult<()> { self.repo.remove(name).await }
}

pub struct UpgradePackagesUseCase {
    repo: Arc<dyn PackageRepository>,
}
impl UpgradePackagesUseCase {
    pub fn new(repo: Arc<dyn PackageRepository>) -> Self { Self { repo } }
    pub async fn execute(&self) -> KoasResult<()> { self.repo.upgrade_all().await }
}
