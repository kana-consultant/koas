use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;
use chrono::Utc;
use crate::error::{KoasError, KoasResult};
use crate::ssh::{auth::SshCredentials, session::SshSession, types::SshTarget};
use super::types::{CreateMachineRequest, Machine, MachineId, MachineStatus, UpdateMachineRequest};

#[derive(Clone)]
pub struct MachineManager {
    storage_dir: PathBuf,
    cache: Arc<RwLock<Vec<Machine>>>,
}

impl MachineManager {
    pub fn new(storage_dir: PathBuf) -> Self {
        Self {
            storage_dir,
            cache: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn load(&self) -> KoasResult<()> {
        let mut machines = Vec::new();
        let mut dir = tokio::fs::read_dir(&self.storage_dir).await?;
        while let Some(entry) = dir.next_entry().await? {
            if entry.path().extension().and_then(|e| e.to_str()) == Some("json") {
                let content = tokio::fs::read_to_string(entry.path()).await?;
                if let Ok(machine) = serde_json::from_str::<Machine>(&content) {
                    machines.push(machine);
                }
            }
        }
        machines.sort_by(|a, b| a.created_at.cmp(&b.created_at));
        *self.cache.write().await = machines;
        Ok(())
    }

    pub async fn list(&self) -> Vec<Machine> {
        self.cache.read().await.clone()
    }

    pub async fn get(&self, id: &str) -> KoasResult<Machine> {
        self.cache.read().await
            .iter()
            .find(|m| m.id.0 == id)
            .cloned()
            .ok_or_else(|| KoasError::NotFound(format!("Machine {} not found", id)))
    }

    pub async fn create(&self, req: CreateMachineRequest) -> KoasResult<Machine> {
        let now = Utc::now();
        let machine = Machine {
            id: MachineId::new(),
            name: req.name,
            description: req.description,
            host: req.host,
            port: req.port.unwrap_or(22),
            username: req.username,
            auth: req.auth,
            tags: req.tags.unwrap_or_default(),
            status: MachineStatus::Unknown,
            last_seen: None,
            created_at: now,
            updated_at: now,
        };
        self.save(&machine).await?;
        self.cache.write().await.push(machine.clone());
        Ok(machine)
    }

    pub async fn update(&self, id: &str, req: UpdateMachineRequest) -> KoasResult<Machine> {
        let mut cache = self.cache.write().await;
        let machine = cache.iter_mut().find(|m| m.id.0 == id)
            .ok_or_else(|| KoasError::NotFound(format!("Machine {} not found", id)))?;
        if let Some(name) = req.name { machine.name = name; }
        if let Some(desc) = req.description { machine.description = Some(desc); }
        if let Some(host) = req.host { machine.host = host; }
        if let Some(port) = req.port { machine.port = port; }
        if let Some(user) = req.username { machine.username = user; }
        if let Some(auth) = req.auth { machine.auth = auth; }
        if let Some(tags) = req.tags { machine.tags = tags; }
        machine.updated_at = Utc::now();
        let updated = machine.clone();
        drop(cache);
        self.save(&updated).await?;
        Ok(updated)
    }

    pub async fn delete(&self, id: &str) -> KoasResult<()> {
        let mut cache = self.cache.write().await;
        let idx = cache.iter().position(|m| m.id.0 == id)
            .ok_or_else(|| KoasError::NotFound(format!("Machine {} not found", id)))?;
        cache.remove(idx);
        let path = self.storage_dir.join(format!("{}.json", id));
        tokio::fs::remove_file(path).await.ok();
        Ok(())
    }

    pub async fn test_connection(&self, id: &str) -> KoasResult<Machine> {
        let mut machine = self.get(id).await?;
        let creds = SshCredentials { username: machine.username.clone(), auth: machine.auth.clone() };
        let target = SshTarget { host: machine.host.clone(), port: machine.port, credentials: creds };
        let (status, last_seen) = match SshSession::connect(&target).await {
            Ok(session) => {
                let ok = session.test_connection().await.is_ok();
                let _ = session.close().await;
                if ok { (MachineStatus::Online, Some(Utc::now())) } else { (MachineStatus::Offline, None) }
            }
            Err(KoasError::Ssh(e)) if e.contains("auth") => (MachineStatus::AuthFailed, None),
            Err(_) => (MachineStatus::Offline, None),
        };
        machine.status = status;
        machine.last_seen = last_seen;
        machine.updated_at = Utc::now();
        self.save(&machine).await?;
        let mut cache = self.cache.write().await;
        if let Some(m) = cache.iter_mut().find(|m| m.id.0 == id) {
            m.status = machine.status.clone();
            m.last_seen = machine.last_seen;
            m.updated_at = machine.updated_at;
        }
        Ok(machine)
    }

    async fn save(&self, machine: &Machine) -> KoasResult<()> {
        let path = self.storage_dir.join(format!("{}.json", machine.id.0));
        let content = serde_json::to_string_pretty(machine)?;
        tokio::fs::write(path, content).await?;
        Ok(())
    }
}
