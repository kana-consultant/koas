use std::sync::Arc;
use axum::{
    extract::{Path, State},
    Json,
};
use uuid::Uuid;
use koas_errors::AppError;
use koas_servers::application::get_server::GetServer;

#[derive(Clone)]
pub struct ProxyState {
    pub get_server: Arc<GetServer>,
    pub http_client: reqwest::Client,
}

pub async fn proxy_handler(
    State(state): State<ProxyState>,
    Path((server_id, path)): Path<(Uuid, String)>,
) -> Result<Json<serde_json::Value>, AppError> {
    let server = state.get_server.execute(server_id).await?;
    let url = format!("http://{}:{}/{}", server.host, server.port, path);

    tracing::debug!("Proxying to {}", url);

    let response = state
        .http_client
        .get(&url)
        .bearer_auth(&server.token)
        .send()
        .await?;

    let status = response.status();
    let body: serde_json::Value = response.json().await.unwrap_or(serde_json::Value::Null);

    if !status.is_success() {
        return Err(AppError::AgentUnreachable(format!(
            "Agent returned {}: {}",
            status,
            body.get("message").and_then(|m| m.as_str()).unwrap_or("unknown error")
        )));
    }

    Ok(Json(body))
}
