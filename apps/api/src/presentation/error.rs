use axum::http::StatusCode;
use axum::response::{IntoResponse, Json, Response};
use crate::domain::error::KoasError;

pub enum ApiError {
    NotFound(String),
    BadRequest(String),
    Unauthorized,
    Internal(String),
}

impl From<KoasError> for ApiError {
    fn from(e: KoasError) -> Self {
        match &e {
            KoasError::NotFound(_) => ApiError::NotFound(e.to_string()),
            KoasError::InvalidInput(_) => ApiError::BadRequest(e.to_string()),
            _ => ApiError::Internal(e.to_string()),
        }
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, code, msg) = match self {
            ApiError::NotFound(m) => (StatusCode::NOT_FOUND, "NOT_FOUND", m),
            ApiError::BadRequest(m) => (StatusCode::BAD_REQUEST, "BAD_REQUEST", m),
            ApiError::Unauthorized => (StatusCode::UNAUTHORIZED, "UNAUTHORIZED", "Unauthorized".into()),
            ApiError::Internal(m) => {
                tracing::error!("Internal error: {}", m);
                (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL", "Internal server error".into())
            }
        };
        (status, Json(serde_json::json!({ "error": msg, "code": code }))).into_response()
    }
}

pub type ApiResult<T> = Result<T, ApiError>;
