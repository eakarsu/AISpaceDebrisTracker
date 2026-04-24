#!/bin/bash

# ========================================
# AI Space Debris Tracker - Start Script
# ========================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║    🌌 AI Space Debris Tracker            ║"
echo "  ║    Orbital Situational Awareness          ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# ---- Clean used ports ----
echo -e "${YELLOW}[1/6] Cleaning up used ports...${NC}"
cleanup_port() {
  local port=$1
  local pids=$(lsof -ti :$port 2>/dev/null || true)
  if [ -n "$pids" ]; then
    echo -e "  ${RED}Killing processes on port $port: $pids${NC}"
    echo "$pids" | xargs kill -9 2>/dev/null || true
    sleep 1
  else
    echo -e "  ${GREEN}Port $port is free${NC}"
  fi
}

cleanup_port 3000
cleanup_port 3001

# ---- Check prerequisites ----
echo -e "\n${YELLOW}[2/6] Checking prerequisites...${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
  echo -e "  ${RED}Node.js is not installed. Please install Node.js 18+${NC}"
  exit 1
fi
echo -e "  ${GREEN}Node.js $(node -v)${NC}"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
  echo -e "  ${RED}PostgreSQL is not installed. Please install PostgreSQL${NC}"
  exit 1
fi
echo -e "  ${GREEN}PostgreSQL found${NC}"

# Check if PostgreSQL is running
if ! pg_isready -q 2>/dev/null; then
  echo -e "  ${YELLOW}Starting PostgreSQL...${NC}"
  if [[ "$(uname)" == "Darwin" ]]; then
    brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
  else
    sudo systemctl start postgresql 2>/dev/null || true
  fi
  sleep 2
fi

# Load environment variables
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
  echo -e "  ${GREEN}.env file loaded${NC}"
else
  echo -e "  ${RED}.env file not found!${NC}"
  exit 1
fi

# ---- Create database ----
echo -e "\n${YELLOW}[3/6] Setting up database...${NC}"
DB_NAME=${DB_NAME:-space_debris_tracker}
DB_USER=${DB_USER:-postgres}

# Try to create database (ignore error if exists)
createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null && echo -e "  ${GREEN}Database '$DB_NAME' created${NC}" || echo -e "  ${GREEN}Database '$DB_NAME' already exists${NC}"

# ---- Install dependencies ----
echo -e "\n${YELLOW}[4/6] Installing dependencies...${NC}"

echo -e "  ${BLUE}Installing backend dependencies...${NC}"
cd "$SCRIPT_DIR/backend"
npm install --silent 2>&1 | tail -1

echo -e "  ${BLUE}Installing frontend dependencies...${NC}"
cd "$SCRIPT_DIR/frontend"
npm install --silent 2>&1 | tail -1

cd "$SCRIPT_DIR"

# ---- Seed database ----
echo -e "\n${YELLOW}[5/6] Seeding database...${NC}"
cd "$SCRIPT_DIR/backend"
node src/seeds/seed.js
cd "$SCRIPT_DIR"

# ---- Start services ----
echo -e "\n${YELLOW}[6/6] Starting services with hot-reload...${NC}"

# Start backend with nodemon (watches for changes)
echo -e "  ${BLUE}Starting backend on port ${BACKEND_PORT:-3001}...${NC}"
cd "$SCRIPT_DIR/backend"
npx nodemon src/server.js &
BACKEND_PID=$!

# Start frontend with Vite (hot module replacement)
echo -e "  ${BLUE}Starting frontend on port ${FRONTEND_PORT:-3000}...${NC}"
cd "$SCRIPT_DIR/frontend"
npx vite --port ${FRONTEND_PORT:-3000} &
FRONTEND_PID=$!

cd "$SCRIPT_DIR"

# Trap to cleanup on exit
trap "echo -e '\n${RED}Shutting down...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

echo -e "\n${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  🚀 Application is running!                      ║${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}║  Frontend: http://localhost:${FRONTEND_PORT:-3000}                  ║${NC}"
echo -e "${GREEN}║  Backend:  http://localhost:${BACKEND_PORT:-3001}                  ║${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}║  Login: admin@spacedebris.gov / SpaceDebris2024!  ║${NC}"
echo -e "${GREEN}║                                                    ║${NC}"
echo -e "${GREEN}║  Hot-reload enabled for both frontend & backend   ║${NC}"
echo -e "${GREEN}║  Press Ctrl+C to stop                             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════╝${NC}"

# Wait for both processes
wait
