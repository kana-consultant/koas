use axum::{extract::Path, Json};
use std::sync::Arc;
use crate::application::service::{GetServiceLogsUseCase, GetServiceUseCase, ListServicesUseCase, ServiceActionUseCase};
use crate::application::system::GetSystemInfoUseCase;
use crate::domain::service::{LogOptions, ServiceActionRequest};
use crate::infrastructure::os::detect_os;
use crate::infrastructure::service::ServiceManager;
use crate::presentation::error::{ApiError, ApiResult};

pub async fn get_system_info() -> ApiResult<Json<serde_json::Value>> {
    let info = GetSystemInfoUseCase.execute().await;
    Ok(Json(serde_json::json!({
        "hostname": info.hostname,
        "os_name": info.name,
        "os_version": info.version,
        "os_family": format!("{:?}", info.family).to_lowercase(),
        "kernel": info.kernel,
        "arch": info.arch,
        "uptime_seconds": info.uptime_seconds,
    })))
}

pub async fn list_local_services() -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let repo: Arc<dyn crate::domain::service::ServiceRepository> = Arc::new(ServiceManager::new(os.family));
    let services = ListServicesUseCase::new(repo).execute().await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "services": services })))
}

pub async fn get_local_service(Path(name): Path<String>) -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let repo: Arc<dyn crate::domain::service::ServiceRepository> = Arc::new(ServiceManager::new(os.family));
    let status = GetServiceUseCase::new(repo).execute(&name).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::to_value(status).unwrap()))
}

pub async fn local_service_action(
    Path(name): Path<String>,
    Json(req): Json<ServiceActionRequest>,
) -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let repo: Arc<dyn crate::domain::service::ServiceRepository> = Arc::new(ServiceManager::new(os.family));
    ServiceActionUseCase::new(repo).execute(&name, &req.action).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn get_local_service_logs(Path(name): Path<String>) -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let repo: Arc<dyn crate::domain::service::ServiceRepository> = Arc::new(ServiceManager::new(os.family));
    let logs = GetServiceLogsUseCase::new(repo).execute(&name, &LogOptions::default()).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "logs": logs })))
}
