use axum::{extract::{Path, Query}, Json};
use serde::Deserialize;
use std::sync::Arc;
use crate::application::packages::{InstallPackageUseCase, ListPackagesUseCase, RemovePackageUseCase, SearchPackagesUseCase, UpgradePackagesUseCase};
use crate::infrastructure::os::detect_os;
use crate::infrastructure::packages::PackageManager;
use crate::presentation::error::{ApiError, ApiResult};

#[derive(Deserialize)]
pub struct SearchQuery { pub q: String }

pub async fn list_packages() -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let repo: Arc<dyn crate::domain::packages::PackageRepository> = Arc::new(PackageManager::for_os(&os.family));
    let uc = ListPackagesUseCase::new(repo);
    let packages = uc.execute().await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "packages": packages, "manager": uc.manager_name() })))
}

pub async fn search_packages(Query(q): Query<SearchQuery>) -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let repo: Arc<dyn crate::domain::packages::PackageRepository> = Arc::new(PackageManager::for_os(&os.family));
    let results = SearchPackagesUseCase::new(repo).execute(&q.q).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "results": results })))
}

pub async fn install_package(Json(body): Json<serde_json::Value>) -> ApiResult<Json<serde_json::Value>> {
    let name = body.get("name").and_then(|v| v.as_str())
        .ok_or_else(|| ApiError::BadRequest("name is required".into()))?
        .to_string();
    let os = detect_os().await;
    let repo: Arc<dyn crate::domain::packages::PackageRepository> = Arc::new(PackageManager::for_os(&os.family));
    InstallPackageUseCase::new(repo).execute(&name).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn remove_package(Path(name): Path<String>) -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let repo: Arc<dyn crate::domain::packages::PackageRepository> = Arc::new(PackageManager::for_os(&os.family));
    RemovePackageUseCase::new(repo).execute(&name).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn upgrade_packages() -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let repo: Arc<dyn crate::domain::packages::PackageRepository> = Arc::new(PackageManager::for_os(&os.family));
    UpgradePackagesUseCase::new(repo).execute().await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "ok": true })))
}
