use axum::{extract::{Path, Query}, Json};
use std::sync::Arc;
use crate::application::packages::{InstallPackageUseCase, ListPackagesUseCase, RemovePackageUseCase, SearchPackagesUseCase, UpgradePackagesUseCase};
use crate::domain::packages::Package;
use crate::infrastructure::os::detect_os;
use crate::infrastructure::packages::PackageManager;
use crate::presentation::error::{ApiError, ApiResult};
use crate::presentation::list_params::{ListParams, Page, SortSpec};

pub async fn list_packages(
    Query(params): Query<ListParams>,
) -> ApiResult<Json<serde_json::Value>> {
    let os = detect_os().await;
    let repo: Arc<dyn crate::domain::packages::PackageRepository> = Arc::new(PackageManager::for_os(&os.family));
    let list_uc = ListPackagesUseCase::new(repo.clone());
    let manager_name = list_uc.manager_name().to_string();

    let rows = match params.search_term() {
        Some(term) => SearchPackagesUseCase::new(repo)
            .execute(term)
            .await
            .map_err(ApiError::from)?,
        None => list_uc.execute().await.map_err(ApiError::from)?,
    };

    let page = Page::paginate(rows, &params, package_matches, package_compare);
    let mut value = serde_json::to_value(&page).unwrap();
    value["manager"] = serde_json::Value::String(manager_name);
    Ok(Json(value))
}

fn package_matches(p: &Package, needle: &str) -> bool {
    p.name.to_lowercase().contains(needle)
        || p.version.to_lowercase().contains(needle)
        || p.description
            .as_deref()
            .map(|d| d.to_lowercase().contains(needle))
            .unwrap_or(false)
}

fn package_compare(a: &Package, b: &Package, spec: SortSpec<'_>) -> std::cmp::Ordering {
    match spec.field {
        "name" => spec.apply(a.name.as_str(), b.name.as_str()),
        "version" => spec.apply(a.version.as_str(), b.version.as_str()),
        "installed" => spec.apply(a.installed, b.installed),
        _ => spec.apply(a.name.as_str(), b.name.as_str()),
    }
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
