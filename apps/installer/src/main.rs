use std::env;
use std::fs;
use std::io::{self, BufRead, Write};
use std::path::Path;
use std::process::{Command, ExitCode, Stdio};

const REPO: &str = "kana-consultant/koas";
const SERVICE_USER: &str = "koas";

#[derive(Clone, Copy, PartialEq, Eq)]
enum Mode {
    System,
    User,
}

enum Source {
    GitHubLatest,
    Local(String),
}

struct Layout {
    mode: Mode,
    binary_path: String,
    env_file: String,
    env_dir: String,
    data_dir: String,
    unit_file: String,
    unit_dir: String,
}

fn main() -> ExitCode {
    match run() {
        Ok(()) => ExitCode::SUCCESS,
        Err(e) => {
            eprintln!("\x1b[31m[koas]\x1b[0m {e}");
            ExitCode::FAILURE
        }
    }
}

fn run() -> Result<(), String> {
    let cli = Cli::parse(env::args().skip(1))?;
    let mode = resolve_mode(cli.mode_override);
    let layout = layout_for(mode)?;

    if mode == Mode::System {
        require_root()?;
    } else if running_as_root() {
        return Err(
            "User-mode install must not run as root — re-run without sudo so the service is owned by your user".into(),
        );
    }

    let source = match cli.binary {
        Some(p) => Source::Local(p),
        None => Source::GitHubLatest,
    };

    let target = detect_target()?;
    install_binary(&source, &target, &layout)?;
    ensure_service_user(mode)?;
    ensure_data_dir(&layout)?;
    ensure_env_file(&layout)?;
    write_service_unit(&layout)?;
    enable_and_start_service(mode)?;

    print_done(&layout);
    Ok(())
}

struct Cli {
    binary: Option<String>,
    mode_override: Option<Mode>,
}

impl Cli {
    fn parse(args: impl IntoIterator<Item = String>) -> Result<Self, String> {
        let mut binary = None;
        let mut mode_override = None;
        let mut it = args.into_iter();
        while let Some(arg) = it.next() {
            match arg.as_str() {
                "--user" => mode_override = Some(Mode::User),
                "--system" => mode_override = Some(Mode::System),
                "--binary" => {
                    binary = Some(it.next().ok_or("--binary needs a path argument")?);
                }
                "-h" | "--help" => {
                    print_help();
                    std::process::exit(0);
                }
                other => return Err(format!("unknown argument: {other}")),
            }
        }
        Ok(Self {
            binary,
            mode_override,
        })
    }
}

fn print_help() {
    println!(
        "koas-install — provision the koas systemd service\n\n\
USAGE:\n    koas-install [OPTIONS]\n\n\
OPTIONS:\n    \
--binary <PATH>   Install from a local binary instead of the latest GitHub release\n    \
--user            Force user-mode install (~/.local/bin, systemctl --user)\n    \
--system          Force system-mode install (/usr/local/bin, sudo required)\n    \
-h, --help        Show this help\n\n\
By default, NixOS triggers user-mode; other distros use system-mode."
    );
}

fn resolve_mode(override_mode: Option<Mode>) -> Mode {
    if let Some(m) = override_mode {
        return m;
    }
    if is_nixos() {
        Mode::User
    } else {
        Mode::System
    }
}

fn is_nixos() -> bool {
    fs::read_to_string("/etc/os-release")
        .map(|s| s.lines().any(|l| l.trim() == "ID=nixos"))
        .unwrap_or(false)
}

fn running_as_root() -> bool {
    run_capture("id", &["-u"])
        .ok()
        .map(|s| s.trim() == "0")
        .unwrap_or(false)
}

fn layout_for(mode: Mode) -> Result<Layout, String> {
    Ok(match mode {
        Mode::System => Layout {
            mode,
            binary_path: "/usr/local/bin/koas".into(),
            env_file: "/etc/koas/env".into(),
            env_dir: "/etc/koas".into(),
            data_dir: "/var/lib/koas".into(),
            unit_file: "/etc/systemd/system/koas.service".into(),
            unit_dir: "/etc/systemd/system".into(),
        },
        Mode::User => {
            let home = env::var("HOME").map_err(|_| "HOME is not set".to_string())?;
            Layout {
                mode,
                binary_path: format!("{home}/.local/bin/koas"),
                env_file: format!("{home}/.config/koas/env"),
                env_dir: format!("{home}/.config/koas"),
                data_dir: format!("{home}/.local/share/koas"),
                unit_file: format!("{home}/.config/systemd/user/koas.service"),
                unit_dir: format!("{home}/.config/systemd/user"),
            }
        }
    })
}

fn require_root() -> Result<(), String> {
    if !running_as_root() {
        return Err("System-mode install must run as root: sudo koas-install".into());
    }
    Ok(())
}

