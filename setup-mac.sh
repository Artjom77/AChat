#!/bin/bash

echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🔐 AChat - Автоматическая установка (Mac)             ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}📂 Рабочая директория: $SCRIPT_DIR${NC}"
echo ""

# Step 1: Check Python
echo -e "${BLUE}[1/8]${NC} Проверяю Python..."
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 не найден! Установи Python 3.8+${NC}"
    exit 1
fi
PYTHON_VERSION=$(python3 --version)
echo -e "${GREEN}✅ Найден: $PYTHON_VERSION${NC}"
echo ""

# Step 2: Create/activate venv
echo -e "${BLUE}[2/8]${NC} Настраиваю виртуальное окружение..."
if [ ! -d "venv" ]; then
    echo "Создаю venv..."
    python3 -m venv venv
fi
source venv/bin/activate
echo -e "${GREEN}✅ Venv активирован${NC}"
echo ""

# Step 3: Install dependencies
echo -e "${BLUE}[3/8]${NC} Устанавливаю зависимости..."
pip install --upgrade pip -q
pip install fastapi uvicorn python-dotenv anthropic websockets pydantic httpx -q
echo -e "${GREEN}✅ Основные библиотеки установлены${NC}"

# Install AI service dependencies
cd apps/ai-service
pip install -r requirements.txt -q 2>/dev/null || pip install fastapi uvicorn anthropic python-dotenv pydantic -q
cd "$SCRIPT_DIR"
echo -e "${GREEN}✅ AI сервис готов${NC}"
echo ""

# Step 4: Fix port conflicts (AirPlay uses 5000 on Mac)
echo -e "${BLUE}[4/8]${NC} Исправляю конфликты портов (Mac AirPlay)..."

# Check if port 5000 is used by AirTunes
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    PORT_USER=$(lsof -Pi :5000 -sTCP:LISTEN | grep -v COMMAND | awk '{print $1}' | head -1)
    if [[ "$PORT_USER" == *"Control"* ]] || [[ "$PORT_USER" == *"AirTunes"* ]]; then
        echo -e "${YELLOW}⚠️  Порт 5000 занят AirPlay, меняю на 5001${NC}"

        # Fix simple-backend.py
        if grep -q "port=5000" simple-backend.py; then
            sed -i.bak 's/port=5000/port=5001/g' simple-backend.py
            echo "  ✓ simple-backend.py → порт 5001"
        fi

        # Fix index.html
        if grep -q "localhost:5000" index.html; then
            sed -i.bak 's/localhost:5000/localhost:5001/g' index.html
            echo "  ✓ index.html → порт 5001"
        fi

        # Fix messenger/index.html
        if grep -q "localhost:5000" messenger/index.html; then
            sed -i.bak 's/localhost:5000/localhost:5001/g' messenger/index.html
            echo "  ✓ messenger/index.html → порт 5001"
        fi

        BACKEND_PORT=5001
    else
        BACKEND_PORT=5000
    fi
else
    BACKEND_PORT=5000
fi
echo -e "${GREEN}✅ Backend будет на порту $BACKEND_PORT${NC}"
echo ""

# Step 5: Create .env if not exists
echo -e "${BLUE}[5/8]${NC} Настраиваю конфигурацию..."
if [ ! -f ".env" ]; then
    cp .env.example .env 2>/dev/null || cat > .env <<EOF
# Claude API Configuration
# Get your API key from: https://console.anthropic.com/
ANTHROPIC_API_KEY=your-anthropic-api-key-here

# AI Service Configuration
AI_MODEL=claude-3-5-sonnet-20241022
AI_MAX_TOKENS=1024
AI_TEMPERATURE=0.7

# Backend Configuration
BACKEND_PORT=$BACKEND_PORT

# Features
ENABLE_AI_MODERATION=true
ENABLE_AI_ASSISTANT=true
ENABLE_ANALYTICS=true
ENABLE_CSAM_PROTECTION=true
EOF
    echo -e "${GREEN}✅ Создан .env файл${NC}"
else
    echo -e "${GREEN}✅ .env уже существует${NC}"
fi
echo ""

# Step 6: Stop old processes
echo -e "${BLUE}[6/8]${NC} Останавливаю старые процессы..."
pkill -f "simple-backend.py" 2>/dev/null
pkill -f "http.server 4000" 2>/dev/null
pkill -f "uvicorn app.main" 2>/dev/null
sleep 1
echo -e "${GREEN}✅ Старые процессы остановлены${NC}"
echo ""

# Step 7: Start services
echo -e "${BLUE}[7/8]${NC} Запускаю сервисы..."

# Backend API
echo "Запускаю Backend API (порт $BACKEND_PORT)..."
python3 simple-backend.py > /tmp/achat-backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Check if backend started
if curl -s http://localhost:$BACKEND_PORT/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend API запущен (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Ошибка запуска Backend API${NC}"
    echo "Логи: tail /tmp/achat-backend.log"
fi

# Web Server
echo "Запускаю Web Server (порт 4000)..."
python3 -m http.server 4000 > /tmp/achat-web.log 2>&1 &
WEB_PID=$!
sleep 2

if curl -s http://localhost:4000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Web Server запущен (PID: $WEB_PID)${NC}"
else
    echo -e "${RED}❌ Ошибка запуска Web Server${NC}"
fi

# AI Service
echo "Запускаю AI Service (порт 8000)..."
cd apps/ai-service
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 > /tmp/achat-ai.log 2>&1 &
AI_PID=$!
cd "$SCRIPT_DIR"
sleep 3

if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo -e "${GREEN}✅ AI Service запущен (PID: $AI_PID)${NC}"
else
    echo -e "${YELLOW}⚠️  AI Service не запустился (не критично)${NC}"
fi

echo ""

# Step 8: Summary
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║                  🎉 ВСЁ ГОТОВО!                           ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}🌐 Главная страница:${NC}  http://localhost:4000"
echo -e "${GREEN}💬 Мессенджер:${NC}        http://localhost:4000/messenger/"
echo -e "${GREEN}🔧 Backend API:${NC}       http://localhost:$BACKEND_PORT"
echo -e "${GREEN}🤖 AI Service:${NC}        http://localhost:8000"
echo ""
echo -e "${YELLOW}📊 Новые функции:${NC}"
echo "  • 🛡️  AI модерация контента (включая CSAM)"
echo "  • 🚫 Автоматическая блокировка аккаунтов"
echo "  • 📈 Сбор аналитики чатов"
echo "  • 🔍 API для запроса данных"
echo ""
echo -e "${YELLOW}Для остановки всех сервисов:${NC}"
echo "  pkill -f 'simple-backend.py|http.server 4000|uvicorn'"
echo ""
echo -e "${GREEN}Хорошего общения! 💬✨${NC}"
