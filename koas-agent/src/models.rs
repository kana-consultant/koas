use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct HealthStatus {
    pub status: &'static str,
    pub version: &'static str,
}

#[derive(Serialize)]
pub struct SystemdService {
    pub name: String,
    pub load: String,
    pub active: String,
    pub sub: String,
    pub description: String,
}

#[derive(Serialize, Deserialize)]
pub struct DockerContainer {
    pub id: String,
    pub name: String,
    pub image: String,
    pub status: String,
    pub ports: String,
    pub created: String,
}

#[derive(Serialize)]
pub struct ProcessInfo {
    pub pid: u32,
    pub name: String,
    pub cpu_usage: f32,
    pub memory_kb: u64,
    pub status: String,
}

#[derive(Serialize)]
pub struct NginxSite {
    pub name: String,
    pub config_file: String,
    pub server_names: Vec<String>,
    pub listen_ports: Vec<String>,
    pub enabled: bool,
}

#[derive(Serialize)]
pub struct PortInfo {
    pub protocol: String,
    pub local_address: String,
    pub local_port: u16,
    pub state: String,
    pub process: Option<String>,
}

#[derive(Serialize)]
pub struct Resources {
    pub cpu_usage: f32,
    pub memory_total: u64,
    pub memory_used: u64,
    pub memory_percent: f32,
    pub disk_total: u64,
    pub disk_used: u64,
    pub disk_percent: f32,
    pub load_avg_1: f64,
    pub load_avg_5: f64,
    pub load_avg_15: f64,
    pub uptime_seconds: u64,
}
