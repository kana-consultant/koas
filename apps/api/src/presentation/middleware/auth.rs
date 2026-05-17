use axum::{
    body::Body,
    extract::Request,
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Json, Response},
};
use serde::{Deserialize, Serialize};
use crate::infrastructure::auth::AuthState;

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse { pub token: String }

#[derive(Debug, Serialize)]
pub struct AuthCheckResponse { pub authenticated: bool, pub username: Option<String> }

pub async fn login(
    auth: axum::Extension<AuthState>,
    Json(req): Json<LoginRequest>,
) -> impl IntoResponse {
    if !auth.enabled {
        let token = auth.create_session().await;
        return (StatusCode::OK, Json(LoginResponse { token })).into_response();
    }
    if req.username != auth.username || !auth.verify_password(&req.password) {
        return (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": "Invalid credentials" }))).into_response();
    }
    let token = auth.create_session().await;
    (StatusCode::OK, Json(LoginResponse { token })).into_response()
}

pub async fn logout(auth: axum::Extension<AuthState>, req: Request<Body>) -> impl IntoResponse {
    if let Some(token) = extract_token(&req) {
        auth.invalidate_session(&token).await;
    }
    Json(serde_json::json!({ "ok": true }))
}

pub async fn check_auth(auth: axum::Extension<AuthState>, req: Request<Body>) -> impl IntoResponse {
    if !auth.enabled {
        return Json(AuthCheckResponse { authenticated: true, username: Some(auth.username.clone()) }).into_response();
    }
    let authenticated = if let Some(t) = extract_token(&req) { auth.validate_session(&t).await } else { false };
    Json(AuthCheckResponse {
        authenticated,
        username: if authenticated { Some(auth.username.clone()) } else { None },
    }).into_response()
}

pub async fn auth_middleware(req: Request, next: Next) -> Response {
    let path = req.uri().path().to_string();
    let public = ["/api/auth/login", "/api/auth/check", "/api/health"];
    if public.iter().any(|p| path == *p) || !path.starts_with("/api/") {
        return next.run(req).await;
    }

    let auth = req.extensions().get::<AuthState>().cloned();
    let Some(auth) = auth else { return next.run(req).await };

    if !auth.enabled { return next.run(req).await; }

    if let Some(token) = extract_token(&req) {
        if auth.validate_session(&token).await {
            return next.run(req).await;
        }
    }

    (StatusCode::UNAUTHORIZED, Json(serde_json::json!({ "error": "Unauthorized" }))).into_response()
}

pub fn extract_token(req: &Request) -> Option<String> {
    if let Some(val) = req.headers().get(header::AUTHORIZATION) {
        if let Ok(s) = val.to_str() {
            if let Some(t) = s.strip_prefix("Bearer ") { return Some(t.to_string()); }
        }
    }
    if let Some(val) = req.headers().get(header::COOKIE) {
        if let Ok(s) = val.to_str() {
            for part in s.split(';') {
                if let Some(t) = part.trim().strip_prefix("koas_token=") { return Some(t.to_string()); }
            }
        }
    }
    if let Some(query) = req.uri().query() {
        for pair in query.split('&') {
            if let Some(t) = pair.strip_prefix("token=") {
                return Some(urlencoding::decode(t).unwrap_or_default().to_string());
            }
        }
    }
    None
}
