use async_trait::async_trait;
use tokio::process::Command;
use crate::domain::error::{KoasError, KoasResult};
use crate::domain::service::{LogEntry, LogOptions, ServiceAction, ServiceInfo, ServiceRepository, ServiceState, ServiceStatus};
use crate::domain::system::OsFamily;

pub struct ServiceManager {
    pub os_family: OsFamily,
}

impl ServiceManager {
    pub fn new(os_family: OsFamily) -> Self { Self { os_family } }
}

#[async_trait]
impl ServiceRepository for ServiceManager {
    async fn list(&self) -> KoasResult<Vec<ServiceInfo>> {
        match self.os_family {
            OsFamily::MacOs => list_launchctl().await,
            OsFamily::FreeBsd => list_rc().await,
            _ => list_systemd().await,
        }
    }

    async fn get(&self, name: &str) -> KoasResult<ServiceStatus> {
        match self.os_family {
            OsFamily::MacOs => get_launchctl(name).await,
            _ => get_systemd(name).await,
        }
    }

    async fn execute_action(&self, name: &str, action: &ServiceAction) -> KoasResult<()> {
        match self.os_family {
            OsFamily::MacOs => launchctl_action(name, action).await,
            OsFamily::FreeBsd => rc_action(name, action).await,
            _ => systemctl_action(name, action).await,
        }
    }

    async fn get_logs(&self, name: &str, opts: &LogOptions) -> KoasResult<Vec<LogEntry>> {
        match self.os_family {
            OsFamily::MacOs => get_macos_logs(name, opts).await,
            _ => get_journald_logs(name, opts).await,
        }
    }
}

