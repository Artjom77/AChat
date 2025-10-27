#!/bin/bash

# Цвета для красоты
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}║           ${PURPLE}🔐 AChat - AI Мессенджер Демо 🤖${CYAN}            ║${NC}"
echo -e "${CYAN}║                                                            ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Проверка что сервис работает
echo -e "${YELLOW}⏳ Проверяю AI Service...${NC}"
if curl -s http://localhost:8000/ > /dev/null; then
    echo -e "${GREEN}✅ AI Service работает!${NC}"
    echo ""
else
    echo -e "${RED}❌ AI Service не работает!${NC}"
    echo -e "${YELLOW}Запусти его командой:${NC}"
    echo -e "${CYAN}cd /home/user/AChat/apps/ai-service${NC}"
    echo -e "${CYAN}python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000${NC}"
    exit 1
fi

function print_menu() {
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}Выбери функцию:${NC}"
    echo ""
    echo -e "${GREEN}1${NC} - 🛡️  Проверить модерацию сообщения"
    echo -e "${GREEN}2${NC} - 🤖 Получить AI подсказки для ответа"
    echo -e "${GREEN}3${NC} - 😊 Анализ эмоций в тексте"
    echo -e "${GREEN}4${NC} - 🔄 Автоответчик"
    echo -e "${GREEN}5${NC} - 📊 Запустить все тесты"
    echo -e "${GREEN}6${NC} - 📚 Показать документацию API"
    echo -e "${RED}0${NC} - ❌ Выход"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

function test_moderation() {
    clear
    echo -e "${PURPLE}🛡️  МОДЕРАЦИЯ КОНТЕНТА${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Введи сообщение для проверки (или нажми Enter для примера):${NC}"
    read -r message

    if [ -z "$message" ]; then
        message="Want to buy some cocaine and guns?"
        echo -e "${CYAN}Используем пример: ${message}${NC}"
    fi

    echo ""
    echo -e "${YELLOW}⏳ Проверяю сообщение...${NC}"
    echo ""

    result=$(curl -s -X POST http://localhost:8000/moderation/analyze \
        -H "Content-Type: application/json" \
        -d "{\"content\": \"$message\"}")

    allowed=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin)['allowed'])")
    risk=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin)['riskScore'])")
    flags=$(echo "$result" | python3 -c "import sys, json; print(', '.join(json.load(sys.stdin)['flags']))" 2>/dev/null || echo "нет")
    review=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin)['requiresHumanReview'])")

    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                   РЕЗУЛЬТАТ МОДЕРАЦИИ                      ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    if [ "$allowed" = "True" ] || [ "$allowed" = "true" ]; then
        echo -e "${GREEN}✅ Статус: РАЗРЕШЕНО${NC}"
    else
        echo -e "${RED}❌ Статус: ЗАБЛОКИРОВАНО${NC}"
    fi

    echo -e "${YELLOW}📊 Оценка риска: ${risk}${NC}"
    echo -e "${YELLOW}🚩 Флаги: ${flags}${NC}"

    if [ "$review" = "True" ] || [ "$review" = "true" ]; then
        echo -e "${YELLOW}👤 Требует проверки модератором${NC}"
    fi

    echo ""
    echo -e "${BLUE}Полный ответ:${NC}"
    echo "$result" | python3 -m json.tool

    echo ""
    echo -e "${CYAN}Нажми Enter для продолжения...${NC}"
    read
}

