use std::sync::Arc;
use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use uuid::Uuid;
use koas_errors::AppError;
use koas_types::{ListResponse, SingleResponse};
use crate::application::{
    create_server::CreateServer,
    delete_server::DeleteServer,
    get_server::GetServer,
    list_servers::ListServers,
};
use super::dto::{CreateServerRequest, ServerResponse};

#[derive(Clone)]
pub struct ServerHandlerState {
    pub list_servers: Arc<ListServers>,
    pub get_server: Arc<GetServer>,
    pub create_server: Arc<CreateServer>,
    pub delete_server: Arc<DeleteServer>,
}

pub async fn list_handler(
    State(state): State<ServerHandlerState>,
) -> Result<Json<ListResponse<ServerResponse>>, AppError> {
    let servers = state.list_servers.execute().await?;
    let data = servers.into_iter().map(ServerResponse::from).collect();
    Ok(Json(ListResponse::new(data)))
}

pub async fn get_handler(
    State(state): State<ServerHandlerState>,
    Path(id): Path<Uuid>,
) -> Result<Json<SingleResponse<ServerResponse>>, AppError> {
    let server = state.get_server.execute(id).await?;
    Ok(Json(SingleResponse::new(ServerResponse::from(server), "OK")))
}

pub async fn create_handler(
    State(state): State<ServerHandlerState>,
    Json(payload): Json<CreateServerRequest>,
) -> Result<(StatusCode, Json<SingleResponse<ServerResponse>>), AppError> {
    let server = state.create_server.execute(payload.into()).await?;
    Ok((
        StatusCode::CREATED,
        Json(SingleResponse::new(ServerResponse::from(server), "Server registered")),
    ))
}

pub async fn delete_handler(
    State(state): State<ServerHandlerState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    state.delete_server.execute(id).await?;
    Ok(StatusCode::NO_CONTENT)
}
