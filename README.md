# koas — VPS Orchestrator

A self-hosted server management platform. Monitor system services, manage packages, and orchestrate remote machines over SSH — all from a single web UI.

---

## Features

- **System Overview** — hostname, OS, kernel, architecture, uptime at a glance
- **Service Management** — list, start, stop, and restart systemd/launchctl/rc-service units; tail live logs
- **Package Manager** — install, remove, upgrade packages via apt / dnf / pacman / zypper / apk / brew / pkg
- **SSH Machines** — register remote servers, test connectivity, manage credentials (password or key file)
- **Multi-OS Support** — Debian, RHEL, Arch, SUSE, Alpine, macOS, FreeBSD
- **Session Auth** — username/password login with server-side session tokens

---

## Architecture

Monorepo managed with [moonrepo](https://moonrepo.dev).

```
apps/
  api/        # Rust library — hexagonal architecture
  gateway/    # Rust binary — Axum HTTP server
  web/        # React + Vite frontend
.moon/        # moonrepo workspace config
```

### Backend layers (`apps/api`)

```
domain/           # Entities, repository traits, error types
application/      # Use cases wrapping Arc<dyn Repository>
infrastructure/   # JSON file store, SSH (russh), OS detection, auth
presentation/     # Axum handlers, middleware, error mapping
```

### Frontend (`apps/web`)

```
src/
  libs/
    api/          # Axios client
    auth/         # Token storage
  routes/
    dashboard/    # Dashboard page + _apis/ (query key factories)
    services/     # Services list + _apis/
    services.$name/  # Service detail + _apis/
    packages/     # Package manager + _apis/
    machines/     # Machine list + _apis/
    login/        # Auth page + _apis/
  components/
    ui/           # Button, Card, Badge, StatCard, BarChart, ProgressGauge, TimeTracker …
    layout/       # AppLayout (sidebar + topbar)
```

---

## Stack

| Layer | Technology |
|---|---|
| Backend | Rust 2024, Axum 0.8, tokio, russh, serde |
| Frontend | React 19, TanStack Router v1, TanStack Query v5, Tailwind CSS v4 |
| Build | Cargo (workspace), Vite 6, pnpm |
| Orchestration | moonrepo 2.x |

---

## Getting Started

### Prerequisites

- Rust stable (`rustup update stable`)
- Node.js 22+ and pnpm 9+
- moon (`npm i -g @moonrepo/cli` or via [moonrepo.dev/install](https://moonrepo.dev/docs/install))

### Environment

```bash
# Required — set before running the server
export KOAS_AUTH_USERNAME=admin
export KOAS_AUTH_PASSWORD=yourpassword

# Optional
export KOAS_PORT=3000          # default: 3000
export KOAS_HOST=127.0.0.1    # default: 127.0.0.1
export KOAS_DATA_DIR=./data   # where machine JSON files are stored
export KOAS_STATIC_DIR=./static  # built frontend assets (production)
```

### Development

Run both servers concurrently:

```bash
# Terminal 1 — backend
KOAS_AUTH_USERNAME=admin KOAS_AUTH_PASSWORD=admin moon run gateway:dev

# Terminal 2 — frontend (proxies /api → localhost:3000)
moon run web:dev
```

Frontend: http://localhost:5173  
API: http://localhost:3000

### Build

```bash
# Check all projects
moon run :check

# Build backend binary
moon run gateway:build

# Build frontend
moon run web:build
```

### Available moon tasks

| Target | Description |
|---|---|
| `moon run web:dev` | Start Vite dev server |
| `moon run web:build` | Production frontend bundle |
| `moon run web:typecheck` | TypeScript type check |
| `moon run gateway:dev` | Start Axum server (watches api) |
| `moon run gateway:build` | Compile release binary |
| `moon run api:check` | cargo check on the library |
| `moon run api:clippy` | Run clippy lints |

---

## SSH Machine Auth

Three auth methods are supported when registering a machine:

| Method | Notes |
|---|---|
| `password` | Plain password over SSH |
| `key_file` | Path to OpenSSH private key, optional passphrase |
| `agent` | Not yet supported — use password or key file |

Machine records are persisted as JSON files in `KOAS_DATA_DIR` (default `./data/machines/`).

---

## API Reference

All endpoints are under `/api`. Requests to protected routes require a `Bearer <token>` header obtained from `/api/auth/login`.

### Auth
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/login` | `{ username, password }` → `{ token }` |
| `POST` | `/api/auth/logout` | Invalidate session |
| `GET` | `/api/auth/check` | Check session validity |

### System
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/system/info` | OS info, hostname, uptime |
| `GET` | `/api/system/services` | List all services |
| `GET` | `/api/system/services/:name` | Service detail |
| `POST` | `/api/system/services/:name/action` | `{ action: "start"\|"stop"\|"restart" }` |
| `GET` | `/api/system/services/:name/logs` | Recent log entries |

### Packages
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/system/packages` | List installed packages |
| `GET` | `/api/system/packages/search?q=` | Search available packages |
| `POST` | `/api/system/packages` | `{ name }` — install package |
| `DELETE` | `/api/system/packages/:name` | Remove package |
| `POST` | `/api/system/packages/upgrade` | Upgrade all packages |

### Machines
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/machines` | List registered machines |
| `POST` | `/api/machines` | Register new machine |
| `GET` | `/api/machines/:id` | Get machine |
| `PUT` | `/api/machines/:id` | Update machine |
| `DELETE` | `/api/machines/:id` | Remove machine |
| `POST` | `/api/machines/:id/test` | Test SSH connectivity |

---

## License

MIT