function test_assistant() {
    clear
    echo -e "${PURPLE}🤖 AI ПОМОЩНИК${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Введи сообщение, на которое нужен ответ (или Enter для примера):${NC}"
    read -r message

    if [ -z "$message" ]; then
        message="I'm not sure what to say..."
        echo -e "${CYAN}Используем пример: ${message}${NC}"
    fi

    echo ""
    echo -e "${YELLOW}⏳ AI думает над подсказками...${NC}"
    echo ""

    result=$(curl -s -X POST http://localhost:8000/assistant/suggest \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$message\", \"userId\": \"demo-user\"}")

    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                   AI ПОДСКАЗКИ                             ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    sentiment=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin)['sentiment'])")
    mood=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin)['mood'])")

    echo -e "${YELLOW}😊 Настроение: ${sentiment}${NC}"
    echo -e "${YELLOW}🎭 Эмоция: ${mood}${NC}"
    echo ""
    echo -e "${GREEN}💡 Варианты ответов:${NC}"
    echo ""

    echo "$result" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for i, sug in enumerate(data['suggestions'], 1):
    print(f\"${CYAN}Вариант {i}:${NC} {sug['text']}\")
    print(f\"  ${YELLOW}Тон: {sug['tone']}, Уверенность: {sug['confidence']}${NC}\")
    print()
"

    echo ""
    echo -e "${CYAN}Нажми Enter для продолжения...${NC}"
    read
}

function test_sentiment() {
    clear
    echo -e "${PURPLE}😊 АНАЛИЗ ЭМОЦИЙ${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Введи текст для анализа (или Enter для примера):${NC}"
    read -r message

    if [ -z "$message" ]; then
        message="I am so excited and happy about this project!"
        echo -e "${CYAN}Используем пример: ${message}${NC}"
    fi

    echo ""
    echo -e "${YELLOW}⏳ Анализирую эмоции...${NC}"
    echo ""

    result=$(curl -s -X POST http://localhost:8000/sentiment/analyze \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"$message\"}")

    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                   АНАЛИЗ ЭМОЦИЙ                            ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    sentiment=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin)['sentiment'])")
    score=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin)['score'])")

    case "$sentiment" in
        "positive")
            echo -e "${GREEN}😊 Настроение: ПОЗИТИВНОЕ${NC}"
            ;;
        "negative")
            echo -e "${RED}😢 Настроение: НЕГАТИВНОЕ${NC}"
            ;;
        *)
            echo -e "${YELLOW}😐 Настроение: НЕЙТРАЛЬНОЕ${NC}"
            ;;
    esac

    echo -e "${YELLOW}📊 Оценка: ${score}${NC}"
    echo ""
    echo -e "${GREEN}🎭 Детали эмоций:${NC}"

    echo "$result" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for emotion, value in data['emotions'].items():
    bar_length = int(value * 20)
    bar = '█' * bar_length + '░' * (20 - bar_length)
    print(f\"  {emotion:10s}: {bar} {value:.1f}\")
"

    echo ""
    echo -e "${CYAN}Нажми Enter для продолжения...${NC}"
    read
}

function test_auto_responder() {
    clear
    echo -e "${PURPLE}🔄 АВТООТВЕТЧИК${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}Введи входящее сообщение (или Enter для примера):${NC}"
    read -r message

    if [ -z "$message" ]; then
        message="When can we meet?"
        echo -e "${CYAN}Используем пример: ${message}${NC}"
    fi

    echo ""
    echo -e "${YELLOW}⏳ Генерирую автоответ...${NC}"
    echo ""

    result=$(curl -s -X POST http://localhost:8000/assistant/auto-responder \
        -H "Content-Type: application/json" \
        -d "{\"message\": \"$message\", \"rules\": {}, \"style\": \"friendly\"}")

    response=$(echo "$result" | python3 -c "import sys, json; print(json.load(sys.stdin)['response'])")

    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║                   АВТООТВЕТ                                ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GREEN}📨 Автоматический ответ:${NC}"
    echo -e "${YELLOW}\"${response}\"${NC}"
    echo ""

    echo -e "${CYAN}Нажми Enter для продолжения...${NC}"
    read
}

function run_all_tests() {
    clear
    echo -e "${PURPLE}📊 ЗАПУСК ВСЕХ ТЕСТОВ${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""

    bash /home/user/AChat/test-ai.sh

    echo ""
    echo -e "${CYAN}Нажми Enter для продолжения...${NC}"
    read
}

function show_docs() {
    clear
    echo -e "${PURPLE}📚 ДОКУМЕНТАЦИЯ API${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}Доступные endpoints:${NC}"
    echo ""

    curl -s http://localhost:8000/openapi.json | python3 -c "
import sys, json
data = json.load(sys.stdin)
for path, methods in data['paths'].items():
    for method, info in methods.items():
        print(f\"${CYAN}{method.upper():6s}${NC} {path:40s} - {info.get('summary', 'No description')}\")
" 2>/dev/null || echo "Не удалось загрузить документацию"

    echo ""
    echo -e "${YELLOW}Для полной интерактивной документации открой в браузере:${NC}"
    echo -e "${CYAN}http://localhost:8000/docs${NC}"
    echo ""
    echo -e "${YELLOW}(Работает только если запущено на твоём компьютере)${NC}"
    echo ""

    echo -e "${CYAN}Нажми Enter для продолжения...${NC}"
    read
}

# Главный цикл
while true; do
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║           ${PURPLE}🔐 AChat - AI Мессенджер Демо 🤖${CYAN}            ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""

    print_menu

    echo -n "Твой выбор: "
    read -r choice

    case $choice in
        1) test_moderation ;;
        2) test_assistant ;;
        3) test_sentiment ;;
        4) test_auto_responder ;;
        5) run_all_tests ;;
        6) show_docs ;;
        0)
            clear
            echo -e "${GREEN}Спасибо за использование AChat! 🚀${NC}"
            echo ""
            exit 0
            ;;
        *)
            echo -e "${RED}Неверный выбор! Попробуй снова.${NC}"
            sleep 1
            ;;
    esac
done
