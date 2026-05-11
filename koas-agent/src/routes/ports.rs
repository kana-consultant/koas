use axum::Json;
use std::process::Command;
use koas_errors::AppError;
use crate::models::PortInfo;

pub async fn handler() -> Result<Json<Vec<PortInfo>>, AppError> {
    let output = Command::new("ss")
        .args(["-tlnp"])
        .output()
        .map_err(|e| AppError::InternalError(e.to_string()))?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let ports = stdout
        .lines()
        .skip(1)
        .filter(|l| !l.trim().is_empty())
        .filter_map(parse_ss_line)
        .collect();

    Ok(Json(ports))
}

fn parse_ss_line(line: &str) -> Option<PortInfo> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() < 5 {
        return None;
    }

    let local_addr = parts[3];
    let (addr, port_str) = local_addr.rsplit_once(':')?;
    let local_port = port_str.parse().ok()?;

    let process = parts.get(5).map(|s| {
        s.trim_start_matches("users:((")
            .trim_end_matches("))")
            .to_string()
    });

    Some(PortInfo {
        protocol: "tcp".to_string(),
        local_address: addr.to_string(),
        local_port,
        state: parts[0].to_string(),
        process,
    })
}
