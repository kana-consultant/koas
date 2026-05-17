use std::sync::Arc;
use russh::{client, keys};
use crate::domain::error::{KoasError, KoasResult};
use super::auth::SshAuthMethod;
use super::types::SshTarget;

struct ClientHandler;

impl client::Handler for ClientHandler {
    type Error = russh::Error;
    async fn check_server_key(&mut self, _key: &keys::ssh_key::PublicKey) -> Result<bool, Self::Error> {
        Ok(true)
    }
}

pub struct CommandResult {
    pub exit_code: u32,
    pub stdout: String,
    pub stderr: String,
}

pub struct SshSession {
    handle: client::Handle<ClientHandler>,
}

impl SshSession {
    pub async fn connect(target: &SshTarget) -> KoasResult<Self> {
        let config = Arc::new(client::Config::default());
        let mut handle = client::connect(config, (target.host.as_str(), target.port), ClientHandler)
            .await
            .map_err(|e| KoasError::Ssh(e.to_string()))?;

        let creds = &target.credentials;
        let auth_result = match &creds.auth {
            SshAuthMethod::Password { password } => {
                handle.authenticate_password(creds.username.clone(), password.clone())
                    .await.map_err(|e| KoasError::Ssh(e.to_string()))?
            }
            SshAuthMethod::KeyFile { path, passphrase } => {
                let key = keys::PrivateKey::read_openssh_file(path)
                    .map_err(|e| KoasError::Ssh(e.to_string()))?;
                let key = if let Some(pass) = passphrase {
                    key.decrypt(pass.as_bytes()).map_err(|e| KoasError::Ssh(e.to_string()))?
                } else {
                    key
                };
                let key_with_alg = keys::PrivateKeyWithHashAlg::new(Arc::new(key), None);
                handle.authenticate_publickey(creds.username.clone(), key_with_alg)
                    .await.map_err(|e| KoasError::Ssh(e.to_string()))?
            }
            SshAuthMethod::Agent => {
                return Err(KoasError::Ssh("SSH agent auth not supported; use password or key file".into()));
            }
        };

        if !auth_result.success() {
            return Err(KoasError::Ssh("auth: Authentication failed".into()));
        }

        Ok(Self { handle })
    }

    pub async fn execute(&self, command: &str) -> KoasResult<CommandResult> {
        let mut channel = self.handle.channel_open_session().await
            .map_err(|e| KoasError::Ssh(e.to_string()))?;
        channel.exec(true, command).await
            .map_err(|e| KoasError::Ssh(e.to_string()))?;

        let mut stdout_buf = Vec::new();
        let mut stderr_buf = Vec::new();
        let mut exit_code = 0u32;

        loop {
            match channel.wait().await {
                None => break,
                Some(russh::ChannelMsg::Data { data }) => stdout_buf.extend_from_slice(&data),
                Some(russh::ChannelMsg::ExtendedData { data, .. }) => stderr_buf.extend_from_slice(&data),
                Some(russh::ChannelMsg::ExitStatus { exit_status }) => exit_code = exit_status,
                _ => {}
            }
        }

        Ok(CommandResult {
            exit_code,
            stdout: String::from_utf8_lossy(&stdout_buf).to_string(),
            stderr: String::from_utf8_lossy(&stderr_buf).to_string(),
        })
    }

    pub async fn test_connection(&self) -> KoasResult<String> {
        let result = self.execute("uname -a").await?;
        Ok(result.stdout.trim().to_string())
    }

    pub async fn close(self) -> KoasResult<()> {
        self.handle.disconnect(russh::Disconnect::ByApplication, "", "en")
            .await.map_err(|e| KoasError::Ssh(e.to_string()))
    }
}
