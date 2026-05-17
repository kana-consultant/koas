pub mod config;
pub mod error;
pub mod machine;
pub mod os;
pub mod packages;
pub mod service;
pub mod ssh;

pub use config::CoreConfig;
pub use error::KoasError;
pub use machine::{
    manager::MachineManager,
    types::{CreateMachineRequest, Machine, MachineId, UpdateMachineRequest},
};
pub use os::{detect_os, OsFamily, OsInfo};
pub use packages::{manager::PackageManager, types::*};
pub use service::{
    manager::ServiceManager,
    types::{LogOptions, OutputLine, ServiceAction, ServiceInfo, ServiceStatus},
};
pub use ssh::{
    auth::{SshAuthMethod, SshCredentials},
    session::SshSession,
    types::SshTarget,
};
