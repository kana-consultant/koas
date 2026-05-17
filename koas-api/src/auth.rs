use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::{IntoResponse, Json, Response},
};
use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::state::AppState;

pub type SessionStore = Arc<RwLock<HashSet<String>>>;

#[derive(Clone)]
pub struct AuthState {
    pub username: String,
    pub password_hash: String,
    pub sessions: SessionStore,
    pub enabled: bool,
    pub sessions_file: PathBuf,
}

impl AuthState {
    pub fn from_env(data_dir: &PathBuf) -> Self {
        let enabled = std::env::var("KOAS_AUTH_ENABLED")
            .map(|v| v != "false" && v != "0")
            .unwrap_or(true);

        let username = std::env::var("KOAS_AUTH_USERNAME").unwrap_or_else(|_| "admin".to_string());
        let password = std::env::var("KOAS_AUTH_PASSWORD").unwrap_or_else(|_| "koas".to_string());

        let sessions_file = data_dir.join("sessions.json");

        let sessions = if let Ok(content) = std::fs::read_to_string(&sessions_file) {
            serde_json::from_str::<HashSet<String>>(&content)
                .unwrap_or_default()
        } else {
            HashSet::new()
        };

        Self {
            username,
            password_hash: simple_hash(&password),
            sessions: Arc::new(RwLock::new(sessions)),
            enabled,
            sessions_file,
        }
    }

    pub fn verify_password(&self, password: &str) -> bool {
        simple_hash(password) == self.password_hash
    }

    pub async fn create_session(&self) -> String {
        let token = uuid::Uuid::new_v4().to_string();
        self.sessions.write().await.insert(token.clone());
        self.persist_sessions().await;
        token
    }

    pub async fn validate_session(&self, token: &str) -> bool {
        self.sessions.read().await.contains(token)
    }

    pub async fn invalidate_session(&self, token: &str) {
        self.sessions.write().await.remove(token);
        self.persist_sessions().await;
    }

    async fn persist_sessions(&self) {
        let sessions = self.sessions.read().await;
        if let Ok(json) = serde_json::to_string(&*sessions) {
            let _ = tokio::fs::write(&self.sessions_file, json).await;
        }
    }
}

fn simple_hash(input: &str) -> String {
    use std::hash::{Hash, Hasher};
    use std::collections::hash_map::DefaultHasher;
    let mut hasher = DefaultHasher::new();
    format!("koas-salt-{}", input).hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
}

#[derive(Debug, Serialize)]
pub struct AuthCheckResponse {
    pub authenticated: bool,
    pub username: Option<String>,
}

pub async fn login(
    State(state): State<AppState>,
    Json(req): Json<LoginRequest>,
) -> impl IntoResponse {
    if !state.auth.enabled {
        let token = state.auth.create_session().await;
        return (StatusCode::OK, Json(LoginResponse { token })).into_response();
    }

    if req.username != state.auth.username || !state.auth.verify_password(&req.password) {
        return (
            StatusCode::UNAUTHORIZED,
            Json(serde_json::json!({ "error": "Invalid credentials" })),
        )
            .into_response();
    }

    let token = state.auth.create_session().await;
    (StatusCode::OK, Json(LoginResponse { token })).into_response()
}

pub async fn logout(State(state): State<AppState>, req: Request) -> impl IntoResponse {
    if let Some(token) = extract_token(&req) {
        state.auth.invalidate_session(&token).await;
    }
    (StatusCode::OK, Json(serde_json::json!({ "ok": true }))).into_response()
}

pub async fn check_auth(State(state): State<AppState>, req: Request) -> impl IntoResponse {
    if !state.auth.enabled {
        return Json(AuthCheckResponse { authenticated: true, username: Some(state.auth.username.clone()) }).into_response();
    }
    let authenticated = if let Some(token) = extract_token(&req) {
        state.auth.validate_session(&token).await
    } else {
        false
    };
    let username = if authenticated { Some(state.auth.username.clone()) } else { None };
    Json(AuthCheckResponse { authenticated, username }).into_response()
}

pub fn extract_token(req: &Request) -> Option<String> {
    // Bearer header
    if let Some(val) = req.headers().get(header::AUTHORIZATION) {
        if let Ok(s) = val.to_str() {
            if let Some(token) = s.strip_prefix("Bearer ") {
                return Some(token.to_string());
            }
        }
    }
    // Cookie
    if let Some(val) = req.headers().get(header::COOKIE) {
        if let Ok(s) = val.to_str() {
            for part in s.split(';') {
                let part = part.trim();
                if let Some(token) = part.strip_prefix("koas_token=") {
                    return Some(token.to_string());
                }
            }
        }
    }
    // ?token= query param (for WebSocket)
    if let Some(query) = req.uri().query() {
        for pair in query.split('&') {
            if let Some(token) = pair.strip_prefix("token=") {
                return Some(urlencoding::decode(token).unwrap_or_default().to_string());
            }
        }
    }
    None
}

pub async fn auth_middleware(
    State(state): State<AppState>,
    req: Request,
    next: Next,
) -> Response {
    let path = req.uri().path().to_string();

    // Public routes
    let public = ["/api/auth/login", "/api/auth/check", "/api/health"];
    if public.iter().any(|p| path == *p) {
        return next.run(req).await;
    }

    // Static assets — no auth needed
    if !path.starts_with("/api/") {
        return next.run(req).await;
    }

    if !state.auth.enabled {
        return next.run(req).await;
    }

    if let Some(token) = extract_token(&req) {
        if state.auth.validate_session(&token).await {
            return next.run(req).await;
        }
    }

    (
        StatusCode::UNAUTHORIZED,
        Json(serde_json::json!({ "error": "Unauthorized" })),
    )
        .into_response()
}
