#!/bin/bash

# Цвета
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}║       ${PURPLE}🔐 AChat - Примеры использования AI 🤖${CYAN}              ║${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# ПРИМЕР 1: Модерация безопасного сообщения
# ============================================
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}ПРИМЕР 1: Проверка БЕЗОПАСНОГО сообщения${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Сообщение:${NC} ${YELLOW}\"Привет! Как дела? Хорошая погода!\"${NC}"
echo ""

curl -s -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello! How are you? Great weather today!"}' | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('\033[0;32m✅ Разрешено:\033[0m', data['allowed'])
print('\033[1;33m📊 Риск:\033[0m', data['riskScore'])
print('\033[1;33m🚩 Флаги:\033[0m', ', '.join(data['flags']) if data['flags'] else 'нет')
"

echo ""
echo -e "${CYAN}Нажми Enter для следующего примера...${NC}"
read

# ============================================
# ПРИМЕР 2: Модерация опасного сообщения
# ============================================
clear
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${RED}ПРИМЕР 2: Проверка ОПАСНОГО сообщения${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Сообщение:${NC} ${RED}\"Selling cocaine, guns, and bombs\"${NC}"
echo ""

curl -s -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Selling cocaine, guns, and bombs. Money laundering."}' | python3 -c "
import sys, json
data = json.load(sys.stdin)
if data['allowed']:
    print('\033[0;32m✅ Разрешено\033[0m')
else:
    print('\033[0;31m❌ ЗАБЛОКИРОВАНО\033[0m')
print('\033[1;33m📊 Риск:\033[0m', data['riskScore'])
print('\033[0;31m🚩 Флаги:\033[0m', ', '.join(data['flags']))
print('\033[1;33m💬 Причина:\033[0m', data.get('reason', 'нет'))
"

echo ""
echo -e "${CYAN}Нажми Enter для следующего примера...${NC}"
read

# ============================================
# ПРИМЕР 3: AI подсказки для ответа
# ============================================
clear
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ПРИМЕР 3: AI помощник - подсказки для ответа${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Входящее сообщение:${NC} ${YELLOW}\"How are you doing?\"${NC}"
echo ""
echo -e "${CYAN}⏳ AI генерирует подсказки...${NC}"
echo ""

curl -s -X POST http://localhost:8000/assistant/suggest \
  -H "Content-Type: application/json" \
  -d '{"message": "How are you doing?", "userId": "demo"}' | python3 -c "
import sys, json
data = json.load(sys.stdin)

print('\033[1;33m😊 Настроение:\033[0m', data['sentiment'])
print('\033[1;33m🎭 Эмоция:\033[0m', data['mood'])
print()
print('\033[0;32m💡 Варианты ответов:\033[0m')
print()

for i, sug in enumerate(data['suggestions'], 1):
    print(f\"\033[0;36m{i}.\033[0m {sug['text']}\")
    print(f\"   \033[1;33mТон: {sug['tone']}, Уверенность: {sug['confidence']}\033[0m\")
    print()
"

echo -e "${CYAN}Нажми Enter для следующего примера...${NC}"
read

# ============================================
# ПРИМЕР 4: Анализ позитивных эмоций
# ============================================
clear
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}ПРИМЕР 4: Анализ ПОЗИТИВНЫХ эмоций${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Текст:${NC} ${GREEN}\"I am so happy and excited about this!\"${NC}"
echo ""

curl -s -X POST http://localhost:8000/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I am so happy and excited about this amazing project!"}' | python3 -c "
import sys, json
data = json.load(sys.stdin)

print('\033[0;32m😊 Настроение:\033[0m', data['sentiment'].upper())
print('\033[1;33m📊 Оценка:\033[0m', data['score'])
print()
print('\033[0;36m🎭 Эмоции:\033[0m')
for emotion, value in data['emotions'].items():
    bar_length = int(value * 20)
    bar = '█' * bar_length + '░' * (20 - bar_length)
    print(f\"  {emotion:10s}: {bar} {value:.1f}\")
"

echo ""
echo -e "${CYAN}Нажми Enter для следующего примера...${NC}"
read

# ============================================
# ПРИМЕР 5: Анализ негативных эмоций
# ============================================
clear
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${RED}ПРИМЕР 5: Анализ НЕГАТИВНЫХ эмоций${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Текст:${NC} ${RED}\"I am so sad and frustrated. This is terrible.\"${NC}"
echo ""

curl -s -X POST http://localhost:8000/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I am so sad and frustrated. This is terrible."}' | python3 -c "
import sys, json
data = json.load(sys.stdin)

print('\033[0;31m😢 Настроение:\033[0m', data['sentiment'].upper())
print('\033[1;33m📊 Оценка:\033[0m', data['score'])
print()
print('\033[0;36m🎭 Эмоции:\033[0m')
for emotion, value in data['emotions'].items():
    bar_length = int(value * 20)
    bar = '█' * bar_length + '░' * (20 - bar_length)
    print(f\"  {emotion:10s}: {bar} {value:.1f}\")
"

echo ""
echo -e "${CYAN}Нажми Enter для следующего примера...${NC}"
read

# ============================================
# ПРИМЕР 6: Автоответчик
# ============================================
clear
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}ПРИМЕР 6: Автоответчик${NC}"
echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}Входящее:${NC} ${YELLOW}\"When can we meet?\"${NC}"
echo ""
echo -e "${CYAN}⏳ Генерирую автоматический ответ...${NC}"
echo ""

curl -s -X POST http://localhost:8000/assistant/auto-responder \
  -H "Content-Type: application/json" \
  -d '{"message": "When can we meet?", "rules": {}, "style": "friendly"}' | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('\033[0;32m📨 Автоответ:\033[0m')
print('\033[1;33m\"' + data['response'] + '\"\033[0m')
"

echo ""
echo ""

# ============================================
# ЗАВЕРШЕНИЕ
# ============================================
echo -e "${CYAN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}║                 ${GREEN}✅ ВСЕ ПРИМЕРЫ ЗАВЕРШЕНЫ!${CYAN}                    ║${NC}"
echo -e "${CYAN}║                                                               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Теперь ты можешь:${NC}"
echo ""
echo -e "${GREEN}1.${NC} Использовать эти команды для своих текстов"
echo -e "${GREEN}2.${NC} Изменить текст в команде curl -d '{\"content\": \"ТУТ ТВОЙ ТЕКСТ\"}'"
echo -e "${GREEN}3.${NC} Изучить все функции в файле: ${CYAN}test-ai.sh${NC}"
echo -e "${GREEN}4.${NC} Посмотреть полную документацию: ${CYAN}TESTING_RESULTS.md${NC}"
echo ""
echo -e "${PURPLE}🎉 AChat работает и готов к использованию!${NC}"
echo ""
