use std::sync::Arc;
use crate::domain::error::KoasResult;
use crate::domain::machine::{CreateMachineRequest, Machine, MachineRepository, UpdateMachineRequest};

pub struct ListMachinesUseCase {
    repo: Arc<dyn MachineRepository>,
}
impl ListMachinesUseCase {
    pub fn new(repo: Arc<dyn MachineRepository>) -> Self { Self { repo } }
    pub async fn execute(&self) -> KoasResult<Vec<Machine>> { self.repo.list().await }
}

pub struct GetMachineUseCase {
    repo: Arc<dyn MachineRepository>,
}
impl GetMachineUseCase {
    pub fn new(repo: Arc<dyn MachineRepository>) -> Self { Self { repo } }
    pub async fn execute(&self, id: &str) -> KoasResult<Machine> { self.repo.get(id).await }
}

pub struct CreateMachineUseCase {
    repo: Arc<dyn MachineRepository>,
}
impl CreateMachineUseCase {
    pub fn new(repo: Arc<dyn MachineRepository>) -> Self { Self { repo } }
    pub async fn execute(&self, req: CreateMachineRequest) -> KoasResult<Machine> { self.repo.create(req).await }
}

pub struct UpdateMachineUseCase {
    repo: Arc<dyn MachineRepository>,
}
impl UpdateMachineUseCase {
    pub fn new(repo: Arc<dyn MachineRepository>) -> Self { Self { repo } }
    pub async fn execute(&self, id: &str, req: UpdateMachineRequest) -> KoasResult<Machine> { self.repo.update(id, req).await }
}

pub struct DeleteMachineUseCase {
    repo: Arc<dyn MachineRepository>,
}
impl DeleteMachineUseCase {
    pub fn new(repo: Arc<dyn MachineRepository>) -> Self { Self { repo } }
    pub async fn execute(&self, id: &str) -> KoasResult<()> { self.repo.delete(id).await }
}

pub struct TestMachineUseCase {
    repo: Arc<dyn MachineRepository>,
}
impl TestMachineUseCase {
    pub fn new(repo: Arc<dyn MachineRepository>) -> Self { Self { repo } }
    pub async fn execute(&self, id: &str) -> KoasResult<Machine> { self.repo.test_connection(id).await }
}
