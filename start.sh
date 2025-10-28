#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear

echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║                                                           ║"
echo "║     🔐 AChat - Полная автоматическая установка            ║"
echo "║                                                           ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Проверяем наличие .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}📝 Создаю .env файл...${NC}"
    cat > .env << 'ENVEOF'
# Anthropic API Configuration
ANTHROPIC_API_KEY=your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022

# Server Configuration
BACKEND_PORT=5000
WEB_PORT=4000
AI_SERVICE_PORT=8000

# Security Settings
ENABLE_AI_MODERATION=true
ENABLE_CSAM_PROTECTION=true
JWT_SECRET_KEY=super-secret-jwt-key-change-in-production

# CORS Settings
ALLOWED_ORIGINS=http://localhost:4000,http://127.0.0.1:4000
ENVEOF
    echo -e "${GREEN}✅ .env файл создан${NC}"
fi

# Проверяем наличие API ключа
source .env

if [ "$ANTHROPIC_API_KEY" = "your-anthropic-api-key-here" ] || [ -z "$ANTHROPIC_API_KEY" ]; then
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}⚠️  API ключ не настроен!${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}Для работы AI функций нужен Anthropic API ключ.${NC}"
    echo -e "${BLUE}Получить ключ можно здесь: https://console.anthropic.com/settings/keys${NC}"
    echo ""
    echo -e "${YELLOW}Формат ключа: sk-ant-api03-...${NC}"
    echo ""

    while true; do
        read -p "$(echo -e ${GREEN}Введи свой Anthropic API ключ ${YELLOW}[или Enter для пропуска]:${NC} )" api_key

        if [ -z "$api_key" ]; then
            echo -e "${YELLOW}⚠️  Пропускаю... AI функции работать НЕ БУДУТ!${NC}"
            echo -e "${YELLOW}   Ты можешь добавить ключ позже командой:${NC}"
            echo -e "${BLUE}   echo 'ANTHROPIC_API_KEY=твой-ключ' >> .env${NC}"
            sleep 2
            break
        fi

        # Проверяем формат ключа
        if [[ $api_key =~ ^sk-ant- ]]; then
            # Обновляем .env
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$api_key/" .env
            else
                # Linux
                sed -i "s/ANTHROPIC_API_KEY=.*/ANTHROPIC_API_KEY=$api_key/" .env
            fi
            echo -e "${GREEN}✅ API ключ сохранён!${NC}"
            export ANTHROPIC_API_KEY=$api_key
            sleep 1
            break
        else
            echo -e "${RED}❌ Неверный формат! Ключ должен начинаться с 'sk-ant-'${NC}"
            echo -e "${YELLOW}Попробуй ещё раз...${NC}"
        fi
    done
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🚀 Запускаю полную установку...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Делаем setup-mac.sh исполняемым если нужно
chmod +x setup-mac.sh

# Запускаем основной скрипт установки
./setup-mac.sh

# Проверяем успешность
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}║                  ✨ ГОТОВО К РАБОТЕ! ✨                   ║${NC}"
    echo -e "${GREEN}║                                                           ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}🌐 Открой в браузере:${NC}"
    echo -e "${GREEN}   👉 http://localhost:4000${NC}"
    echo ""
    echo -e "${YELLOW}📱 Для доступа с телефона:${NC}"
    echo -e "${BLUE}   1. Узнай свой IP: ifconfig | grep 'inet ' | grep -v 127.0.0.1${NC}"
    echo -e "${BLUE}   2. Открой на телефоне: http://ТВО_IP:4000${NC}"
    echo ""
    echo -e "${YELLOW}🛑 Чтобы остановить все сервисы:${NC}"
    echo -e "${RED}   pkill -f 'simple-backend.py|http.server 4000|uvicorn'${NC}"
    echo ""
    echo -e "${GREEN}💬 Приятного общения!${NC}"
    echo ""
else
    echo ""
    echo -e "${RED}❌ Произошла ошибка при установке!${NC}"
    echo -e "${YELLOW}Проверь логи выше для деталей.${NC}"
    exit 1
fi
