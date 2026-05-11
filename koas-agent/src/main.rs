mod auth;
mod models;
mod routes;

use axum::{
    middleware,
    routing::get,
    Router,
};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let port = std::env::var("AGENT_PORT")
        .unwrap_or_else(|_| "9000".to_string())
        .parse::<u16>()
        .expect("AGENT_PORT must be a valid port number");

    let app = Router::new()
        .route("/health", get(routes::health::handler))
        .route("/services/systemd", get(routes::services::systemd))
        .route("/services/docker", get(routes::services::docker))
        .route("/services/processes", get(routes::services::processes))
        .route("/services/nginx", get(routes::services::nginx))
        .route("/ports", get(routes::ports::handler))
        .route("/resources", get(routes::resources::handler))
        .layer(middleware::from_fn(auth::bearer_auth))
        .layer(TraceLayer::new_for_http());

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    tracing::info!("koas-agent listening on {}", addr);
    axum::serve(listener, app).await.unwrap();
}
