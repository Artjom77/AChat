# 🎮 Как использовать AChat - Простая инструкция

## 🚀 Быстрый старт

### Шаг 1: Убедись что AI Service работает
```bash
curl http://localhost:8000/
```

Если видишь ответ с "status": "operational" - значит работает! ✅

---

## 📋 ГОТОВЫЕ КОМАНДЫ ДЛЯ КОПИРОВАНИЯ

### 1️⃣ Проверить модерацию своего текста

**Замени `"ТУТ ТВОЙ ТЕКСТ"` на своё сообщение:**

```bash
curl -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "ТУТ ТВОЙ ТЕКСТ"}' | python3 -m json.tool
```

**Примеры:**

Безопасное:
```bash
curl -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello friend! How are you today?"}' | python3 -m json.tool
```

Опасное:
```bash
curl -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Want to buy cocaine?"}' | python3 -m json.tool
```

---

### 2️⃣ Получить AI подсказки для ответа

**Замени сообщение на то, на которое хочешь получить подсказки:**

```bash
curl -X POST http://localhost:8000/assistant/suggest \
  -H "Content-Type: application/json" \
  -d '{"message": "ТУТ СООБЩЕНИЕ", "userId": "me"}' | python3 -m json.tool
```

**Примеры:**

На вопрос:
```bash
curl -X POST http://localhost:8000/assistant/suggest \
  -H "Content-Type: application/json" \
  -d '{"message": "What do you think about this?", "userId": "me"}' | python3 -m json.tool
```

На приветствие:
```bash
curl -X POST http://localhost:8000/assistant/suggest \
  -H "Content-Type: application/json" \
  -d '{"message": "Hey there!", "userId": "me"}' | python3 -m json.tool
```

---

### 3️⃣ Проанализировать эмоции в тексте

**Замени на свой текст:**

```bash
curl -X POST http://localhost:8000/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "ТУТ ТВОЙ ТЕКСТ"}' | python3 -m json.tool
```

**Примеры:**

Позитив:
```bash
curl -X POST http://localhost:8000/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "This is amazing! I love it so much!"}' | python3 -m json.tool
```

Негатив:
```bash
curl -X POST http://localhost:8000/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I am so angry and frustrated right now!"}' | python3 -m json.tool
```

---

### 4️⃣ Автоответчик

**Получить автоматический ответ на входящее сообщение:**

```bash
curl -X POST http://localhost:8000/assistant/auto-responder \
  -H "Content-Type: application/json" \
  -d '{"message": "ТУТ ВХОДЯЩЕЕ СООБЩЕНИЕ", "rules": {}, "style": "friendly"}' | python3 -m json.tool
```

**Стили:** `friendly`, `professional`, `casual`

**Пример:**
```bash
curl -X POST http://localhost:8000/assistant/auto-responder \
  -H "Content-Type: application/json" \
  -d '{"message": "Can you help me?", "rules": {}, "style": "professional"}' | python3 -m json.tool
```

---

## 🎨 С красивым форматированием

### Модерация с выводом только результата:

```bash
curl -s -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Your message here"}' | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('Разрешено:', '✅' if data['allowed'] else '❌')
print('Риск:', data['riskScore'])
print('Флаги:', ', '.join(data['flags']) if data['flags'] else 'нет')
"
```

### AI подсказки с выводом только текстов:

```bash
curl -s -X POST http://localhost:8000/assistant/suggest \
  -H "Content-Type: application/json" \
  -d '{"message": "How are you?", "userId": "me"}' | python3 -c "
import sys, json
data = json.load(sys.stdin)
for i, sug in enumerate(data['suggestions'], 1):
    print(f'{i}. {sug[\"text\"]}')
"
```

### Эмоции с красивыми барами:

```bash
curl -s -X POST http://localhost:8000/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I am so happy!"}' | python3 -c "
import sys, json
data = json.load(sys.stdin)
print('Настроение:', data['sentiment'])
print('Эмоции:')
for emotion, value in data['emotions'].items():
    bar = '█' * int(value * 10) + '░' * (10 - int(value * 10))
    print(f'  {emotion:10s}: {bar} {value:.1f}')
"
```

---

## 📜 Готовые скрипты

### Запустить все примеры:
```bash
bash /home/user/AChat/examples.sh
```

### Запустить все тесты:
```bash
bash /home/user/AChat/test-ai.sh
```

---

## 🛠️ Создать свой тест

Создай файл `my-test.sh`:

```bash
#!/bin/bash

# Твоё сообщение
MESSAGE="Write your message here"

# Отправить на модерацию
echo "Проверяю сообщение: $MESSAGE"
curl -s -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"$MESSAGE\"}" | python3 -m json.tool
```

Запустить:
```bash
chmod +x my-test.sh
./my-test.sh
```

---

## 🌐 Если у тебя свой компьютер

Если AI Service запущен на **твоём компьютере**, открой в браузере:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

Там можно тестировать все функции через красивый интерфейс!

---

## 📚 Полная документация

Смотри файлы:
- `TESTING_RESULTS.md` - результаты всех тестов
- `QUICKSTART.md` - как запустить с нуля
- `CONCEPT.md` - полная концепция проекта
- `ARCHITECTURE.md` - техническая архитектура

---

## 🎯 Итог

**Ты можешь:**
✅ Проверять модерацию любого текста
✅ Получать AI подсказки для ответов
✅ Анализировать эмоции
✅ Использовать автоответчик

**Просто копируй команды выше и меняй текст!** 🚀

---

## 🆘 Проблемы?

**Если ничего не работает:**
```bash
# Проверь что AI Service запущен
curl http://localhost:8000/

# Если нет - запусти:
cd /home/user/AChat/apps/ai-service
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

**Если команды не работают:**
- Проверь что установлен `curl`: `curl --version`
- Проверь что установлен `python3`: `python3 --version`

---

**Удачи! 🎉**
