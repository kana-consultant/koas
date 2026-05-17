use axum::{routing::get, Router};
use super::handlers::{proxy_handler, ProxyState};

pub fn router(state: ProxyState) -> Router {
    Router::new()
        .route("/{server_id}/{*path}", get(proxy_handler))
        .with_state(state)
}
