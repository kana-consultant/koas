use axum::{middleware, routing::{delete, get, post, put}, Router};
use tower_http::{cors::{Any, CorsLayer}, services::{ServeDir, ServeFile}, trace::TraceLayer};

use crate::{auth, routes, state::AppState};

pub fn create_router(state: AppState) -> Router {
    let api = Router::new()
        // Auth
        .route("/auth/login", post(auth::login))
        .route("/auth/logout", post(auth::logout))
        .route("/auth/check", get(auth::check_auth))
        // Health
        .route("/health", get(routes::health_check))
        // System (local machine running the API)
        .route("/system/info", get(routes::get_system_info))
        .route("/system/services", get(routes::list_local_services))
        .route("/system/services/{service}", get(routes::get_local_service))
        .route("/system/services/{service}/action", post(routes::local_service_action))
        .route("/system/services/{service}/logs", get(routes::get_local_service_logs))
        .route("/system/packages", get(routes::list_packages))
        .route("/system/packages/search", get(routes::search_packages))
        .route("/system/packages", post(routes::install_package))
        .route("/system/packages/{name}", delete(routes::remove_package))
        .route("/system/packages/upgrade", post(routes::upgrade_packages))
        // Machines (remote SSH servers)
        .route("/machines", get(routes::list_machines))
        .route("/machines", post(routes::create_machine))
        .route("/machines/{id}", get(routes::get_machine))
        .route("/machines/{id}", put(routes::update_machine))
        .route("/machines/{id}", delete(routes::delete_machine))
        .route("/machines/{id}/test", post(routes::test_machine_connection))
        .route("/machines/{id}/services", get(routes::list_machine_services))
        .route("/machines/{id}/services/{service}/action", post(routes::machine_service_action))
        .route("/machines/{id}/packages", get(routes::list_machine_packages));

    let static_dir = std::env::var("KOAS_STATIC_DIR").unwrap_or_else(|_| "./static".to_string());
    let index_file = format!("{}/index.html", static_dir);
    let serve_dir = ServeDir::new(&static_dir)
        .not_found_service(ServeFile::new(&index_file));

    Router::new()
        .nest("/api", api)
        .fallback_service(serve_dir)
        .layer(middleware::from_fn_with_state(state.clone(), auth::auth_middleware))
        .layer(CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any))
        .layer(TraceLayer::new_for_http())
        .with_state(state)
}
