use sqlx::{
    sqlite::{SqliteConnectOptions, SqlitePoolOptions},
    SqlitePool,
};
use std::str::FromStr;

pub type DbPool = SqlitePool;

pub async fn connect(database_url: &str) -> Result<DbPool, sqlx::Error> {
    let opts = SqliteConnectOptions::from_str(database_url)?.create_if_missing(true);

    SqlitePoolOptions::new()
        .max_connections(5)
        .connect_with(opts)
        .await
}

pub async fn migrate(pool: &DbPool) -> Result<(), sqlx::migrate::MigrateError> {
    sqlx::migrate!("./migrations").run(pool).await
}
