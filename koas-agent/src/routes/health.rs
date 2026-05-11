use axum::Json;
use crate::models::HealthStatus;

pub async fn handler() -> Json<HealthStatus> {
    Json(HealthStatus {
        status: "ok",
        version: env!("CARGO_PKG_VERSION"),
    })
}
