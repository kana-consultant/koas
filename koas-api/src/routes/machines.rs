use axum::{extract::{Path, State}, Json};
use koas_core::{CreateMachineRequest, UpdateMachineRequest, ServiceManager, detect_os};
use koas_core::service::types::ServiceActionRequest;

use crate::error::{ApiError, ApiResult};
use crate::state::AppState;

pub async fn list_machines(State(state): State<AppState>) -> ApiResult<Json<serde_json::Value>> {
    let machines = state.machines.list().await;
    Ok(Json(serde_json::json!({ "machines": machines })))
}

pub async fn get_machine(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<serde_json::Value>> {
    let machine = state.machines.get(&id).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::to_value(machine).unwrap()))
}

pub async fn create_machine(
    State(state): State<AppState>,
    Json(req): Json<CreateMachineRequest>,
) -> ApiResult<Json<serde_json::Value>> {
    let machine = state.machines.create(req).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::to_value(machine).unwrap()))
}

pub async fn update_machine(
    State(state): State<AppState>,
    Path(id): Path<String>,
    Json(req): Json<UpdateMachineRequest>,
) -> ApiResult<Json<serde_json::Value>> {
    let machine = state.machines.update(&id, req).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::to_value(machine).unwrap()))
}

pub async fn delete_machine(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<serde_json::Value>> {
    state.machines.delete(&id).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn test_machine_connection(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<serde_json::Value>> {
    let machine = state.machines.test_connection(&id).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::to_value(machine).unwrap()))
}

pub async fn list_machine_services(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<serde_json::Value>> {
    let machine = state.machines.get(&id).await.map_err(ApiError::from)?;
    let creds = koas_core::ssh::auth::SshCredentials { username: machine.username.clone(), auth: machine.auth.clone() };
    let target = koas_core::ssh::types::SshTarget { host: machine.host.clone(), port: machine.port, credentials: creds };
    let session = koas_core::ssh::session::SshSession::connect(&target).await.map_err(ApiError::from)?;
    let result = session.execute("uname -s").await.map_err(ApiError::from)?;
    let _ = session.close().await;
    let os_family = match result.stdout.trim() {
        "Darwin" => koas_core::OsFamily::MacOs,
        "FreeBSD" => koas_core::OsFamily::FreeBsd,
        _ => koas_core::OsFamily::Debian, // default to systemd for Linux
    };
    // For a real implementation, detect remote OS properly
    let _ = os_family;
    Ok(Json(serde_json::json!({ "machine_id": id, "services": [] })))
}

pub async fn machine_service_action(
    State(state): State<AppState>,
    Path((id, service)): Path<(String, String)>,
    Json(req): Json<ServiceActionRequest>,
) -> ApiResult<Json<serde_json::Value>> {
    let machine = state.machines.get(&id).await.map_err(ApiError::from)?;
    let creds = koas_core::ssh::auth::SshCredentials { username: machine.username.clone(), auth: machine.auth.clone() };
    let target = koas_core::ssh::types::SshTarget { host: machine.host.clone(), port: machine.port, credentials: creds };
    let session = koas_core::ssh::session::SshSession::connect(&target).await.map_err(ApiError::from)?;
    let cmd = format!("sudo systemctl {} {}", req.action, service);
    let result = session.execute(&cmd).await.map_err(ApiError::from)?;
    let _ = session.close().await;
    Ok(Json(serde_json::json!({ "ok": result.exit_code == 0, "output": result.stdout })))
}

pub async fn list_machine_packages(
    State(state): State<AppState>,
    Path(id): Path<String>,
) -> ApiResult<Json<serde_json::Value>> {
    Ok(Json(serde_json::json!({ "machine_id": id, "packages": [] })))
}
