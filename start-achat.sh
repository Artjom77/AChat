#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║         🔐 AChat - Полноценный мессенджер 🚀              ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}Запускаю все сервисы...${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Kill previous instances
pkill -f "simple-backend.py" 2>/dev/null
pkill -f "http.server 4000" 2>/dev/null
pkill -f "uvicorn app.main" 2>/dev/null
sleep 1

# Start Backend API
echo -e "${BLUE}[1/3]${NC} Запускаю Backend API..."
python3 simple-backend.py > /tmp/achat-backend.log 2>&1 &
sleep 2

# Check Backend
if curl -s http://localhost:5000/ > /dev/null; then
    echo -e "${GREEN}✅ Backend API запущен${NC}"
else
    echo -e "${RED}❌ Ошибка запуска Backend API${NC}"
    exit 1
fi

# Start Web Server (from root to serve both landing page and messenger)
echo -e "${BLUE}[2/3]${NC} Запускаю веб-сервер..."
python3 -m http.server 4000 > /tmp/achat-web.log 2>&1 &
sleep 2

# Check Web Server
if curl -s http://localhost:4000/ > /dev/null; then
    echo -e "${GREEN}✅ Веб-сервер запущен${NC}"
else
    echo -e "${RED}❌ Ошибка запуска веб-сервера${NC}"
    exit 1
fi

# Start AI Service (optional)
echo -e "${BLUE}[3/3]${NC} Запускаю AI Service (опционально)..."
cd "$SCRIPT_DIR/apps/ai-service"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/achat-ai.log 2>&1 &
sleep 3

# Check AI Service
if curl -s http://localhost:8000/ > /dev/null; then
    echo -e "${GREEN}✅ AI Service запущен${NC}"
else
    echo -e "${YELLOW}⚠️  AI Service не запущен (не критично)${NC}"
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║                  🎉 ВСЁ ГОТОВО!                           ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Главная страница:${NC} http://localhost:4000"
echo -e "${GREEN}💬 Мессенджер:${NC}       http://localhost:4000/messenger/"
echo -e "${GREEN}🔧 Backend API:${NC}      http://localhost:5000"
echo -e "${GREEN}🤖 AI Service:${NC}       http://localhost:8000"
echo ""
echo -e "${YELLOW}Что делать дальше:${NC}"
echo "1. Открой в браузере: ${GREEN}http://localhost:4000${NC}"
echo "2. Зарегистрируйся или войди прямо на главной странице"
echo "3. Нажми 'Начать общение' - откроется мессенджер"
echo "4. Выбери пользователя и начни чат!"
echo ""
echo -e "${YELLOW}📱 Установка как приложение:${NC}"
echo "   После открытия сайта нажми кнопку 'Установить приложение'"
echo "   в браузере Chrome/Edge для установки PWA на главный экран"
echo ""
echo -e "${YELLOW}Для остановки всех сервисов:${NC}"
echo "  pkill -f 'simple-backend.py|http.server 4000|uvicorn'"
echo ""
echo -e "${GREEN}Хорошего общения! 💬✨${NC}"
