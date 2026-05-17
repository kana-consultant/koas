use axum::{extract::{Path, Query}, Json};
use koas_core::{detect_os, packages::manager::PackageManager};
use serde::Deserialize;

use crate::error::{ApiError, ApiResult};

#[derive(Deserialize)]
pub struct SearchQuery {
    pub q: String,
}

pub async fn list_packages() -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let mgr = PackageManager::for_os(&os.family);
    let packages = mgr.list_installed().await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "packages": packages, "manager": mgr.kind.to_string() })))
}

pub async fn search_packages(Query(q): Query<SearchQuery>) -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let mgr = PackageManager::for_os(&os.family);
    let results = mgr.search(&q.q).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "results": results })))
}

pub async fn install_package(Json(body): Json<serde_json::Value>) -> ApiResult<Json<serde_json::Value>> {
    let name = body.get("name").and_then(|v| v.as_str())
        .ok_or_else(|| ApiError::BadRequest("name is required".into()))?;
    let os = detect_os().await;
    let mgr = PackageManager::for_os(&os.family);
    let output = mgr.install(name).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "ok": true, "output": output })))
}

pub async fn remove_package(Path(name): Path<String>) -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let mgr = PackageManager::for_os(&os.family);
    let output = mgr.remove(&name).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "ok": true, "output": output })))
}

pub async fn upgrade_packages() -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let mgr = PackageManager::for_os(&os.family);
    let output = mgr.upgrade_all().await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "ok": true, "output": output })))
}
