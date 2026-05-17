use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use crate::ssh::auth::SshAuthMethod;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MachineId(pub String);

impl MachineId {
    pub fn new() -> Self {
        Self(uuid::Uuid::new_v4().to_string())
    }
}

impl Default for MachineId {
    fn default() -> Self { Self::new() }
}

impl std::fmt::Display for MachineId {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum MachineStatus {
    Unknown,
    Online,
    Offline,
    AuthFailed,
}

impl Default for MachineStatus {
    fn default() -> Self { Self::Unknown }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Machine {
    pub id: MachineId,
    pub name: String,
    pub description: Option<String>,
    pub host: String,
    pub port: u16,
    pub username: String,
    pub auth: SshAuthMethod,
    pub tags: Vec<String>,
    pub status: MachineStatus,
    pub last_seen: Option<DateTime<Utc>>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateMachineRequest {
    pub name: String,
    pub description: Option<String>,
    pub host: String,
    pub port: Option<u16>,
    pub username: String,
    pub auth: SshAuthMethod,
    pub tags: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UpdateMachineRequest {
    pub name: Option<String>,
    pub description: Option<String>,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub username: Option<String>,
    pub auth: Option<SshAuthMethod>,
    pub tags: Option<Vec<String>>,
}
