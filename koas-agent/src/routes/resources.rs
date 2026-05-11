use axum::Json;
use sysinfo::{Disks, System};
use koas_errors::AppError;
use crate::models::Resources;

pub async fn handler() -> Result<Json<Resources>, AppError> {
    let mut sys = System::new_all();
    sys.refresh_all();

    let cpu_usage = sys.global_cpu_usage();
    let memory_total = sys.total_memory();
    let memory_used = sys.used_memory();
    let memory_percent = if memory_total > 0 {
        (memory_used as f32 / memory_total as f32) * 100.0
    } else {
        0.0
    };

    let disks = Disks::new_with_refreshed_list();
    let (disk_total, disk_used) = disks.list().iter().fold((0u64, 0u64), |(t, u), d| {
        (t + d.total_space(), u + (d.total_space() - d.available_space()))
    });
    let disk_percent = if disk_total > 0 {
        (disk_used as f32 / disk_total as f32) * 100.0
    } else {
        0.0
    };

    let load = System::load_average();
    let uptime = System::uptime();

    Ok(Json(Resources {
        cpu_usage,
        memory_total,
        memory_used,
        memory_percent,
        disk_total,
        disk_used,
        disk_percent,
        load_avg_1: load.one,
        load_avg_5: load.five,
        load_avg_15: load.fifteen,
        uptime_seconds: uptime,
    }))
}
