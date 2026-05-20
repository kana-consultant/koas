use axum::{extract::{Path, Query, State}, Json};
use std::sync::Arc;
use crate::application::machine::{CreateMachineUseCase, DeleteMachineUseCase, GetMachineUseCase, ListMachinesUseCase, TestMachineUseCase, UpdateMachineUseCase};
use crate::domain::machine::{CreateMachineRequest, Machine, MachineRepository, UpdateMachineRequest};
use crate::presentation::error::{ApiError, ApiResult};
use crate::presentation::list_params::{ListParams, Page, SortSpec};

pub async fn list_machines(
    State(repo): State<Arc<dyn MachineRepository>>,
    Query(params): Query<ListParams>,
) -> ApiResult<Json<Page<Machine>>> {
    let rows = ListMachinesUseCase::new(repo).execute().await.map_err(ApiError::from)?;
    let page = Page::paginate(rows, &params, machine_matches, machine_compare);
    Ok(Json(page))
}

fn machine_matches(m: &Machine, needle: &str) -> bool {
    m.name.to_lowercase().contains(needle)
        || m.host.to_lowercase().contains(needle)
        || m.username.to_lowercase().contains(needle)
        || m.description
            .as_deref()
            .map(|d| d.to_lowercase().contains(needle))
            .unwrap_or(false)
        || m.tags.iter().any(|t| t.to_lowercase().contains(needle))
}

fn machine_compare(a: &Machine, b: &Machine, spec: SortSpec<'_>) -> std::cmp::Ordering {
    match spec.field {
        "name" => spec.apply(a.name.as_str(), b.name.as_str()),
        "host" => spec.apply(a.host.as_str(), b.host.as_str()),
        "port" => spec.apply(a.port, b.port),
        "username" => spec.apply(a.username.as_str(), b.username.as_str()),
        "status" => spec.apply(format!("{:?}", a.status), format!("{:?}", b.status)),
        "created_at" => spec.apply(a.created_at, b.created_at),
        "updated_at" => spec.apply(a.updated_at, b.updated_at),
        _ => spec.apply(a.name.as_str(), b.name.as_str()),
    }
}

pub async fn get_machine(
    State(repo): State<Arc<dyn MachineRepository>>,
    Path(id): Path<String>,
) -> ApiResult<Json<serde_json::Value>> {
    let m = GetMachineUseCase::new(repo).execute(&id).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::to_value(m).unwrap()))
}

pub async fn create_machine(
    State(repo): State<Arc<dyn MachineRepository>>,
    Json(req): Json<CreateMachineRequest>,
) -> ApiResult<Json<serde_json::Value>> {
    let m = CreateMachineUseCase::new(repo).execute(req).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::to_value(m).unwrap()))
}

pub async fn update_machine(
    State(repo): State<Arc<dyn MachineRepository>>,
    Path(id): Path<String>,
    Json(req): Json<UpdateMachineRequest>,
) -> ApiResult<Json<serde_json::Value>> {
    let m = UpdateMachineUseCase::new(repo).execute(&id, req).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::to_value(m).unwrap()))
}

pub async fn delete_machine(
    State(repo): State<Arc<dyn MachineRepository>>,
    Path(id): Path<String>,
) -> ApiResult<Json<serde_json::Value>> {
    DeleteMachineUseCase::new(repo).execute(&id).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "ok": true })))
}

pub async fn test_machine(
    State(repo): State<Arc<dyn MachineRepository>>,
    Path(id): Path<String>,
) -> ApiResult<Json<serde_json::Value>> {
    let m = TestMachineUseCase::new(repo).execute(&id).await.map_err(ApiError::from)?;
    Ok(Json(serde_json::to_value(m).unwrap()))
}
