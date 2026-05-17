use thiserror::Error;

#[derive(Debug, Error)]
pub enum KoasError {
    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Already exists: {0}")]
    AlreadyExists(String),

    #[error("SSH error: {0}")]
    Ssh(String),

    #[error("Command failed (exit {code}): {stderr}")]
    CommandFailed { code: i32, stderr: String },

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("Invalid input: {0}")]
    InvalidInput(String),

    #[error("Timeout: {0}")]
    Timeout(String),

    #[error("Unsupported OS: {0}")]
    UnsupportedOs(String),

    #[error("{0}")]
    Other(String),
}

pub type KoasResult<T> = std::result::Result<T, KoasError>;
