#!/bin/bash
set -euo pipefail

DEPLOY_ROOT="/Users/clevent/server/sites/production-moscow"
NODE_BIN="$DEPLOY_ROOT/runtime/node/bin/node"
SCRIPT="$DEPLOY_ROOT/bin/crawl-site-knowledge.mjs"
OUTPUT_DIR="$DEPLOY_ROOT/data/site-knowledge"
LOCK_DIR="$DEPLOY_ROOT/data/.knowledge-crawler.lock"

if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  echo "Knowledge crawler is already running; skip this invocation."
  exit 0
fi
cleanup() {
  rmdir "$LOCK_DIR" >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

test -x "$NODE_BIN"
test -f "$SCRIPT"
install -d -m 700 "$OUTPUT_DIR"

"$NODE_BIN" "$SCRIPT" \
  --base-url "https://www.productionmoscow.ru" \
  --output-dir "$OUTPUT_DIR"