fn detect_target() -> Result<String, String> {
    let arch = run_capture("uname", &["-m"])?.trim().to_string();
    match arch.as_str() {
        "x86_64" => Ok("x86_64-unknown-linux-musl".into()),
        "aarch64" => Ok("aarch64-unknown-linux-musl".into()),
        other => Err(format!("Unsupported architecture: {other}")),
    }
}

fn install_binary(source: &Source, target: &str, layout: &Layout) -> Result<(), String> {
    fs::create_dir_all(parent_of(&layout.binary_path))
        .map_err(|e| format!("mkdir {}: {e}", parent_of(&layout.binary_path)))?;

    match source {
        Source::Local(path) => {
            info(&format!("Installing local binary: {path}"));
            copy_with_mode(path, &layout.binary_path, 0o755)?;
        }
        Source::GitHubLatest => {
            let version = fetch_latest_version()?;
            info(&format!("Installing koas {version} ({target})"));
            let tmp = make_tempdir()?;
            let archive = format!("{tmp}/koas.tar.gz");
            let url = format!(
                "https://github.com/{REPO}/releases/download/{version}/koas-{target}.tar.gz"
            );
            run_check("curl", &["-fsSL", &url, "-o", &archive])?;
            run_check("tar", &["-xzf", &archive, "-C", &tmp])?;
            let extracted = format!("{tmp}/koas-{target}");
            copy_with_mode(&extracted, &layout.binary_path, 0o755)?;
            let _ = fs::remove_dir_all(&tmp);
        }
    }
    info(&format!("Binary installed to {}", layout.binary_path));
    Ok(())
}

fn fetch_latest_version() -> Result<String, String> {
    let url = format!("https://api.github.com/repos/{REPO}/releases/latest");
    let body = run_capture("curl", &["-fsSL", &url])?;
    parse_tag_name(&body)
        .ok_or_else(|| "Could not fetch latest version (no GitHub release published yet?)".into())
}

fn parse_tag_name(body: &str) -> Option<String> {
    let key = "\"tag_name\"";
    let start = body.find(key)?;
    let rest = &body[start + key.len()..];
    let after_colon = rest.find(':')?;
    let after = &rest[after_colon + 1..];
    let quote = after.find('"')?;
    let value_start = quote + 1;
    let end = after[value_start..].find('"')?;
    Some(after[value_start..value_start + end].to_string())
}

fn copy_with_mode(src: &str, dest: &str, mode: u32) -> Result<(), String> {
    fs::copy(src, dest).map_err(|e| format!("copy {src} -> {dest}: {e}"))?;
    let mode_str = format!("{mode:o}");
    run_check("chmod", &[&mode_str, dest])?;
    Ok(())
}

fn ensure_service_user(mode: Mode) -> Result<(), String> {
    if mode == Mode::User {
        return Ok(());
    }
    let status = Command::new("id")
        .arg(SERVICE_USER)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .status()
        .map_err(|e| format!("id: {e}"))?;
    if !status.success() {
        run_check(
            "useradd",
            &[
                "-r",
                "-U",
                "-s",
                "/usr/sbin/nologin",
                "-d",
                "/var/lib/koas",
                SERVICE_USER,
            ],
        )?;
        info(&format!("Created user: {SERVICE_USER}"));
    }
    Ok(())
}

fn ensure_data_dir(layout: &Layout) -> Result<(), String> {
    fs::create_dir_all(&layout.data_dir)
        .map_err(|e| format!("mkdir {}: {e}", layout.data_dir))?;
    if layout.mode == Mode::System {
        let owner = format!("{SERVICE_USER}:{SERVICE_USER}");
        run_check("chown", &[&owner, &layout.data_dir])?;
    }
    Ok(())
}

fn ensure_env_file(layout: &Layout) -> Result<(), String> {
    if Path::new(&layout.env_file).exists() {
        info(&format!(
            "Env file {} already exists, leaving as-is",
            layout.env_file
        ));
        return Ok(());
    }
    fs::create_dir_all(&layout.env_dir)
        .map_err(|e| format!("mkdir {}: {e}", layout.env_dir))?;

    warn("Set your login credentials:");
    let username = prompt_default("  Username [admin]: ", "admin")?;
    let password = prompt_secret("  Password: ")?;
    if password.is_empty() {
        return Err("Password cannot be empty".into());
    }

    let contents = format!(
        "KOAS_AUTH_USERNAME={username}\nKOAS_AUTH_PASSWORD={password}\nKOAS_DATA_DIR={}\n",
        layout.data_dir
    );
    fs::write(&layout.env_file, contents)
        .map_err(|e| format!("write {}: {e}", layout.env_file))?;
    run_check("chmod", &["600", &layout.env_file])?;
    info(&format!("Credentials saved to {}", layout.env_file));
    Ok(())
}

