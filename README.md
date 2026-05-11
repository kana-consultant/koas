# koas

VPS Server Orchestrator — register multiple Linux servers and monitor them from a single dashboard.

## Features

- **Server registry** — add and remove VPS servers with a name, host, port, and agent token
- **Services** — browse systemd units, Docker containers, running processes, and nginx virtual hosts per server
- **Ports** — see all open TCP ports and which process owns them
- **Resources** — live CPU usage, load averages, memory, disk, and uptime with auto-refresh gauges

## Architecture

```
Browser → nginx (web) → Axum orchestrator → SQLite (server registry)
                                          → koas-agent on VPS 1
                                          → koas-agent on VPS 2
                                          → koas-agent on VPS N
```

| Component | Stack | Purpose |
|---|---|---|
| `koas-agent` | Rust (Axum) | Runs on each VPS, exposes metrics over HTTP |
| `koas-server` | Rust (Axum + SQLite) | Central orchestrator, proxies to agents |
| `web` | React + TanStack Router/Query | Dashboard frontend |

### Rust workspace crates

```
koas-errors      shared AppError → HTTP response
koas-types       shared SingleResponse<T> / ListResponse<T>
koas-database    SQLite pool + auto-migrations
koas-servers     server registry (clean architecture)
koas-proxy       pass-through proxy to agents
koas-agent       VPS agent binary
koas-server      orchestrator binary (entry point)
```

## Agent API

The agent exposes a lightweight HTTP API on each VPS (default port `9000`). All endpoints require `Authorization: Bearer <token>`.

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `GET` | `/services/systemd` | systemd service units |
| `GET` | `/services/docker` | Docker containers |
| `GET` | `/services/processes` | Top 100 processes by CPU |
| `GET` | `/services/nginx` | nginx sites-enabled |
| `GET` | `/ports` | Open TCP ports (`ss -tlnp`) |
| `GET` | `/resources` | CPU, memory, disk, load, uptime |

## Orchestrator API

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/servers` | List registered servers |
| `POST` | `/api/v1/servers` | Register a server |
| `GET` | `/api/v1/servers/:id` | Get a server |
| `DELETE` | `/api/v1/servers/:id` | Remove a server |
| `GET` | `/api/v1/proxy/:id/*path` | Proxy any agent endpoint |

## Getting started

### Prerequisites

- Docker and Docker Compose v2
- Rust 1.83+ (for local development)
- Node.js 22+ and pnpm (for frontend development)

### Run with Docker Compose

```bash
git clone git@github.com:kana-consultant/koas.git
cd koas
cp .env.example .env
docker compose up -d
```

The dashboard is available at `http://localhost`.

### Deploy an agent on a VPS

Build the agent once from the repo root (the agent Dockerfile needs workspace context):

```bash
docker build -f koas-agent/Dockerfile -t koas-agent .
```

Run it on the target VPS:

```bash
docker run -d \
  --name koas-agent \
  --restart unless-stopped \
  --privileged \
  --pid=host \
  --network=host \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v /etc/nginx:/etc/nginx:ro \
  -v /run/systemd:/run/systemd:ro \
  -e AGENT_TOKEN=<your-secret-token> \
  koas-agent
```

Then register the server in the dashboard (or via API):

```bash
curl -X POST http://localhost/api/v1/servers \
  -H 'Content-Type: application/json' \
  -d '{"name":"prod-01","host":"203.0.113.10","port":9000,"token":"your-secret-token"}'
```

### Local development

```bash
# Backend (orchestrator)
cp .env.example .env
cargo run -p koas-server

# Frontend
cd web
pnpm install
pnpm dev          # http://localhost:5173, /api proxied to localhost:3000

# Agent (on a Linux machine)
AGENT_TOKEN=secret cargo run -p koas-agent
```

## Environment variables

### Orchestrator

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `sqlite://./koas.db` | SQLite database path |
| `PORT` | `3000` | Orchestrator listen port |

### Agent

| Variable | Default | Description |
|---|---|---|
| `AGENT_TOKEN` | _(none — auth disabled if empty)_ | Bearer token for agent API |
| `AGENT_PORT` | `9000` | Agent listen port |

### Docker Compose

| Variable | Default | Description |
|---|---|---|
| `WEB_PORT` | `80` | Host port for the web dashboard |
| `AGENT_TOKEN` | _(required when using `--profile agent`)_ | Agent auth token |
| `AGENT_PORT` | `9000` | Agent port (for `--profile agent`) |

## Security

The Docker Compose setup applies the following hardening to `orchestrator` and `web`:

- **`read_only: true`** — immutable container filesystem
- **`cap_drop: ALL`** — all Linux capabilities stripped
- **`no-new-privileges: true`** — blocks setuid/setgid escalation
- **`tmpfs`** — writable scratch space in RAM only (not persisted)
- **Resource limits** — CPU, memory, and PID caps on every container
- **Network isolation** — orchestrator has no host-exposed port; only reachable by the nginx proxy container within the `koas` bridge network
- **Log rotation** — `json-file` driver with `max-size` and `max-file` limits

The agent runs with `--privileged` and `--pid=host` because it needs access to host processes, systemd, and the Docker socket. Treat the agent token as a secret and restrict network access to the agent port at the firewall level.

## Project structure

```
koas/
├── koas-agent/          # VPS agent binary
├── koas-errors/         # Shared error types
├── koas-types/          # Shared response types
├── koas-database/       # Database connection + migrations
├── koas-servers/        # Server registry feature (clean architecture)
│   └── src/
│       ├── domain/
│       ├── application/
│       └── infrastructure/
├── koas-proxy/          # Agent proxy
├── koas-server/         # Orchestrator binary
├── web/                 # React frontend
│   ├── src/apis/        # API layer (services + TanStack Query hooks)
│   ├── src/components/  # UI, feature, and layout components
│   └── src/routes/      # Page components
├── docker-compose.yml
└── .env.example
```
