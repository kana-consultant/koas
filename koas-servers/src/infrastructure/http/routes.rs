use axum::{routing::get, Router};
use super::handlers::{create_handler, delete_handler, get_handler, list_handler, ServerHandlerState};

pub fn router(state: ServerHandlerState) -> Router {
    Router::new()
        .route("/", get(list_handler).post(create_handler))
        .route("/:id", get(get_handler).delete(delete_handler))
        .with_state(state)
}
