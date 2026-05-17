use std::sync::Arc;
use koas_core::{CoreConfig, MachineManager};
use crate::auth::AuthState;

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<CoreConfig>,
    pub machines: Arc<MachineManager>,
    pub auth: AuthState,
}

impl AppState {
    pub fn new(config: CoreConfig) -> Self {
        let auth = AuthState::from_env(&config.data_dir);
        let machines = Arc::new(MachineManager::new(config.machines_dir.clone()));
        Self {
            config: Arc::new(config),
            machines,
            auth,
        }
    }

    pub async fn init(&self) -> Result<(), koas_core::KoasError> {
        self.machines.load().await?;
        Ok(())
    }
}
