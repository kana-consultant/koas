use axum::{extract::{Path, Query}, Json};
use serde::Deserialize;
use std::sync::Arc;
use crate::application::service::{GetServiceLogsUseCase, GetServiceUseCase, ListServicesUseCase, ServiceActionUseCase};
use crate::application::system::GetSystemInfoUseCase;
use crate::domain::service::{LogOptions, ServiceActionRequest, ServiceInfo};
use crate::infrastructure::os::detect_os;
use crate::infrastructure::service::ServiceManager;
use crate::presentation::error::{ApiError, ApiResult};
use crate::presentation::list_params::{ListParams, Page, SortSpec};

#[derive(Debug, Default, Deserialize)]
pub struct ServiceFilter {
    #[serde(default)]
    pub state: Option<String>,
}

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

pub async fn list_local_services(
    Query(params): Query<ListParams>,
    Query(filter): Query<ServiceFilter>,
) -> ApiResult<Json<Page<ServiceInfo>>> {
    let os = detect_os().await;
    let repo: Arc<dyn crate::domain::service::ServiceRepository> = Arc::new(ServiceManager::new(os.family));
    let mut rows = ListServicesUseCase::new(repo).execute().await.map_err(ApiError::from)?;
    if let Some(state) = filter.state.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
        let needle = state.to_lowercase();
        rows.retain(|s| s.active_state.to_string() == needle);
    }
    let page = Page::paginate(rows, &params, service_matches, service_compare);
    Ok(Json(page))
}

fn service_matches(s: &ServiceInfo, needle: &str) -> bool {
    s.name.to_lowercase().contains(needle)
        || s.description.to_lowercase().contains(needle)
        || s.sub_state.to_lowercase().contains(needle)
}

fn service_compare(a: &ServiceInfo, b: &ServiceInfo, spec: SortSpec<'_>) -> std::cmp::Ordering {
    match spec.field {
        "name" => spec.apply(a.name.as_str(), b.name.as_str()),
        "description" => spec.apply(a.description.as_str(), b.description.as_str()),
        "active_state" => spec.apply(a.active_state.to_string(), b.active_state.to_string()),
        "sub_state" => spec.apply(a.sub_state.as_str(), b.sub_state.as_str()),
        "enabled" => spec.apply(a.enabled, b.enabled),
        "memory_bytes" => spec.apply(a.memory_bytes, b.memory_bytes),
        _ => spec.apply(a.name.as_str(), b.name.as_str()),
    }
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
