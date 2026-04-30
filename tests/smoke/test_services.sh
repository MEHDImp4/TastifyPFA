#!/bin/bash

# TastifyPFA Smoke Tests
# Objective: Verify that active services are up and reachable through direct host ports.

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "Starting smoke tests..."

# 1. Check Docker services status
echo -n "Checking Docker services... "
if docker compose ps | grep -q "Exit"; then
    echo -e "${RED}FAIL${NC} (One or more services exited)"
    docker compose ps
    exit 1
else
    echo -e "${GREEN}OK${NC}"
fi

# 2. Check Backend API
echo -n "Checking Backend API (/api/)... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/)
if [ "$STATUS" -eq 200 ] || [ "$STATUS" -eq 404 ]; then
    # 404 is acceptable if no root /api/ is defined, but we defined /api/health in core
    echo -e "${GREEN}OK${NC} ($STATUS)"
else
    echo -e "${RED}FAIL${NC} ($STATUS)"
    exit 1
fi

# 3. Check Staff SPA
echo -n "Checking Staff SPA (:3000)... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/)
if [ "$STATUS" -eq 200 ]; then
    echo -e "${GREEN}OK${NC} ($STATUS)"
else
    echo -e "${RED}FAIL${NC} ($STATUS)"
    exit 1
fi

# 4. Check Client SPA
echo -n "Checking Client SPA (:3003)... "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/)
if [ "$STATUS" -eq 200 ]; then
    echo -e "${GREEN}OK${NC} ($STATUS)"
else
    echo -e "${RED}FAIL${NC} ($STATUS)"
    exit 1
fi

# 5. Check MySQL (from inside container)
echo -n "Checking MySQL connectivity... "
if docker compose exec db mysqladmin ping -h localhost -u root -p$(grep MYSQL_ROOT_PASSWORD .env | cut -d'=' -f2) > /dev/null 2>&1; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
    exit 1
fi

# 6. Check Redis (from inside container)
echo -n "Checking Redis connectivity... "
if [ "$(docker compose exec redis redis-cli ping | tr -d '\r')" == "PONG" ]; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FAIL${NC}"
    exit 1
fi

echo -e "\n${GREEN}All smoke tests passed!${NC}"
