use axum::{extract::{Path, State}, Json};
use koas_core::{detect_os, ServiceManager, ServiceAction};
use koas_core::service::types::ServiceActionRequest;
use serde::Serialize;

use crate::error::{ApiError, ApiResult};
use crate::state::AppState;

#[derive(Serialize)]
pub struct SystemInfoResponse {
    pub hostname: String,
    pub os_name: String,
    pub os_version: String,
    pub os_family: String,
    pub kernel: String,
    pub arch: String,
    pub uptime_seconds: u64,
}

pub async fn get_system_info() -> ApiResult<Json<SystemInfoResponse>> {
    let info = detect_os().await;
    Ok(Json(SystemInfoResponse {
        hostname: info.hostname,
        os_name: info.name,
        os_version: info.version,
        os_family: format!("{:?}", info.family).to_lowercase(),
        kernel: info.kernel,
        arch: info.arch,
        uptime_seconds: info.uptime_seconds,
    }))
}

pub async fn list_local_services() -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let mgr = ServiceManager::new(os.family);
    let services = mgr.list_services().await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "services": services })))
}

pub async fn get_local_service(Path(service): Path<String>) -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let mgr = ServiceManager::new(os.family);
    let status = mgr.get_service_status(&service).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::to_value(status).unwrap()))
}

pub async fn local_service_action(
    Path(service): Path<String>,
    Json(req): Json<ServiceActionRequest>,
) -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let mgr = ServiceManager::new(os.family);
    mgr.service_action(&service, &req.action).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn get_local_service_logs(Path(service): Path<String>) -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let mgr = ServiceManager::new(os.family);
    let opts = koas_core::service::types::LogOptions::default();
    let logs = mgr.get_logs(&service, &opts).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "logs": logs })))
}
