use axum::{extract::{Path, State}, Json};
use std::sync::Arc;
use crate::application::machine::{CreateMachineUseCase, DeleteMachineUseCase, GetMachineUseCase, ListMachinesUseCase, TestMachineUseCase, UpdateMachineUseCase};
use crate::domain::machine::{CreateMachineRequest, MachineRepository, UpdateMachineRequest};
use crate::presentation::error::{ApiError, ApiResult};

pub async fn list_machines(State(repo): State<Arc<dyn MachineRepository>>) -> ApiResult<Json<serde_json::Value>> {
    let machines = ListMachinesUseCase::new(repo).execute().await.map_err(ApiError::from)?;
    Ok(Json(serde_json::json!({ "machines": machines })))
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
