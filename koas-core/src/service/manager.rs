use tokio::process::Command;
use crate::error::{KoasError, KoasResult};
use crate::os::OsFamily;
use super::types::{LogEntry, LogOptions, ServiceAction, ServiceInfo, ServiceState, ServiceStatus};

pub struct ServiceManager {
    pub os_family: OsFamily,
}

impl ServiceManager {
    pub fn new(os_family: OsFamily) -> Self {
        Self { os_family }
    }

    pub async fn list_services(&self) -> KoasResult<Vec<ServiceInfo>> {
        match self.os_family {
            OsFamily::MacOs => self.list_launchctl().await,
            OsFamily::FreeBsd => self.list_rc_services().await,
            _ => self.list_systemd().await,
        }
    }

    pub async fn get_service_status(&self, name: &str) -> KoasResult<ServiceStatus> {
        match self.os_family {
            OsFamily::MacOs => self.get_launchctl_status(name).await,
            _ => self.get_systemd_status(name).await,
        }
    }

    pub async fn service_action(&self, name: &str, action: &ServiceAction) -> KoasResult<String> {
        match self.os_family {
            OsFamily::MacOs => self.launchctl_action(name, action).await,
            OsFamily::FreeBsd => self.rc_action(name, action).await,
            _ => self.systemctl_action(name, action).await,
        }
    }

    pub async fn get_logs(&self, name: &str, opts: &LogOptions) -> KoasResult<Vec<LogEntry>> {
        match self.os_family {
            OsFamily::MacOs => self.get_macos_logs(name, opts).await,
            _ => self.get_journald_logs(name, opts).await,
        }
    }

    // --- systemd ---

    async fn list_systemd(&self) -> KoasResult<Vec<ServiceInfo>> {
        let out = run("systemctl", &["list-units", "--type=service", "--all", "--no-pager", "--no-legend", "--plain"]).await?;
        let mut services = Vec::new();
        for line in out.lines() {
            let parts: Vec<&str> = line.split_whitespace().collect();
            if parts.len() < 4 { continue; }
            let name = parts[0].trim_end_matches(".service").to_string();
            let load = parts[1].to_string();
            let active = ServiceState::from(parts[2]);
            let sub = parts[3].to_string();
            let desc = parts[4..].join(" ");
            services.push(ServiceInfo {
                name,
                description: desc,
                active_state: active,
                sub_state: sub,
                load_state: load,
                enabled: false,
                main_pid: None,
                memory_bytes: None,
                started_at: None,
                unit_file_path: None,
            });
        }
        Ok(services)
    }

