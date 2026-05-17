use axum::{http::StatusCode, response::{IntoResponse, Json, Response}};
use koas_core::KoasError;
use serde::Serialize;

#[derive(Debug, Serialize)]
pub struct ErrorResponse {
    pub error: String,
    pub code: String,
}

pub enum ApiError {
    NotFound(String),
    BadRequest(String),
    Unauthorized,
    Internal(String),
    Core(KoasError),
}

impl From<KoasError> for ApiError {
    fn from(e: KoasError) -> Self {
        match &e {
            KoasError::NotFound(_) => ApiError::NotFound(e.to_string()),
            KoasError::InvalidInput(_) => ApiError::BadRequest(e.to_string()),
            _ => ApiError::Core(e),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, code, message) = match self {
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg),
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "BAD_REQUEST", msg),
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", "Unauthorized".into()),
            ApiError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", msg),
            ApiError::Core(e) => (StatusCode::INTERNAL_SERVER_ERROR, "CORE_ERROR", e.to_string()),
        };
        (status, Json(ErrorResponse { error: message, code: code.to_string() })).into_response()
    }
}

pub type ApiResult<T> = Result<T, ApiError>;
