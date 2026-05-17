// Re-export domain SSH auth types for infrastructure use
pub use crate::domain::machine::types::SshAuth as SshAuthMethod;

#[derive(Debug, Clone)]
pub struct SshCredentials {
    pub username: String,
    pub auth: SshAuthMethod,
}
