FROM lukemathwalker/cargo-chef:latest-rust-1-slim-bookworm AS chef
WORKDIR /app

FROM chef AS planner
COPY . .
RUN cargo chef prepare --recipe-path recipe.json

FROM chef AS builder
COPY --from=planner /app/recipe.json recipe.json
RUN cargo chef cook --release --recipe-path recipe.json
COPY . .
RUN cargo build --release -p koas-server

FROM debian:bookworm-slim AS runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*
RUN mkdir -p /data
COPY --from=builder /app/target/release/koas-server /usr/local/bin/koas-server
ENV PORT=3000 \
    DATABASE_URL=sqlite:///data/koas.db
EXPOSE 3000
VOLUME ["/data"]
CMD ["koas-server"]
