#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/.env"
API_DIR="$ROOT_DIR/backend"
UI_DIR="$ROOT_DIR/frontend"
MIGRATION_DIR="$ROOT_DIR/backend/src/migrations"

read_env() {
  awk -F= -v key="$1" '$0 !~ /^[[:space:]]*#/ && $1 == key { value=substr($0,index($0,"=")+1); gsub(/^[[:space:]]+|[[:space:]]+$/, "", value); gsub(/^["\047]|["\047]$/, "", value); print value; exit }' "$ENV_FILE"
}

load_env_key() {
  local key="$1" parsed
  [ -n "${!key-}" ] && return 0
  [ -f "$ENV_FILE" ] || return 0
  parsed="$(read_env "$key")"
  [ -z "$parsed" ] || export "$key=$parsed"
}

if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

BACKEND_PORT="${BACKEND_PORT:-3001}"
FRONTEND_PORT="${FRONTEND_PORT:-3000}"
export ENABLE_GENERATED_FEATURES="${ENABLE_GENERATED_FEATURES:-true}"

fail() {
  printf 'error: %s\n' "$*" >&2
  exit 1
}

check_config() {
  local jwt_secret="${JWT_SECRET:-}"
  command -v node >/dev/null || fail "node is required"
  command -v npm >/dev/null || fail "npm is required"
  [ -n "${DATABASE_URL:-}" ] || fail "DATABASE_URL is required"
  [ -n "${GOVERNANCE_TENANT_ID:-}" ] || fail "GOVERNANCE_TENANT_ID is required"
  [ "${#jwt_secret}" -ge 32 ] || fail "JWT_SECRET must contain at least 32 characters"
  case "$DATABASE_URL" in
    *example*|*changeme*|*password@*) fail "DATABASE_URL still contains a placeholder" ;;
  esac
  printf 'configuration valid for tenant %s\n' "$GOVERNANCE_TENANT_ID"
}

migrate() {
  check_config
  [ "${ALLOW_SCHEMA_MIGRATION:-0}" = "1" ] || fail "set ALLOW_SCHEMA_MIGRATION=1 for the explicit migration command"
  command -v psql >/dev/null || fail "psql is required for migrations"
  found=0
  for migration in "$MIGRATION_DIR"/*.sql; do
    [ -f "$migration" ] || continue
    found=1
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$migration"
  done
  [ "$found" = "1" ] || fail "no migrations found in $MIGRATION_DIR"
}

start_services() {
  check_config
  [ -d "$API_DIR/node_modules" ] || fail "backend dependencies are missing; install them explicitly"
  [ -d "$UI_DIR/node_modules" ] || fail "frontend dependencies are missing; install them explicitly"
  for port in "$BACKEND_PORT" "$FRONTEND_PORT"; do
    lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && fail "port $port is already in use"
  done
  if [ "${MIGRATE_ON_START:-false}" = "true" ]; then
    psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$MIGRATION_DIR/001_governed_workflows.sql"
  fi
  (cd "$API_DIR" && exec node src/server.js) &
  api_pid=$!
  (cd "$UI_DIR" && exec ./node_modules/.bin/vite --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort) &
  ui_pid=$!
  trap 'kill "$api_pid" "$ui_pid" 2>/dev/null || true; wait "$api_pid" "$ui_pid" 2>/dev/null || true' INT TERM EXIT
  wait "$api_pid" "$ui_pid"
}

case "${1:-start}" in
  check) check_config ;;
  migrate) migrate ;;
  start) start_services ;;
  *) fail "usage: $0 {check|migrate|start}" ;;
esac