    async fn get_systemd_status(&self, name: &str) -> KoasResult<ServiceStatus> {
        let unit = if name.ends_with(".service") { name.to_string() } else { format!("{}.service", name) };
        let out = run("systemctl", &["show", &unit, "--no-pager"]).await?;
        let mut info = ServiceInfo {
            name: name.to_string(),
            description: String::new(),
            active_state: ServiceState::Unknown,
            sub_state: String::new(),
            load_state: String::new(),
            enabled: false,
            main_pid: None,
            memory_bytes: None,
            started_at: None,
            unit_file_path: None,
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
        let logs = self.get_journald_logs(name, &LogOptions { lines: Some(50), follow: false }).await.unwrap_or_default();
        Ok(ServiceStatus { info, recent_logs: logs, requires: vec![], wanted_by: vec![] })
    }

    async fn systemctl_action(&self, name: &str, action: &ServiceAction) -> KoasResult<String> {
        let unit = if name.ends_with(".service") { name.to_string() } else { format!("{}.service", name) };
        let out = run("systemctl", &[&action.to_string(), &unit]).await?;
        Ok(out)
    }

    async fn get_journald_logs(&self, name: &str, opts: &LogOptions) -> KoasResult<Vec<LogEntry>> {
        let lines = opts.lines.unwrap_or(100).to_string();
        let unit = if name.ends_with(".service") { name.to_string() } else { format!("{}.service", name) };
        let out = run("journalctl", &["-u", &unit, "-n", &lines, "--no-pager", "--output=short-iso"]).await
            .unwrap_or_default();
        Ok(parse_journal_lines(&out))
    }

    // --- launchctl (macOS) ---

    async fn list_launchctl(&self) -> KoasResult<Vec<ServiceInfo>> {
        let out = run("launchctl", &["list"]).await?;
        let mut services = Vec::new();
        for line in out.lines().skip(1) {
            let parts: Vec<&str> = line.splitn(3, '\t').collect();
            if parts.len() < 3 { continue; }
            let pid: Option<u32> = parts[0].parse().ok();
            let name = parts[2].trim().to_string();
            let active = if pid.is_some() { ServiceState::Active } else { ServiceState::Inactive };
            services.push(ServiceInfo {
                name,
                description: String::new(),
                active_state: active,
                sub_state: String::new(),
                load_state: "loaded".into(),
                enabled: true,
                main_pid: pid,
                memory_bytes: None,
                started_at: None,
                unit_file_path: None,
            });
        }
        Ok(services)
    }

    async fn get_launchctl_status(&self, name: &str) -> KoasResult<ServiceStatus> {
        let out = run("launchctl", &["list", name]).await.unwrap_or_default();
        let pid: Option<u32> = out.lines()
            .find(|l| l.contains("\"PID\""))
            .and_then(|l| l.split('=').nth(1))
            .and_then(|v| v.trim().trim_end_matches(';').parse().ok());
        let info = ServiceInfo {
            name: name.to_string(),
            description: String::new(),
            active_state: if pid.is_some() { ServiceState::Active } else { ServiceState::Inactive },
            sub_state: String::new(),
            load_state: "loaded".into(),
            enabled: true,
            main_pid: pid,
            memory_bytes: None,
            started_at: None,
            unit_file_path: None,
        };
        Ok(ServiceStatus { info, recent_logs: vec![], requires: vec![], wanted_by: vec![] })
    }

    async fn launchctl_action(&self, name: &str, action: &ServiceAction) -> KoasResult<String> {
        let (cmd, arg) = match action {
            ServiceAction::Start => ("load", "-w"),
            ServiceAction::Stop => ("unload", "-w"),
            ServiceAction::Restart => {
                run("launchctl", &["unload", name]).await.ok();
                ("load", name)
            }
            _ => return Err(KoasError::UnsupportedOs("Only start/stop/restart supported on macOS".into())),
        };
        run("launchctl", &[cmd, arg, name]).await
    }

    // --- rc (FreeBSD) ---

    async fn list_rc_services(&self) -> KoasResult<Vec<ServiceInfo>> {
        let out = run("service", &["-e"]).await?;
        Ok(out.lines().map(|name| ServiceInfo {
            name: name.trim().to_string(),
            description: String::new(),
            active_state: ServiceState::Unknown,
            sub_state: String::new(),
            load_state: "loaded".into(),
            enabled: true,
            main_pid: None,
            memory_bytes: None,
            started_at: None,
            unit_file_path: None,
        }).collect())
    }

    async fn rc_action(&self, name: &str, action: &ServiceAction) -> KoasResult<String> {
        run("service", &[name, &action.to_string()]).await
    }

    // --- macOS logs ---

    async fn get_macos_logs(&self, name: &str, opts: &LogOptions) -> KoasResult<Vec<LogEntry>> {
        let lines = opts.lines.unwrap_or(100);
        let out = run("log", &["show", "--predicate", &format!("process == '{}'", name), "--last", "1h", "--style", "compact"]).await.unwrap_or_default();
        Ok(parse_journal_lines(&out).into_iter().take(lines as usize).collect())
    }
}

async fn run(cmd: &str, args: &[&str]) -> KoasResult<String> {
    let out = Command::new(cmd).args(args).output().await?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

fn parse_journal_lines(output: &str) -> Vec<LogEntry> {
    output.lines()
        .filter(|l| !l.trim().is_empty())
        .map(|line| LogEntry {
            timestamp: None,
            message: line.to_string(),
            priority: 6,
        })
        .collect()
}
