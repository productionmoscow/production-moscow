#!/bin/bash
set -euo pipefail

DEPLOY_ROOT="/Users/clevent/server/sites/production-moscow"
NODE_BIN="$DEPLOY_ROOT/runtime/node/bin/node"
SCRIPT="$DEPLOY_ROOT/bin/crawl-site-knowledge.mjs"
OUTPUT_DIR="$DEPLOY_ROOT/data/site-knowledge"
RENTAL_PARSER_ROOT="$DEPLOY_ROOT/zoom-prokat-parser"
RENTAL_SCRIPT="$RENTAL_PARSER_ROOT/scripts/zoom-prokat-knowledge.mjs"
RENTAL_OUTPUT_DIR="$DEPLOY_ROOT/data/zoom-prokat-knowledge"
RENTAL_XLSX="$DEPLOY_ROOT/data/zoom-prokat/zoom-prokat-prices.xlsx"
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
test -f "$RENTAL_SCRIPT"
install -d -m 700 "$OUTPUT_DIR"
install -d -m 700 "$RENTAL_OUTPUT_DIR" "$(dirname "$RENTAL_XLSX")"

"$NODE_BIN" "$SCRIPT" \
  --base-url "https://www.productionmoscow.ru" \
  --output-dir "$OUTPUT_DIR"

"$NODE_BIN" "$RENTAL_SCRIPT" \
  --base-url "https://zoom-prokat.ru/" \
  --output-dir "$RENTAL_OUTPUT_DIR" \
  --xlsx-out "$RENTAL_XLSX"
