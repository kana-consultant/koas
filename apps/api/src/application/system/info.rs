use crate::domain::system::OsInfo;
use crate::infrastructure::os::detect_os;

pub struct GetSystemInfoUseCase;

impl GetSystemInfoUseCase {
    pub async fn execute(&self) -> OsInfo {
        detect_os().await
    }
}
