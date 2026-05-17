use std::path::PathBuf;

#[derive(Debug, Clone)]
pub struct CoreConfig {
    pub data_dir: PathBuf,
    pub machines_dir: PathBuf,
    pub command_timeout_secs: u64,
}

impl Default for CoreConfig {
    fn default() -> Self {
        let data_dir = std::env::var("KOAS_DATA_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                directories::ProjectDirs::from("io", "koas", "koas")
                    .map(|d| d.data_dir().to_path_buf())
                    .unwrap_or_else(|| PathBuf::from("./data"))
            });
        let machines_dir = data_dir.join("machines");
        Self {
            data_dir,
            machines_dir,
            command_timeout_secs: std::env::var("KOAS_CMD_TIMEOUT")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(300),
        }
    }
}

impl CoreConfig {
    pub fn ensure_dirs(&self) -> std::io::Result<()> {
        std::fs::create_dir_all(&self.data_dir)?;
        std::fs::create_dir_all(&self.machines_dir)?;
        Ok(())
    }
}
