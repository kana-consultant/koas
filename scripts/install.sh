#!/usr/bin/env bash
set -euo pipefail

REPO="kana-consultant/koas"
INSTALL_DIR="/usr/local/bin"
SERVICE_USER="koas"
DATA_DIR="/var/lib/koas"

info()  { echo -e "\033[32m[koas]\033[0m $*"; }
warn()  { echo -e "\033[33m[koas]\033[0m $*"; }
error() { echo -e "\033[31m[koas]\033[0m $*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || error "Run as root: sudo bash install.sh"

ARCH=$(uname -m)
case "$ARCH" in
  x86_64)  TARGET="x86_64-unknown-linux-musl" ;;
  aarch64) TARGET="aarch64-unknown-linux-musl" ;;
  *)       error "Unsupported architecture: $ARCH" ;;
esac

VERSION=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | cut -d'"' -f4)
[ -n "$VERSION" ] || error "Could not fetch latest version"
info "Installing koas $VERSION ($TARGET)"

URL="https://github.com/$REPO/releases/download/$VERSION/koas-${TARGET}.tar.gz"
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT

curl -fsSL "$URL" -o "$TMP/koas.tar.gz"
tar -xzf "$TMP/koas.tar.gz" -C "$TMP"
install -m 755 "$TMP/koas-${TARGET}" "$INSTALL_DIR/koas"
info "Binary installed to $INSTALL_DIR/koas"

if ! id "$SERVICE_USER" &>/dev/null; then
  useradd -r -s /bin/false -d "$DATA_DIR" "$SERVICE_USER"
  info "Created user: $SERVICE_USER"
fi

mkdir -p "$DATA_DIR"
chown "$SERVICE_USER:$SERVICE_USER" "$DATA_DIR"

if [ ! -f /etc/koas/env ]; then
  mkdir -p /etc/koas
  echo ""
  warn "Set your login credentials:"
  read -rp "  Username [admin]: " USERNAME
  USERNAME="${USERNAME:-admin}"
  read -rsp "  Password: " PASSWORD
  echo ""
  [ -n "$PASSWORD" ] || error "Password cannot be empty"
  cat > /etc/koas/env <<EOF
KOAS_AUTH_USERNAME=$USERNAME
KOAS_AUTH_PASSWORD=$PASSWORD
KOAS_DATA_DIR=$DATA_DIR
EOF
  chmod 600 /etc/koas/env
  info "Credentials saved to /etc/koas/env"
fi

cat > /etc/systemd/system/koas.service <<EOF
[Unit]
Description=koas — Server Management
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
EnvironmentFile=/etc/koas/env
ExecStart=$INSTALL_DIR/koas
Restart=on-failure
RestartSec=5s
AmbientCapabilities=CAP_NET_BIND_SERVICE

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable koas
systemctl restart koas
info "koas service started"

PORT=$(grep KOAS_PORT /etc/koas/env 2>/dev/null | cut -d= -f2 || echo 3000)
echo ""
info "Done! koas is running at http://$(hostname -I | awk '{print $1}'):${PORT}"
