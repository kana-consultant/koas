use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ServiceState {
    Active,
    Inactive,
    Failed,
    Activating,
    Deactivating,
    Reloading,
    Unknown,
}

impl std::fmt::Display for ServiceState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            Self::Active => "active",
            Self::Inactive => "inactive",
            Self::Failed => "failed",
            Self::Activating => "activating",
            Self::Deactivating => "deactivating",
            Self::Reloading => "reloading",
            Self::Unknown => "unknown",
        };
        write!(f, "{}", s)
    }
}

impl From<&str> for ServiceState {
    fn from(s: &str) -> Self {
        match s {
            "active" => Self::Active,
            "inactive" => Self::Inactive,
            "failed" => Self::Failed,
            "activating" => Self::Activating,
            "deactivating" => Self::Deactivating,
            "reloading" => Self::Reloading,
            _ => Self::Unknown,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceInfo {
    pub name: String,
    pub description: String,
    pub active_state: ServiceState,
    pub sub_state: String,
    pub load_state: String,
    pub enabled: bool,
    pub main_pid: Option<u32>,
    pub memory_bytes: Option<u64>,
    pub started_at: Option<DateTime<Utc>>,
    pub unit_file_path: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceStatus {
    pub info: ServiceInfo,
    pub recent_logs: Vec<LogEntry>,
    pub requires: Vec<String>,
    pub wanted_by: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub timestamp: Option<DateTime<Utc>>,
    pub message: String,
    pub priority: u8,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogOptions {
    pub lines: Option<u32>,
    pub follow: bool,
}

impl Default for LogOptions {
    fn default() -> Self {
        Self { lines: Some(100), follow: false }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ServiceAction {
    Start,
    Stop,
    Restart,
    Reload,
    Enable,
    Disable,
}

impl std::fmt::Display for ServiceAction {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            Self::Start => "start",
            Self::Stop => "stop",
            Self::Restart => "restart",
            Self::Reload => "reload",
            Self::Enable => "enable",
            Self::Disable => "disable",
        };
        write!(f, "{}", s)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServiceActionRequest {
    pub action: ServiceAction,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OutputLine {
    pub stream: String,
    pub line: String,
}
