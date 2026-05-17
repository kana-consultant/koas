use std::sync::Arc;
use koas_api::infrastructure::auth::AuthState;
use koas_api::infrastructure::config::CoreConfig;
use koas_api::infrastructure::machine::JsonMachineRepository;

#[derive(Clone)]
pub struct AppState {
    pub config: Arc<CoreConfig>,
    pub machines: Arc<JsonMachineRepository>,
    pub auth: AuthState,
}

impl AppState {
    pub fn new(config: CoreConfig) -> Self {
        let auth = AuthState::from_env(&config.data_dir);
        let machines = Arc::new(JsonMachineRepository::new(config.machines_dir.clone()));
        Self { config: Arc::new(config), machines, auth }
    }

    pub async fn init(&self) -> koas_api::domain::error::KoasResult<()> {
        self.machines.load().await
    }
}
