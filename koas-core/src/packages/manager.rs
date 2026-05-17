use tokio::process::Command;
use crate::error::{KoasError, KoasResult};
use crate::os::OsFamily;
use super::types::{Package, PackageManagerKind, PackageSearchResult};

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

    pub async fn list_installed(&self) -> KoasResult<Vec<Package>> {
        let output = match self.kind {
            PackageManagerKind::Apt => {
                run_cmd("dpkg-query", &["-W", "-f=${Package}\t${Version}\t${binary:Summary}\n"]).await?
            }
            PackageManagerKind::Dnf => {
                run_cmd("rpm", &["-qa", "--queryformat", "%{NAME}\t%{VERSION}-%{RELEASE}\t%{SUMMARY}\n"]).await?
            }
            PackageManagerKind::Pacman => {
                run_cmd("pacman", &["-Q"]).await?
            }
            PackageManagerKind::Apk => {
                run_cmd("apk", &["info", "-v"]).await?
            }
            PackageManagerKind::Brew => {
                run_cmd("brew", &["list", "--versions"]).await?
            }
            PackageManagerKind::Pkg => {
                run_cmd("pkg", &["info", "-a"]).await?
            }
            _ => return Err(KoasError::UnsupportedOs(format!("{} package manager not supported", self.kind))),
        };

        Ok(parse_package_list(&self.kind, &output))
    }

    pub async fn search(&self, query: &str) -> KoasResult<Vec<PackageSearchResult>> {
        let output = match self.kind {
            PackageManagerKind::Apt => {
                run_cmd("apt-cache", &["search", query]).await?
            }
            PackageManagerKind::Dnf => {
                run_cmd("dnf", &["search", query]).await?
            }
            PackageManagerKind::Pacman => {
                run_cmd("pacman", &["-Ss", query]).await?
            }
            PackageManagerKind::Brew => {
                run_cmd("brew", &["search", query]).await?
            }
            _ => return Err(KoasError::UnsupportedOs(format!("{} search not supported", self.kind))),
        };

        Ok(parse_search_results(&self.kind, &output))
    }

    pub async fn install(&self, package: &str) -> KoasResult<String> {
        let (cmd, args): (&str, Vec<&str>) = match self.kind {
            PackageManagerKind::Apt => ("apt-get", vec!["-y", "install", package]),
            PackageManagerKind::Dnf => ("dnf", vec!["-y", "install", package]),
            PackageManagerKind::Pacman => ("pacman", vec!["-S", "--noconfirm", package]),
            PackageManagerKind::Zypper => ("zypper", vec!["install", "-y", package]),
            PackageManagerKind::Apk => ("apk", vec!["add", package]),
            PackageManagerKind::Brew => ("brew", vec!["install", package]),
            PackageManagerKind::Pkg => ("pkg", vec!["install", "-y", package]),
            _ => return Err(KoasError::UnsupportedOs(format!("{} install not supported", self.kind))),
        };
        run_cmd(cmd, &args).await
    }

    pub async fn remove(&self, package: &str) -> KoasResult<String> {
        let (cmd, args): (&str, Vec<&str>) = match self.kind {
            PackageManagerKind::Apt => ("apt-get", vec!["-y", "remove", package]),
            PackageManagerKind::Dnf => ("dnf", vec!["-y", "remove", package]),
            PackageManagerKind::Pacman => ("pacman", vec!["-R", "--noconfirm", package]),
            PackageManagerKind::Zypper => ("zypper", vec!["remove", "-y", package]),
            PackageManagerKind::Apk => ("apk", vec!["del", package]),
            PackageManagerKind::Brew => ("brew", vec!["uninstall", package]),
            PackageManagerKind::Pkg => ("pkg", vec!["delete", "-y", package]),
            _ => return Err(KoasError::UnsupportedOs(format!("{} remove not supported", self.kind))),
        };
        run_cmd(cmd, &args).await
    }

    pub async fn upgrade_all(&self) -> KoasResult<String> {
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
        run_cmd(cmd, &args).await
    }
}

async fn run_cmd(cmd: &str, args: &[&str]) -> KoasResult<String> {
    let out = Command::new(cmd).args(args).output().await?;
    Ok(String::from_utf8_lossy(&out.stdout).to_string())
}

fn parse_package_list(kind: &PackageManagerKind, output: &str) -> Vec<Package> {
    output
        .lines()
        .filter(|l| !l.trim().is_empty())
        .filter_map(|line| {
            match kind {
                PackageManagerKind::Apt => {
                    let parts: Vec<&str> = line.splitn(3, '\t').collect();
                    Some(Package {
                        name: parts.first()?.to_string(),
                        version: parts.get(1).unwrap_or(&"").to_string(),
                        description: parts.get(2).map(|s| s.to_string()),
                        installed: true,
                    })
                }
                PackageManagerKind::Pacman | PackageManagerKind::Brew => {
                    let parts: Vec<&str> = line.splitn(2, ' ').collect();
                    Some(Package {
                        name: parts.first()?.to_string(),
                        version: parts.get(1).unwrap_or(&"").to_string(),
                        description: None,
                        installed: true,
                    })
                }
                _ => {
                    let parts: Vec<&str> = line.splitn(3, '\t').collect();
                    Some(Package {
                        name: parts.first()?.to_string(),
                        version: parts.get(1).unwrap_or(&"").to_string(),
                        description: parts.get(2).map(|s| s.to_string()),
                        installed: true,
                    })
                }
            }
        })
        .collect()
}

fn parse_search_results(kind: &PackageManagerKind, output: &str) -> Vec<PackageSearchResult> {
    match kind {
        PackageManagerKind::Apt => output.lines()
            .filter(|l| !l.trim().is_empty())
            .filter_map(|line| {
                let (name, desc) = line.split_once(" - ")?;
                Some(PackageSearchResult {
                    name: name.trim().to_string(),
                    version: String::new(),
                    description: Some(desc.trim().to_string()),
                    installed: false,
                })
            })
            .collect(),
        _ => output.lines()
            .filter(|l| !l.trim().is_empty())
            .map(|line| {
                let parts: Vec<&str> = line.splitn(2, ' ').collect();
                PackageSearchResult {
                    name: parts.first().unwrap_or(&"").to_string(),
                    version: String::new(),
                    description: parts.get(1).map(|s| s.to_string()),
                    installed: false,
                }
            })
            .collect(),
    }
}
