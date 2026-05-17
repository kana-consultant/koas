use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Package {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub installed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PackageSearchResult {
    pub name: String,
    pub version: String,
    pub description: Option<String>,
    pub installed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct InstallRequest {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RemoveRequest {
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum PackageManagerKind {
    Apt,
    Dnf,
    Pacman,
    Zypper,
    Apk,
    Brew,
    Pkg,
    Nix,
    Unknown,
}

impl std::fmt::Display for PackageManagerKind {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Apt => write!(f, "apt"),
            Self::Dnf => write!(f, "dnf"),
            Self::Pacman => write!(f, "pacman"),
            Self::Zypper => write!(f, "zypper"),
            Self::Apk => write!(f, "apk"),
            Self::Brew => write!(f, "brew"),
            Self::Pkg => write!(f, "pkg"),
            Self::Nix => write!(f, "nix"),
            Self::Unknown => write!(f, "unknown"),
        }
    }
}
