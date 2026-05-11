use async_trait::async_trait;
use chrono::{DateTime, Utc};
use koas_database::DbPool;
use koas_errors::AppError;
use uuid::Uuid;
use crate::domain::{repository::ServerRepository, server::Server};

pub struct SqliteServerRepository {
    pool: DbPool,
}

impl SqliteServerRepository {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }
}

#[derive(sqlx::FromRow)]
struct ServerRow {
    id: String,
    name: String,
    host: String,
    port: i64,
    token: String,
    created_at: String,
    updated_at: String,
}

impl TryFrom<ServerRow> for Server {
    type Error = AppError;

    fn try_from(row: ServerRow) -> Result<Self, Self::Error> {
        Ok(Server {
            id: Uuid::parse_str(&row.id)
                .map_err(|e| AppError::InternalError(e.to_string()))?,
            name: row.name,
            host: row.host,
            port: row.port as u16,
            token: row.token,
            created_at: row
                .created_at
                .parse::<DateTime<Utc>>()
                .map_err(|e| AppError::InternalError(e.to_string()))?,
            updated_at: row
                .updated_at
                .parse::<DateTime<Utc>>()
                .map_err(|e| AppError::InternalError(e.to_string()))?,
        })
    }
}

#[async_trait]
impl ServerRepository for SqliteServerRepository {
    async fn list(&self) -> Result<Vec<Server>, AppError> {
        let rows = sqlx::query_as::<_, ServerRow>(
            "SELECT id, name, host, port, token, created_at, updated_at FROM servers ORDER BY created_at DESC"
        )
        .fetch_all(&self.pool)
        .await?;

        rows.into_iter().map(Server::try_from).collect()
    }

    async fn find_by_id(&self, id: Uuid) -> Result<Option<Server>, AppError> {
        let row = sqlx::query_as::<_, ServerRow>(
            "SELECT id, name, host, port, token, created_at, updated_at FROM servers WHERE id = ?"
        )
        .bind(id.to_string())
        .fetch_optional(&self.pool)
        .await?;

        row.map(Server::try_from).transpose()
    }

    async fn create(&self, server: Server) -> Result<Server, AppError> {
        sqlx::query(
            "INSERT INTO servers (id, name, host, port, token, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(server.id.to_string())
        .bind(&server.name)
        .bind(&server.host)
        .bind(server.port as i64)
        .bind(&server.token)
        .bind(server.created_at.to_rfc3339())
        .bind(server.updated_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(server)
    }

    async fn delete(&self, id: Uuid) -> Result<(), AppError> {
        sqlx::query("DELETE FROM servers WHERE id = ?")
            .bind(id.to_string())
            .execute(&self.pool)
            .await?;
        Ok(())
    }
}