async fn run(cmd: &str, args: &[&str]) -> KoasResult<String> {
    let out = Command::new(cmd).args(args).output().await?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

fn parse_log_lines(output: &str) -> Vec<LogEntry> {
    output.lines().filter(|l| !l.trim().is_empty())
        .map(|line| LogEntry { timestamp: None, message: line.to_string(), priority: 6 })
        .collect()
}

async fn list_systemd() -> KoasResult<Vec<ServiceInfo>> {
    let out = run("systemctl", &["list-units", "--type=service", "--all", "--no-pager", "--no-legend", "--plain"]).await?;
    Ok(out.lines().filter_map(|line| {
        let p: Vec<&str> = line.split_whitespace().collect();
        if p.len() < 4 { return None; }
        Some(ServiceInfo {
            name: p[0].trim_end_matches(".service").to_string(),
            description: p[4..].join(" "),
            active_state: ServiceState::from(p[2]),
            sub_state: p[3].to_string(),
            load_state: p[1].to_string(),
            enabled: false, main_pid: None, memory_bytes: None,
            started_at: None, unit_file_path: None,
        })
    }).collect())
}

async fn get_systemd(name: &str) -> KoasResult<ServiceStatus> {
    let unit = if name.ends_with(".service") { name.to_string() } else { format!("{}.service", name) };
    let out = run("systemctl", &["show", &unit, "--no-pager"]).await?;
    let mut info = ServiceInfo {
        name: name.to_string(), description: String::new(),
        active_state: ServiceState::Unknown, sub_state: String::new(),
        load_state: String::new(), enabled: false, main_pid: None,
        memory_bytes: None, started_at: None, unit_file_path: None,
    };
    for line in out.lines() {
        if let Some((k, v)) = line.split_once('=') {
            match k {
                "Description" => info.description = v.to_string(),
                "ActiveState" => info.active_state = ServiceState::from(v),
                "SubState" => info.sub_state = v.to_string(),
                "LoadState" => info.load_state = v.to_string(),
                "UnitFileState" => info.enabled = v == "enabled",
                "MainPID" => info.main_pid = v.parse().ok(),
                "MemoryCurrent" => info.memory_bytes = v.parse().ok(),
                "FragmentPath" => info.unit_file_path = Some(v.to_string()),
                _ => {}
            }
        }
    }
    let logs = get_journald_logs(name, &LogOptions { lines: Some(50), follow: false }).await.unwrap_or_default();
    Ok(ServiceStatus { info, recent_logs: logs, requires: vec![], wanted_by: vec![] })
}

async fn systemctl_action(name: &str, action: &ServiceAction) -> KoasResult<()> {
    let unit = if name.ends_with(".service") { name.to_string() } else { format!("{}.service", name) };
    run("systemctl", &[&action.to_string(), &unit]).await?;
    Ok(())
}

async fn get_journald_logs(name: &str, opts: &LogOptions) -> KoasResult<Vec<LogEntry>> {
    let lines = opts.lines.unwrap_or(100).to_string();
    let unit = if name.ends_with(".service") { name.to_string() } else { format!("{}.service", name) };
    let out = run("journalctl", &["-u", &unit, "-n", &lines, "--no-pager", "--output=short-iso"])
        .await.unwrap_or_default();
    Ok(parse_log_lines(&out))
}

async fn list_launchctl() -> KoasResult<Vec<ServiceInfo>> {
    let out = run("launchctl", &["list"]).await?;
    Ok(out.lines().skip(1).filter_map(|line| {
        let p: Vec<&str> = line.splitn(3, '\t').collect();
        if p.len() < 3 { return None; }
        let pid: Option<u32> = p[0].parse().ok();
        Some(ServiceInfo {
            name: p[2].trim().to_string(),
            description: String::new(),
            active_state: if pid.is_some() { ServiceState::Active } else { ServiceState::Inactive },
            sub_state: String::new(), load_state: "loaded".into(),
            enabled: true, main_pid: pid, memory_bytes: None,
            started_at: None, unit_file_path: None,
        })
    }).collect())
}

async fn get_launchctl(name: &str) -> KoasResult<ServiceStatus> {
    let out = run("launchctl", &["list", name]).await.unwrap_or_default();
    let pid: Option<u32> = out.lines()
        .find(|l| l.contains("\"PID\""))
        .and_then(|l| l.split('=').nth(1))
        .and_then(|v| v.trim().trim_end_matches(';').parse().ok());
    let info = ServiceInfo {
        name: name.to_string(), description: String::new(),
        active_state: if pid.is_some() { ServiceState::Active } else { ServiceState::Inactive },
        sub_state: String::new(), load_state: "loaded".into(),
        enabled: true, main_pid: pid, memory_bytes: None,
        started_at: None, unit_file_path: None,
    };
    Ok(ServiceStatus { info, recent_logs: vec![], requires: vec![], wanted_by: vec![] })
}

async fn launchctl_action(name: &str, action: &ServiceAction) -> KoasResult<()> {
    match action {
        ServiceAction::Start => { run("launchctl", &["load", "-w", name]).await?; }
        ServiceAction::Stop => { run("launchctl", &["unload", "-w", name]).await?; }
        ServiceAction::Restart => {
            run("launchctl", &["unload", name]).await.ok();
            run("launchctl", &["load", name]).await?;
        }
        _ => return Err(KoasError::UnsupportedOs("Only start/stop/restart on macOS".into())),
    }
    Ok(())
}

async fn list_rc() -> KoasResult<Vec<ServiceInfo>> {
    let out = run("service", &["-e"]).await?;
    Ok(out.lines().map(|name| ServiceInfo {
        name: name.trim().to_string(), description: String::new(),
        active_state: ServiceState::Unknown, sub_state: String::new(),
        load_state: "loaded".into(), enabled: true, main_pid: None,
        memory_bytes: None, started_at: None, unit_file_path: None,
    }).collect())
}

async fn rc_action(name: &str, action: &ServiceAction) -> KoasResult<()> {
    run("service", &[name, &action.to_string()]).await?;
    Ok(())
}

async fn get_macos_logs(name: &str, opts: &LogOptions) -> KoasResult<Vec<LogEntry>> {
    let n = opts.lines.unwrap_or(100) as usize;
    let out = run("log", &["show", "--predicate", &format!("process == '{}'", name), "--last", "1h", "--style", "compact"])
        .await.unwrap_or_default();
    Ok(parse_log_lines(&out).into_iter().take(n).collect())
}
