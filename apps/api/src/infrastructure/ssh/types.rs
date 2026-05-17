use super::auth::SshCredentials;

pub struct SshTarget {
    pub host: String,
    pub port: u16,
    pub credentials: SshCredentials,
}
