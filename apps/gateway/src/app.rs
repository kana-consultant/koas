use axum::{middleware, routing::{delete, get, post, put}, Extension, Router};
use std::sync::Arc;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use koas_api::domain::machine::MachineRepository;
use koas_api::presentation::{
    middleware::{auth_middleware, check_auth, login, logout},
    routers::{
        health::health_check,
        machines::{create_machine, delete_machine, get_machine, list_machines, test_machine, update_machine},
        packages::{install_package, list_packages, remove_package, search_packages, upgrade_packages},
        system::{get_local_service, get_local_service_logs, get_system_info, list_local_services, local_service_action},
    },
};
use crate::state::AppState;

#[cfg(feature = "embed-assets")]
mod assets {
    use rust_embed::RustEmbed;

    #[derive(RustEmbed)]
    #[folder = "../web/dist"]
    pub struct Assets;
}

#[cfg(feature = "embed-assets")]
async fn static_handler(uri: axum::http::Uri) -> impl axum::response::IntoResponse {
    use axum::{body::Body, http::{header, StatusCode}, response::Response};
    let path = uri.path().trim_start_matches('/');
    let path = if path.is_empty() { "index.html" } else { path };

    match assets::Assets::get(path) {
        Some(f) => {
            let mime = mime_guess::from_path(path).first_or_octet_stream();
            Response::builder()
                .header(header::CONTENT_TYPE, mime.as_ref())
                .body(Body::from(f.data))
                .unwrap()
        }
        None => match assets::Assets::get("index.html") {
            Some(f) => Response::builder()
                .header(header::CONTENT_TYPE, "text/html")
                .body(Body::from(f.data))
                .unwrap(),
            None => Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(Body::empty())
                .unwrap(),
        },
    }
}

pub fn create_router(state: AppState) -> Router {
    let machine_repo: Arc<dyn MachineRepository> = state.machines.clone();

    let api = Router::new()
        .route("/auth/login", post(login))
        .route("/auth/logout", post(logout))
        .route("/auth/check", get(check_auth))
        .route("/health", get(health_check))
        .route("/system/info", get(get_system_info))
        .route("/system/services", get(list_local_services))
        .route("/system/services/{service}", get(get_local_service))
        .route("/system/services/{service}/action", post(local_service_action))
        .route("/system/services/{service}/logs", get(get_local_service_logs))
        .route("/system/packages", get(list_packages))
        .route("/system/packages/search", get(search_packages))
        .route("/system/packages", post(install_package))
        .route("/system/packages/{name}", delete(remove_package))
        .route("/system/packages/upgrade", post(upgrade_packages))
        .route("/machines", get(list_machines))
        .route("/machines", post(create_machine))
        .route("/machines/{id}", get(get_machine))
        .route("/machines/{id}", put(update_machine))
        .route("/machines/{id}", delete(delete_machine))
        .route("/machines/{id}/test", post(test_machine))
        .with_state(machine_repo);

    #[cfg(feature = "embed-assets")]
    let router = Router::new()
        .nest("/api", api)
        .fallback(static_handler)
        .layer(middleware::from_fn(auth_middleware))
        .layer(Extension(state.auth))
        .layer(CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any))
        .layer(TraceLayer::new_for_http());

    #[cfg(not(feature = "embed-assets"))]
    let router = {
        use tower_http::services::{ServeDir, ServeFile};
        let static_dir = std::env::var("KOAS_STATIC_DIR").unwrap_or_else(|_| "./static".to_string());
        let index_file = format!("{}/index.html", static_dir);
        Router::new()
            .nest("/api", api)
            .fallback_service(ServeDir::new(&static_dir).not_found_service(ServeFile::new(&index_file)))
            .layer(middleware::from_fn(auth_middleware))
            .layer(Extension(state.auth))
            .layer(CorsLayer::new().allow_origin(Any).allow_methods(Any).allow_headers(Any))
            .layer(TraceLayer::new_for_http())
    };

    router
}
