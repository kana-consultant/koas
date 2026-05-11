use axum::Json;
use std::process::Command;
use sysinfo::{ProcessesToUpdate, System};
use koas_errors::AppError;
use crate::models::{DockerContainer, NginxSite, ProcessInfo, SystemdService};

pub async fn systemd() -> Result<Json<Vec<SystemdService>>, AppError> {
    let output = Command::new("systemctl")
        .args(["list-units", "--type=service", "--all", "--plain", "--no-legend", "--no-pager"])
        .output()
        .map_err(|e| AppError::InternalError(e.to_string()))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let services = stdout
        .lines()
        .filter(|l| !l.trim().is_empty())
        .filter_map(parse_systemd_line)
        .collect();

    Ok(Json(services))
}

fn parse_systemd_line(line: &str) -> Option<SystemdService> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() < 4 {
        return None;
    }
    Some(SystemdService {
        name: parts[0].to_string(),
        load: parts[1].to_string(),
        active: parts[2].to_string(),
        sub: parts[3].to_string(),
        description: parts[4..].join(" "),
    })
}

pub async fn docker() -> Result<Json<Vec<DockerContainer>>, AppError> {
    let output = Command::new("docker")
        .args([
            "ps",
            "--format",
            r#"{"id":"{{.ID}}","name":"{{.Names}}","image":"{{.Image}}","status":"{{.Status}}","ports":"{{.Ports}}","created":"{{.CreatedAt}}"}"#,
        ])
        .output()
        .map_err(|e| AppError::InternalError(e.to_string()))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let containers = stdout
        .lines()
        .filter(|l| !l.trim().is_empty())
        .filter_map(|l| serde_json::from_str(l).ok())
        .collect();

    Ok(Json(containers))
}

pub async fn processes() -> Result<Json<Vec<ProcessInfo>>, AppError> {
    let mut sys = System::new();
    sys.refresh_processes(ProcessesToUpdate::All, true);

    let mut list: Vec<ProcessInfo> = sys
        .processes()
        .values()
        .map(|p| ProcessInfo {
            pid: p.pid().as_u32(),
            name: p.name().to_string_lossy().to_string(),
            cpu_usage: p.cpu_usage(),
            memory_kb: p.memory() / 1024,
            status: p.status().to_string(),
        })
        .collect();

    list.sort_by(|a, b| b.cpu_usage.partial_cmp(&a.cpu_usage).unwrap_or(std::cmp::Ordering::Equal));
    list.truncate(100);

    Ok(Json(list))
}

pub async fn nginx() -> Result<Json<Vec<NginxSite>>, AppError> {
    let sites_dir = std::path::Path::new("/etc/nginx/sites-enabled");

    if !sites_dir.exists() {
        return Ok(Json(vec![]));
    }

    let entries = std::fs::read_dir(sites_dir)
        .map_err(|e| AppError::InternalError(e.to_string()))?;

    let sites = entries
        .filter_map(|e| e.ok())
        .map(|e| {
            let name = e.file_name().to_string_lossy().to_string();
            let config_file = e.path().to_string_lossy().to_string();
            let content = std::fs::read_to_string(e.path()).unwrap_or_default();
            NginxSite {
                name,
                config_file,
                server_names: extract_nginx_values(&content, "server_name"),
                listen_ports: extract_nginx_values(&content, "listen"),
                enabled: true,
            }
        })
        .collect();

    Ok(Json(sites))
}

fn extract_nginx_values(content: &str, key: &str) -> Vec<String> {
    content
        .lines()
        .filter(|l| l.trim().starts_with(key))
        .flat_map(|l| {
            l.trim()
                .trim_start_matches(key)
                .trim()
                .trim_end_matches(';')
                .split_whitespace()
                .map(|s| s.to_string())
                .collect::<Vec<_>>()
        })
        .collect()
}
