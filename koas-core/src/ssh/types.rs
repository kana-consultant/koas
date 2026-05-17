use serde::{Deserialize, Serialize};
use super::auth::SshCredentials;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SshTarget {
    pub host: String,
    pub port: u16,
    pub credentials: SshCredentials,
}
