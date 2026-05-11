use std::sync::Arc;
use axum::{http::Method, Router};
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
use koas_servers::{
    application::{
        create_server::CreateServer,
        delete_server::DeleteServer,
        get_server::GetServer,
        list_servers::ListServers,
    },
    infrastructure::{
        http::{handlers::ServerHandlerState, routes::router as servers_router},
        persistence::sqlite_server_repository::SqliteServerRepository,
    },
};
use koas_proxy::{handlers::ProxyState, routes::router as proxy_router};

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    let database_url = std::env::var("DATABASE_URL")
        .unwrap_or_else(|_| "sqlite://./koas.db".to_string());
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "3000".to_string())
        .parse::<u16>()
        .expect("PORT must be a valid port number");

    let pool = koas_database::connect(&database_url)
        .await
        .expect("Failed to connect to database");
    koas_database::migrate(&pool)
        .await
        .expect("Failed to run migrations");

    let repo = Arc::new(SqliteServerRepository::new(pool));

    let server_state = ServerHandlerState {
        list_servers: Arc::new(ListServers::new(repo.clone())),
        get_server: Arc::new(GetServer::new(repo.clone())),
        create_server: Arc::new(CreateServer::new(repo.clone())),
        delete_server: Arc::new(DeleteServer::new(repo.clone())),
    };

    let get_server_for_proxy = Arc::new(GetServer::new(repo.clone()));
    let proxy_state = ProxyState {
        get_server: get_server_for_proxy,
        http_client: reqwest::Client::new(),
    };

    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::DELETE])
        .allow_headers(Any)
        .allow_origin(Any);

    let app = Router::new()
        .nest("/api/v1/servers", servers_router(server_state))
        .nest("/api/v1/proxy", proxy_router(proxy_state))
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    tracing::info!("koas-server listening on {}", addr);
    axum::serve(listener, app).await.unwrap();
}
