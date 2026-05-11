use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::{application::create_server::CreateServerInput, domain::server::Server};

#[derive(Deserialize)]
pub struct CreateServerRequest {
    pub name: String,
    pub host: String,
    pub port: u16,
    pub token: String,
}

impl From<CreateServerRequest> for CreateServerInput {
    fn from(req: CreateServerRequest) -> Self {
        CreateServerInput {
            name: req.name,
            host: req.host,
            port: req.port,
            token: req.token,
        }
    }
}

#[derive(Serialize)]
pub struct ServerResponse {
    pub id: Uuid,
    pub name: String,
    pub host: String,
    pub port: u16,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl From<Server> for ServerResponse {
    fn from(s: Server) -> Self {
        ServerResponse {
            id: s.id,
            name: s.name,
            host: s.host,
            port: s.port,
            created_at: s.created_at,
            updated_at: s.updated_at,
        }
    }
}