fn write_service_unit(layout: &Layout) -> Result<(), String> {
    fs::create_dir_all(&layout.unit_dir)
        .map_err(|e| format!("mkdir {}: {e}", layout.unit_dir))?;
    let user_line = match layout.mode {
        Mode::System => format!("User={SERVICE_USER}\n"),
        Mode::User => String::new(),
    };
    let cap_line = match layout.mode {
        Mode::System => "AmbientCapabilities=CAP_NET_BIND_SERVICE\n",
        Mode::User => "",
    };
    let install_target = match layout.mode {
        Mode::System => "multi-user.target",
        Mode::User => "default.target",
    };
    let unit = format!(
        "[Unit]\n\
Description=koas — Server Management\n\
After=network.target\n\
\n\
[Service]\n\
Type=simple\n\
{user_line}\
EnvironmentFile={env}\n\
ExecStart={bin}\n\
Restart=on-failure\n\
RestartSec=5s\n\
{cap_line}\
\n\
[Install]\n\
WantedBy={install_target}\n",
        env = layout.env_file,
        bin = layout.binary_path,
    );
    fs::write(&layout.unit_file, unit)
        .map_err(|e| format!("write {}: {e}", layout.unit_file))?;
    Ok(())
}

fn enable_and_start_service(mode: Mode) -> Result<(), String> {
    let prefix: &[&str] = match mode {
        Mode::System => &[],
        Mode::User => &["--user"],
    };
    let systemctl = |args: &[&str]| -> Result<(), String> {
        let combined: Vec<&str> = prefix.iter().copied().chain(args.iter().copied()).collect();
        run_check("systemctl", &combined)
    };
    systemctl(&["daemon-reload"])?;
    systemctl(&["enable", "koas"])?;
    systemctl(&["restart", "koas"])?;
    info("koas service started");
    Ok(())
}

fn print_done(layout: &Layout) {
    let port = read_env_value(&layout.env_file, "KOAS_PORT").unwrap_or_else(|| "3000".into());
    let host = primary_ip().unwrap_or_else(|| "127.0.0.1".into());
    println!();
    info(&format!("Done! koas is running at http://{host}:{port}"));
    if layout.mode == Mode::User {
        info("This is a user service. To keep it running after logout:");
        info("  sudo loginctl enable-linger $USER");
        info("Manage it with: systemctl --user {status,restart,stop,logs} koas");
    } else {
        info("Manage it with: systemctl {status,restart,stop} koas");
    }
}

fn read_env_value(path: &str, key: &str) -> Option<String> {
    let body = fs::read_to_string(path).ok()?;
    for line in body.lines() {
        if let Some((k, v)) = line.split_once('=')
            && k == key
        {
            return Some(v.to_string());
        }
    }
    None
}

fn primary_ip() -> Option<String> {
    let out = run_capture("hostname", &["-I"]).ok()?;
    out.split_whitespace().next().map(|s| s.to_string())
}

fn parent_of(path: &str) -> String {
    Path::new(path)
        .parent()
        .map(|p| p.to_string_lossy().into_owned())
        .unwrap_or_else(|| ".".into())
}

fn prompt_default(label: &str, default: &str) -> Result<String, String> {
    print!("{label}");
    io::stdout().flush().ok();
    let mut buf = String::new();
    io::stdin()
        .lock()
        .read_line(&mut buf)
        .map_err(|e| format!("stdin: {e}"))?;
    let trimmed = buf.trim().to_string();
    if trimmed.is_empty() {
        Ok(default.to_string())
    } else {
        Ok(trimmed)
    }
}

fn prompt_secret(label: &str) -> Result<String, String> {
    print!("{label}");
    io::stdout().flush().ok();
    let _ = Command::new("stty").arg("-echo").status();
    let mut buf = String::new();
    let result = io::stdin().lock().read_line(&mut buf);
    let _ = Command::new("stty").arg("echo").status();
    println!();
    result.map_err(|e| format!("stdin: {e}"))?;
    Ok(buf.trim_end_matches('\n').trim_end_matches('\r').to_string())
}

fn make_tempdir() -> Result<String, String> {
    let out = run_capture("mktemp", &["-d"])?;
    Ok(out.trim().to_string())
}

fn run_check(program: &str, args: &[&str]) -> Result<(), String> {
    let status = Command::new(program)
        .args(args)
        .status()
        .map_err(|e| format!("{program}: {e}"))?;
    if !status.success() {
        return Err(format!("{program} exited with {status}"));
    }
    Ok(())
}

fn run_capture(program: &str, args: &[&str]) -> Result<String, String> {
    let out = Command::new(program)
        .args(args)
        .output()
        .map_err(|e| format!("{program}: {e}"))?;
    if !out.status.success() {
        return Err(format!(
            "{program} exited with {}: {}",
            out.status,
            String::from_utf8_lossy(&out.stderr).trim()
        ));
    }
    String::from_utf8(out.stdout).map_err(|e| format!("{program} stdout not utf8: {e}"))
}

fn info(msg: &str) {
    println!("\x1b[32m[koas]\x1b[0m {msg}");
}

fn warn(msg: &str) {
    println!("\x1b[33m[koas]\x1b[0m {msg}");
}
