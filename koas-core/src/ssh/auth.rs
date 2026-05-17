use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum SshAuthMethod {
    Agent,
    KeyFile { path: PathBuf, passphrase: Option<String> },
    Password { password: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshCredentials {
    pub username: String,
    pub auth: SshAuthMethod,
}

impl SshCredentials {
    pub fn with_agent(username: impl Into<String>) -> Self {
        Self { username: username.into(), auth: SshAuthMethod::Agent }
    }

    pub fn with_key_file(username: impl Into<String>, path: PathBuf, passphrase: Option<String>) -> Self {
        Self { username: username.into(), auth: SshAuthMethod::KeyFile { path, passphrase } }
    }

    pub fn with_password(username: impl Into<String>, password: impl Into<String>) -> Self {
        Self { username: username.into(), auth: SshAuthMethod::Password { password: password.into() } }
    }
}

pub fn default_key_paths() -> Vec<PathBuf> {
    let home = home::home_dir().unwrap_or_else(|| PathBuf::from("/root"));
    let ssh = home.join(".ssh");
    ["id_ed25519", "id_ecdsa", "id_rsa"]
        .iter()
        .map(|f| ssh.join(f))
        .filter(|p| p.exists())
        .collect()
}
