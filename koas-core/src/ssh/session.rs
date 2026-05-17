use std::sync::Arc;
use tokio::sync::mpsc;
use russh::{client, keys};
use crate::error::{KoasError, KoasResult};
use crate::service::types::OutputLine;
use super::auth::{SshAuthMethod, SshCredentials};
use super::types::SshTarget;

struct ClientHandler;

#[async_trait::async_trait]
impl client::Handler for ClientHandler {
    type Error = russh::Error;

    async fn check_server_key(
        &mut self,
        _server_public_key: &keys::ssh_key::PublicKey,
    ) -> Result<bool, Self::Error> {
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
    credentials: SshCredentials,
}

impl SshSession {
    pub async fn connect(target: &SshTarget) -> KoasResult<Self> {
        let config = Arc::new(client::Config::default());
        let handler = ClientHandler;

        let mut handle = client::connect(
            config,
            (target.host.as_str(), target.port),
            handler,
        )
        .await
        .map_err(|e| KoasError::Ssh(e.to_string()))?;

        let creds = &target.credentials;
        let authenticated = match &creds.auth {
            SshAuthMethod::Password { password } => {
                handle
                    .authenticate_password(creds.username.clone(), password.clone())
                    .await
                    .map_err(|e| KoasError::Ssh(e.to_string()))?
            }
            SshAuthMethod::Agent => {
                // Try agent auth
                handle
                    .authenticate_publickey(
                        creds.username.clone(),
                        Arc::new(keys::PrivateKey::random(&mut rand::thread_rng(), keys::Algorithm::Ed25519)
                            .map_err(|e| KoasError::Ssh(e.to_string()))?),
                    )
                    .await
                    .unwrap_or(false)
            }
            SshAuthMethod::KeyFile { path, passphrase } => {
                let key = if let Some(passphrase) = passphrase {
                    keys::PrivateKey::read_openssh_file_with_passphrase(path, passphrase)
                        .map_err(|e| KoasError::Ssh(e.to_string()))?
                } else {
                    keys::PrivateKey::read_openssh_file(path)
                        .map_err(|e| KoasError::Ssh(e.to_string()))?
                };
                handle
                    .authenticate_publickey(creds.username.clone(), Arc::new(key))
                    .await
                    .map_err(|e| KoasError::Ssh(e.to_string()))?
            }
        };

        if !authenticated {
            return Err(KoasError::Ssh("Authentication failed".into()));
        }

        Ok(Self { handle, credentials: creds.clone() })
    }

    pub async fn execute(&self, command: &str) -> KoasResult<CommandResult> {
        let mut channel = self
            .handle
            .channel_open_session()
            .await
            .map_err(|e| KoasError::Ssh(e.to_string()))?;

        channel
            .exec(true, command)
            .await
            .map_err(|e| KoasError::Ssh(e.to_string()))?;

        let mut stdout_buf = Vec::new();
        let mut stderr_buf = Vec::new();
        let mut exit_code = 0u32;

        loop {
            match channel.wait().await {
                None => break,
                Some(russh::ChannelMsg::Data { data }) => {
                    stdout_buf.extend_from_slice(&data);
                }
                Some(russh::ChannelMsg::ExtendedData { data, .. }) => {
                    stderr_buf.extend_from_slice(&data);
                }
                Some(russh::ChannelMsg::ExitStatus { exit_status }) => {
                    exit_code = exit_status;
                }
                _ => {}
            }
        }

        Ok(CommandResult {
            exit_code,
            stdout: String::from_utf8_lossy(&stdout_buf).to_string(),
            stderr: String::from_utf8_lossy(&stderr_buf).to_string(),
        })
    }

    pub async fn execute_streaming(
        &self,
        command: &str,
        tx: mpsc::Sender<OutputLine>,
    ) -> KoasResult<u32> {
        let mut channel = self
            .handle
            .channel_open_session()
            .await
            .map_err(|e| KoasError::Ssh(e.to_string()))?;

        channel
            .exec(true, command)
            .await
            .map_err(|e| KoasError::Ssh(e.to_string()))?;

        let mut exit_code = 0u32;
        let mut stdout_partial = String::new();
        let mut stderr_partial = String::new();

        loop {
            match channel.wait().await {
                None => break,
                Some(russh::ChannelMsg::Data { data }) => {
                    stdout_partial.push_str(&String::from_utf8_lossy(&data));
                    while let Some(pos) = stdout_partial.find('\n') {
                        let line = stdout_partial.drain(..=pos).collect::<String>();
                        let _ = tx.send(OutputLine { stream: "stdout".into(), line: line.trim_end().to_string() }).await;
                    }
                }
                Some(russh::ChannelMsg::ExtendedData { data, .. }) => {
                    stderr_partial.push_str(&String::from_utf8_lossy(&data));
                    while let Some(pos) = stderr_partial.find('\n') {
                        let line = stderr_partial.drain(..=pos).collect::<String>();
                        let _ = tx.send(OutputLine { stream: "stderr".into(), line: line.trim_end().to_string() }).await;
                    }
                }
                Some(russh::ChannelMsg::ExitStatus { exit_status }) => {
                    exit_code = exit_status;
                }
                _ => {}
            }
        }

        Ok(exit_code)
    }

    pub async fn test_connection(&self) -> KoasResult<String> {
        let result = self.execute("uname -a").await?;
        Ok(result.stdout.trim().to_string())
    }

    pub async fn close(self) -> KoasResult<()> {
        self.handle
            .disconnect(russh::Disconnect::ByApplication, "", "en")
            .await
            .map_err(|e| KoasError::Ssh(e.to_string()))
    }
}
