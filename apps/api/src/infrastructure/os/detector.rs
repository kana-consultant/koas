use tokio::process::Command;
use crate::domain::system::types::{OsFamily, OsInfo};

pub async fn detect_os() -> OsInfo {
    match std::env::consts::OS {
        "macos" => detect_macos().await,
        "freebsd" => detect_freebsd().await,
        _ => detect_linux().await,
    }
}

async fn detect_macos() -> OsInfo {
    OsInfo {
        family: OsFamily::MacOs,
        name: "macOS".into(),
        version: run("sw_vers -productVersion").await.unwrap_or_default(),
        kernel: run("uname -r").await.unwrap_or_default(),
        hostname: run("hostname").await.unwrap_or_default(),
        arch: run("uname -m").await.unwrap_or_default(),
        uptime_seconds: parse_macos_uptime().await,
    }
}

async fn detect_freebsd() -> OsInfo {
    OsInfo {
        family: OsFamily::FreeBsd,
        name: "FreeBSD".into(),
        version: run("freebsd-version").await.unwrap_or_default(),
        kernel: run("uname -r").await.unwrap_or_default(),
        hostname: run("hostname").await.unwrap_or_default(),
        arch: run("uname -m").await.unwrap_or_default(),
        uptime_seconds: parse_proc_uptime().await,
    }
}

async fn detect_linux() -> OsInfo {
    let os_release = tokio::fs::read_to_string("/etc/os-release").await.unwrap_or_default();
    let id = extract_field(&os_release, "ID").unwrap_or_default();
    let id_like = extract_field(&os_release, "ID_LIKE").unwrap_or_default();
    OsInfo {
        family: classify_linux(&id, &id_like),
        name: extract_field(&os_release, "NAME").unwrap_or_else(|| "Linux".into()),
        version: extract_field(&os_release, "VERSION_ID").unwrap_or_else(|| "unknown".into()),
        kernel: run("uname -r").await.unwrap_or_default(),
        hostname: run("hostname").await.unwrap_or_default(),
        arch: run("uname -m").await.unwrap_or_default(),
        uptime_seconds: parse_proc_uptime().await,
    }
}

fn classify_linux(id: &str, id_like: &str) -> OsFamily {
    let s = format!("{} {}", id, id_like).to_lowercase();
    if s.contains("nixos") { OsFamily::Nix }
    else if s.contains("debian") || s.contains("ubuntu") { OsFamily::Debian }
    else if s.contains("rhel") || s.contains("fedora") || s.contains("centos") { OsFamily::Rhel }
    else if s.contains("arch") || s.contains("manjaro") { OsFamily::Arch }
    else if s.contains("suse") { OsFamily::Suse }
    else if s.contains("alpine") { OsFamily::Alpine }
    else if s.contains("gentoo") { OsFamily::Gentoo }
    else { OsFamily::Unknown }
}

fn extract_field(content: &str, key: &str) -> Option<String> {
    content.lines()
        .find(|l| l.starts_with(&format!("{}=", key)))
        .map(|l| l.splitn(2, '=').nth(1).unwrap_or("").trim_matches('"').to_string())
}

async fn parse_proc_uptime() -> u64 {
    tokio::fs::read_to_string("/proc/uptime").await.ok()
        .and_then(|s| s.split_whitespace().next().and_then(|v| v.parse::<f64>().ok()))
        .map(|s| s as u64).unwrap_or(0)
}

async fn parse_macos_uptime() -> u64 {
    let out = run("sysctl -n kern.boottime").await.unwrap_or_default();
    let sec = out.split("sec = ").nth(1)
        .and_then(|s| s.split(',').next())
        .and_then(|s| s.trim().parse::<i64>().ok()).unwrap_or(0);
    (chrono::Utc::now().timestamp() - sec).max(0) as u64
}

async fn run(cmd: &str) -> Option<String> {
    let parts: Vec<&str> = cmd.split_whitespace().collect();
    Command::new(parts[0]).args(&parts[1..]).output().await.ok()
        .filter(|o| o.status.success())
        .map(|o| String::from_utf8_lossy(&o.stdout).trim().to_string())
}
