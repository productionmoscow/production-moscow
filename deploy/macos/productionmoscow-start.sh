#!/bin/bash
set -euo pipefail

DEPLOY_ROOT="/Users/clevent/server/sites/production-moscow"
DOCKER_BIN="/Users/clevent/.docker/bin/docker"
EDGE_COMPOSE_FILE="/Users/clevent/server/migration/compose.yaml"
NODE_BIN="$DEPLOY_ROOT/runtime/node/bin"
BRIDGE_NAME="productionmoscow-caddy-bridge"

current="$DEPLOY_ROOT/current"
test -L "$current"
test -d "$current/dist"
test -x "$DOCKER_BIN"
test -x "$NODE_BIN/node"
test -x "$NODE_BIN/npm"

edge_container="$($DOCKER_BIN compose -f "$EDGE_COMPOSE_FILE" ps -q edge)"
test -n "$edge_container"

# The application is a native Mac process and owns host loopback 127.0.0.1:3011.
# The bridge is the only helper in the Caddy network namespace; it forwards
# Caddy's 127.0.0.1:3011 to the same host-only endpoint.
$DOCKER_BIN rm -f "$BRIDGE_NAME" >/dev/null 2>&1 || true

bridge_pid=""
app_pid=""
cleanup() {
  trap - EXIT INT TERM
  if [[ -n "$app_pid" ]]; then
    kill "$app_pid" >/dev/null 2>&1 || true
    wait "$app_pid" >/dev/null 2>&1 || true
  fi
  $DOCKER_BIN rm -f "$BRIDGE_NAME" >/dev/null 2>&1 || true
  if [[ -n "$bridge_pid" ]]; then
    wait "$bridge_pid" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT INT TERM

$DOCKER_BIN run --rm \
  --name "$BRIDGE_NAME" \
  --init \
  --network "container:$edge_container" \
  --volume "$DEPLOY_ROOT/bin:/bridge:ro" \
  node:22-alpine node /bridge/productionmoscow-bridge.mjs &
bridge_pid=$!

export PATH="$NODE_BIN:/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export NODE_ENV=production
export HOST=127.0.0.1
export PORT=3011
env_file="$DEPLOY_ROOT/config/productionmoscow.env"
if [[ -f "$env_file" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$env_file"
  set +a
fi
export PRODUCTIONMOSCOW_VIDEO_ROOT="${PRODUCTIONMOSCOW_VIDEO_ROOT:-/Volumes/cloud/productionmoscow-video-assets}"
cd "$current"
"$NODE_BIN/npm" run start -- --hostname 127.0.0.1 --port 3011 &
app_pid=$!

wait "$app_pid"
