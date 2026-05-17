use koas_core::CoreConfig;
use std::net::SocketAddr;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

mod app;
mod auth;
mod error;
mod routes;
mod state;

#[tokio::main]
async fn main() {
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "koas_api=debug,koas_core=debug,tower_http=info".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = CoreConfig::default();
    if let Err(e) = config.ensure_dirs() {
        tracing::warn!("Failed to create data dirs: {}", e);
    }

    let state = state::AppState::new(config);
    if let Err(e) = state.init().await {
        tracing::error!("Failed to init state: {}", e);
    }

    let app = app::create_router(state.clone());

    let address = std::env::var("KOAS_ADDRESS").unwrap_or_else(|_| "127.0.0.1".to_string());
    let port: u16 = std::env::var("KOAS_PORT")
        .ok()
        .and_then(|p| p.parse().ok())
        .unwrap_or(3000);

    let addr: SocketAddr = format!("{}:{}", address, port).parse().unwrap();
    tracing::info!("koas API listening on {}", addr);
    tracing::info!(
        "Auth: {}",
        if state.auth.enabled { "enabled" } else { "disabled" }
    );

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
