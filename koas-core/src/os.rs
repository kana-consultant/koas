use serde::{Deserialize, Serialize};
use tokio::process::Command;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OsFamily {
    Debian,   // Ubuntu, Debian, Linux Mint, Pop!_OS …
    Rhel,     // RHEL, Fedora, CentOS, AlmaLinux, Rocky …
    Arch,     // Arch Linux, Manjaro, EndeavourOS …
    Suse,     // openSUSE, SLES …
    Alpine,   // Alpine Linux
    Gentoo,   // Gentoo Linux
    Nix,      // NixOS
    MacOs,    // macOS (Homebrew)
    FreeBsd,  // FreeBSD
    Unknown,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct OsInfo {
    pub family: OsFamily,
    pub name: String,
    pub version: String,
    pub kernel: String,
    pub hostname: String,
    pub arch: String,
    pub uptime_seconds: u64,
}

pub async fn detect_os() -> OsInfo {
    let os = std::env::consts::OS;

    // macOS
    if os == "macos" {
        return detect_macos().await;
    }

    // FreeBSD
    if os == "freebsd" {
        return detect_freebsd().await;
    }

    // Linux — read /etc/os-release
    detect_linux().await
}

async fn detect_macos() -> OsInfo {
    let hostname = run("hostname").await.unwrap_or_default();
    let kernel = run("uname -r").await.unwrap_or_default();
    let version = run("sw_vers -productVersion").await.unwrap_or_default();
    let arch = run("uname -m").await.unwrap_or_default();
    let uptime_seconds = parse_macos_uptime().await;

    OsInfo {
        family: OsFamily::MacOs,
        name: "macOS".into(),
        version,
        kernel,
        hostname,
        arch,
        uptime_seconds,
    }
}

async fn detect_freebsd() -> OsInfo {
    let hostname = run("hostname").await.unwrap_or_default();
    let kernel = run("uname -r").await.unwrap_or_default();
    let version = run("freebsd-version").await.unwrap_or_default();
    let arch = run("uname -m").await.unwrap_or_default();
    let uptime_seconds = parse_proc_uptime().await;

    OsInfo {
        family: OsFamily::FreeBsd,
        name: "FreeBSD".into(),
        version,
        kernel,
        hostname,
        arch,
        uptime_seconds,
    }
}

async fn detect_linux() -> OsInfo {
    let hostname = run("hostname").await.unwrap_or_default();
    let kernel = run("uname -r").await.unwrap_or_default();
    let arch = run("uname -m").await.unwrap_or_default();
    let uptime_seconds = parse_proc_uptime().await;

    let os_release = tokio::fs::read_to_string("/etc/os-release").await.unwrap_or_default();
    let name = extract_os_field(&os_release, "NAME").unwrap_or_else(|| "Linux".into());
    let version = extract_os_field(&os_release, "VERSION_ID").unwrap_or_else(|| "unknown".into());
    let id = extract_os_field(&os_release, "ID").unwrap_or_default();
    let id_like = extract_os_field(&os_release, "ID_LIKE").unwrap_or_default();

    let family = classify_linux(&id, &id_like);

    OsInfo { family, name, version, kernel, hostname, arch, uptime_seconds }
}

fn classify_linux(id: &str, id_like: &str) -> OsFamily {
    let combined = format!("{} {}", id, id_like).to_lowercase();
    if combined.contains("nixos") || id == "nixos" {
        OsFamily::Nix
    } else if combined.contains("debian") || combined.contains("ubuntu") {
        OsFamily::Debian
    } else if combined.contains("rhel") || combined.contains("fedora") || combined.contains("centos") {
        OsFamily::Rhel
    } else if combined.contains("arch") || combined.contains("manjaro") {
        OsFamily::Arch
    } else if combined.contains("suse") {
        OsFamily::Suse
    } else if combined.contains("alpine") {
        OsFamily::Alpine
    } else if combined.contains("gentoo") {
        OsFamily::Gentoo
    } else {
        OsFamily::Unknown
    }
}

fn extract_os_field(content: &str, key: &str) -> Option<String> {
    for line in content.lines() {
        if let Some(rest) = line.strip_prefix(&format!("{}=", key)) {
            return Some(rest.trim_matches('"').to_string());
        }
    }
    None
}

async fn parse_proc_uptime() -> u64 {
    tokio::fs::read_to_string("/proc/uptime")
        .await
        .ok()
        .and_then(|s| s.split_whitespace().next().and_then(|v| v.parse::<f64>().ok()))
        .map(|s| s as u64)
        .unwrap_or(0)
}

async fn parse_macos_uptime() -> u64 {
    // `sysctl -n kern.boottime` returns something like { sec = 1234567890, usec = 0 }
    let out = run("sysctl -n kern.boottime").await.unwrap_or_default();
    let sec = out
        .split("sec = ")
        .nth(1)
        .and_then(|s| s.split(',').next())
        .and_then(|s| s.trim().parse::<i64>().ok())
        .unwrap_or(0);
    let now = chrono::Utc::now().timestamp();
    (now - sec).max(0) as u64
}

async fn run(cmd: &str) -> Option<String> {
    let parts: Vec<&str> = cmd.split_whitespace().collect();
    let out = Command::new(parts[0])
        .args(&parts[1..])
        .output()
        .await
        .ok()?;
    if out.status.success() {
        Some(String::from_utf8_lossy(&out.stdout).trim().to_string())
    } else {
        None
    }
}
