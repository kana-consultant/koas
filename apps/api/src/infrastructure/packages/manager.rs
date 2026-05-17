use async_trait::async_trait;
use tokio::process::Command;
use crate::domain::error::{KoasError, KoasResult};
use crate::domain::packages::{Package, PackageManagerKind, PackageRepository};
use crate::domain::system::OsFamily;

pub struct PackageManager {
    pub kind: PackageManagerKind,
}

impl PackageManager {
    pub fn for_os(family: &OsFamily) -> Self {
        let kind = match family {
            OsFamily::Debian => PackageManagerKind::Apt,
            OsFamily::Rhel => PackageManagerKind::Dnf,
            OsFamily::Arch => PackageManagerKind::Pacman,
            OsFamily::Suse => PackageManagerKind::Zypper,
            OsFamily::Alpine => PackageManagerKind::Apk,
            OsFamily::MacOs => PackageManagerKind::Brew,
            OsFamily::FreeBsd => PackageManagerKind::Pkg,
            OsFamily::Nix => PackageManagerKind::Nix,
            _ => PackageManagerKind::Unknown,
        };
        Self { kind }
    }
}

async fn run_cmd(cmd: &str, args: &[&str]) -> KoasResult<String> {
    let out = Command::new(cmd).args(args).output().await?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

fn parse_packages(kind: &PackageManagerKind, output: &str) -> Vec<Package> {
    output.lines().filter(|l| !l.trim().is_empty()).filter_map(|line| {
        match kind {
            PackageManagerKind::Apt => {
                let p: Vec<&str> = line.splitn(3, '\t').collect();
                Some(Package { name: p.first()?.to_string(), version: p.get(1).unwrap_or(&"").to_string(), description: p.get(2).map(|s| s.to_string()), installed: true })
            }
            PackageManagerKind::Pacman | PackageManagerKind::Brew => {
                let p: Vec<&str> = line.splitn(2, ' ').collect();
                Some(Package { name: p.first()?.to_string(), version: p.get(1).unwrap_or(&"").to_string(), description: None, installed: true })
            }
            _ => {
                let p: Vec<&str> = line.splitn(3, '\t').collect();
                Some(Package { name: p.first()?.to_string(), version: p.get(1).unwrap_or(&"").to_string(), description: p.get(2).map(|s| s.to_string()), installed: true })
            }
        }
    }).collect()
}

fn parse_search(kind: &PackageManagerKind, output: &str) -> Vec<Package> {
    match kind {
        PackageManagerKind::Apt => output.lines().filter(|l| !l.trim().is_empty()).filter_map(|line| {
            let (name, desc) = line.split_once(" - ")?;
            Some(Package { name: name.trim().to_string(), version: String::new(), description: Some(desc.trim().to_string()), installed: false })
        }).collect(),
        _ => output.lines().filter(|l| !l.trim().is_empty()).map(|line| {
            let p: Vec<&str> = line.splitn(2, ' ').collect();
            Package { name: p.first().unwrap_or(&"").to_string(), version: String::new(), description: p.get(1).map(|s| s.to_string()), installed: false }
        }).collect(),
    }
}

#[async_trait]
impl PackageRepository for PackageManager {
    fn manager_name(&self) -> &str {
        match self.kind {
            PackageManagerKind::Apt => "apt", PackageManagerKind::Dnf => "dnf",
            PackageManagerKind::Pacman => "pacman", PackageManagerKind::Zypper => "zypper",
            PackageManagerKind::Apk => "apk", PackageManagerKind::Brew => "brew",
            PackageManagerKind::Pkg => "pkg", PackageManagerKind::Nix => "nix",
            PackageManagerKind::Unknown => "unknown",
        }
    }

    async fn list_installed(&self) -> KoasResult<Vec<Package>> {
        let out = match self.kind {
            PackageManagerKind::Apt => run_cmd("dpkg-query", &["-W", "-f=${Package}\t${Version}\t${binary:Summary}\n"]).await?,
            PackageManagerKind::Dnf => run_cmd("rpm", &["-qa", "--queryformat", "%{NAME}\t%{VERSION}-%{RELEASE}\t%{SUMMARY}\n"]).await?,
            PackageManagerKind::Pacman => run_cmd("pacman", &["-Q"]).await?,
            PackageManagerKind::Apk => run_cmd("apk", &["info", "-v"]).await?,
            PackageManagerKind::Brew => run_cmd("brew", &["list", "--versions"]).await?,
            PackageManagerKind::Pkg => run_cmd("pkg", &["info", "-a"]).await?,
            _ => return Err(KoasError::UnsupportedOs(format!("{} not supported", self.kind))),
        };
        Ok(parse_packages(&self.kind, &out))
    }

    async fn search(&self, query: &str) -> KoasResult<Vec<Package>> {
        let out = match self.kind {
            PackageManagerKind::Apt => run_cmd("apt-cache", &["search", query]).await?,
            PackageManagerKind::Dnf => run_cmd("dnf", &["search", query]).await?,
            PackageManagerKind::Pacman => run_cmd("pacman", &["-Ss", query]).await?,
            PackageManagerKind::Brew => run_cmd("brew", &["search", query]).await?,
            _ => return Err(KoasError::UnsupportedOs(format!("{} search not supported", self.kind))),
        };
        Ok(parse_search(&self.kind, &out))
    }

    async fn install(&self, name: &str) -> KoasResult<()> {
        let (cmd, args): (&str, Vec<&str>) = match self.kind {
            PackageManagerKind::Apt => ("apt-get", vec!["-y", "install", name]),
            PackageManagerKind::Dnf => ("dnf", vec!["-y", "install", name]),
            PackageManagerKind::Pacman => ("pacman", vec!["-S", "--noconfirm", name]),
            PackageManagerKind::Zypper => ("zypper", vec!["install", "-y", name]),
            PackageManagerKind::Apk => ("apk", vec!["add", name]),
            PackageManagerKind::Brew => ("brew", vec!["install", name]),
            PackageManagerKind::Pkg => ("pkg", vec!["install", "-y", name]),
            _ => return Err(KoasError::UnsupportedOs(format!("{} install not supported", self.kind))),
        };
        run_cmd(cmd, &args).await?;
        Ok(())
    }

    async fn remove(&self, name: &str) -> KoasResult<()> {
        let (cmd, args): (&str, Vec<&str>) = match self.kind {
            PackageManagerKind::Apt => ("apt-get", vec!["-y", "remove", name]),
            PackageManagerKind::Dnf => ("dnf", vec!["-y", "remove", name]),
            PackageManagerKind::Pacman => ("pacman", vec!["-R", "--noconfirm", name]),
            PackageManagerKind::Zypper => ("zypper", vec!["remove", "-y", name]),
            PackageManagerKind::Apk => ("apk", vec!["del", name]),
            PackageManagerKind::Brew => ("brew", vec!["uninstall", name]),
            PackageManagerKind::Pkg => ("pkg", vec!["delete", "-y", name]),
            _ => return Err(KoasError::UnsupportedOs(format!("{} remove not supported", self.kind))),
        };
        run_cmd(cmd, &args).await?;
        Ok(())
    }

    async fn upgrade_all(&self) -> KoasResult<()> {
        let (cmd, args): (&str, Vec<&str>) = match self.kind {
            PackageManagerKind::Apt => ("apt-get", vec!["-y", "upgrade"]),
            PackageManagerKind::Dnf => ("dnf", vec!["-y", "upgrade"]),
            PackageManagerKind::Pacman => ("pacman", vec!["-Syu", "--noconfirm"]),
            PackageManagerKind::Zypper => ("zypper", vec!["update", "-y"]),
            PackageManagerKind::Apk => ("apk", vec!["upgrade"]),
            PackageManagerKind::Brew => ("brew", vec!["upgrade"]),
            PackageManagerKind::Pkg => ("pkg", vec!["upgrade", "-y"]),
            _ => return Err(KoasError::UnsupportedOs(format!("{} upgrade not supported", self.kind))),
        };
        run_cmd(cmd, &args).await?;
        Ok(())
    }
}
