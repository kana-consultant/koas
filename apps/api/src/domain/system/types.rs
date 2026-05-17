use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum OsFamily {
    Debian,
    Rhel,
    Arch,
    Suse,
    Alpine,
    Gentoo,
    Nix,
    MacOs,
    FreeBsd,
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
