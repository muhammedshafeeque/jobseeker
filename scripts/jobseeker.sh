#!/bin/bash
# Deploy jobseeker → https://jobseeker.byzand.online
# Usage: ~/scripts/jobseeker.sh  (or bash scripts/jobseeker.sh from repo)

set -euo pipefail

RESET="\033[0m"
BOLD="\033[1m"
GREEN="\033[1;32m"
YELLOW="\033[1;33m"
CYAN="\033[1;36m"
RED="\033[1;31m"
BLUE="\033[1;34m"
DIM="\033[2m"

APP_DIR="${APP_DIR:-/home/ubuntu/jobseeker}"
SERVER_DIR="$APP_DIR/server"
ADMIN_DIR="$APP_DIR/msp-admin"
SHARED_RESUME="$APP_DIR/shared/resume"
SERVE_DIR="/var/www/jobseeker"
PM2_NAME="jobseeker-server"
API_PORT=5003
API_ENTRY="dist/server/index.js"
DOMAIN="jobseeker.byzand.online"

STEP=0
START_TIME=$(date +%s)
ERRORS=0

step()    { STEP=$((STEP + 1)); echo -e "\n${CYAN}${BOLD}[${STEP}]${RESET} ${BOLD}$1${RESET}"; }
success() { echo -e "    ${GREEN}✔  $1${RESET}"; }
warn()    { echo -e "    ${YELLOW}⚠  $1${RESET}"; ERRORS=$((ERRORS + 1)); }
fail()    { echo -e "\n${RED}${BOLD}✘  ERROR:${RESET}${RED} $1${RESET}\n"; exit 1; }
header()  { echo -e "\n  ${YELLOW}${BOLD}◆  $1${RESET}"; }

clear
echo -e "\n${BLUE}${BOLD}  JOBSEEKER DEPLOY → https://$DOMAIN${RESET}\n"

header "PRE-FLIGHT"
step "Directories & .env"
[ -d "$SERVER_DIR" ] || fail "Missing $SERVER_DIR"
[ -f "$SERVER_DIR/.env" ] || warn "Create $SERVER_DIR/.env from server/.env.production"
grep -q "^PORT=$API_PORT" "$SERVER_DIR/.env" 2>/dev/null && success "PORT=$API_PORT" || warn "Set PORT=$API_PORT in .env"
grep -q "jobseeker.byzand.online" "$SERVER_DIR/.env" 2>/dev/null && success "Production URLs in .env" || warn "Set FRONTEND_URL=https://$DOMAIN"
mongosh --eval "db.adminCommand('ping')" >/dev/null 2>&1 && success "MongoDB" || warn "MongoDB not running"
sudo nginx -t >/dev/null 2>&1 && success "Nginx OK" || fail "Nginx config invalid"

header "SOURCE"
step "git pull"
cd "$APP_DIR" && git pull origin main && success "Up to date"

header "SHARED RESUME"
step "npm install"
[ -f "$SHARED_RESUME/package.json" ] && (cd "$SHARED_RESUME" && npm install) && success "shared/resume"

header "BACKEND"
step "npm install & build"
cd "$SERVER_DIR"
npm install
npm run build
[ -f "$API_ENTRY" ] || fail "Missing $API_ENTRY after build"
success "Built $API_ENTRY"

step "PM2"
pm2 delete "$PM2_NAME" 2>/dev/null || true
pm2 start "$API_ENTRY" --name "$PM2_NAME" --cwd "$SERVER_DIR" --update-env --time
pm2 save
sleep 4
pm2 describe "$PM2_NAME" | grep -q "online" || fail "PM2 not online"

step "API health"
HTTP=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$API_PORT/api/auth/google" || echo "000")
[ "$HTTP" = "200" ] && success "API HTTP $HTTP" || fail "API check failed (HTTP $HTTP)"

header "FRONTEND"
step "msp-admin build & deploy"
cd "$ADMIN_DIR"
npm install
npm run build
sudo mkdir -p "$SERVE_DIR"
sudo find "$SERVE_DIR" -mindepth 1 -delete 2>/dev/null || true
sudo cp -r dist/. "$SERVE_DIR/"
sudo chown -R www-data:www-data "$SERVE_DIR"
success "Deployed to $SERVE_DIR"

header "NGINX"
step "reload"
sudo nginx -t && sudo systemctl reload nginx && success "Nginx reloaded"

echo -e "\n${GREEN}${BOLD}Done${RESET} — https://$DOMAIN\n"
