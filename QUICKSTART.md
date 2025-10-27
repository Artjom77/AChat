# 🚀 Быстрый запуск AChat

## Вариант 1: Docker (самый простой!)

### Шаг 1: Убедись что Docker установлен

```bash
docker --version
docker-compose --version
```

Если нет - установи: https://docs.docker.com/get-docker/

### Шаг 2: Создай .env файл

```bash
cd /home/user/AChat
cp .env.example .env
```

### Шаг 3: Запусти все сервисы

```bash
docker-compose up -d
```

### Шаг 4: Смотри логи

```bash
# Все логи
docker-compose logs -f

# Только backend
docker-compose logs -f backend

# Только AI service
docker-compose logs -f ai-service
```

### Шаг 5: Проверь что работает

Открой в браузере:
- **Backend API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api/docs
- **AI Service**: http://localhost:8000
- **AI Documentation**: http://localhost:8000/docs

---

## Вариант 2: Без Docker (для разработки)

### Шаг 1: Установи зависимости

```bash
cd /home/user/AChat

# Node.js зависимости
npm install
```

### Шаг 2: Запусти PostgreSQL и Redis

Нужны PostgreSQL и Redis. Можно запустить в Docker:

```bash
# PostgreSQL
docker run -d \
  --name achat-postgres \
  -e POSTGRES_USER=achat \
  -e POSTGRES_PASSWORD=achat \
  -e POSTGRES_DB=achat \
  -p 5432:5432 \
  postgres:15-alpine

# Redis
docker run -d \
  --name achat-redis \
  -p 6379:6379 \
  redis:7-alpine
```

### Шаг 3: Настрой .env

```bash
cp .env.example .env

# Отредактируй .env:
# DB_PASSWORD=achat
# JWT_SECRET=your-secret-key-min-32-characters-long
```

### Шаг 4: Запусти сервисы

Открой 2 терминала:

**Terminal 1 - Backend:**
```bash
cd /home/user/AChat
npm run backend
```

**Terminal 2 - AI Service:**
```bash
cd /home/user/AChat/apps/ai-service

# Установи Python зависимости
pip install -r requirements.txt

# Запусти
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## 🧪 Тестирование функций

### 1. Проверь Enclave Status

```bash
curl http://localhost:3000/enclave/status | jq
```

Должен вернуть:
```json
{
  "ready": true,
  "enclaveId": "enclave_...",
  "publicKey": "...",
  "uptime": 123
}
```

### 2. Регистрация пользователя

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "Test123!@#",
    "displayName": "Test User"
  }' | jq
```

Сохрани токен из ответа!

### 3. Залогинься

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }' | jq
```

### 4. Тест AI модерации

```bash
# Безопасное сообщение
curl -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello, how are you doing today?"
  }' | jq

# Подозрительное сообщение
curl -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Want to buy some cocaine and guns?"
  }' | jq
```

### 5. Тест AI Assistant

```bash
curl -X POST http://localhost:8000/assistant/suggest \
  -H "Content-Type: application/json" \
  -d '{
    "message": "How are you?",
    "userId": "test-user"
  }' | jq
```

### 6. Анализ сентимента

```bash
curl -X POST http://localhost:8000/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "text": "I am so happy and excited about this project!"
  }' | jq
```

---

## 🎮 Интерактивное тестирование

### Используй Swagger UI

1. Открой http://localhost:3000/api/docs (Backend API)
2. Открой http://localhost:8000/docs (AI Service)

Там можно нажимать кнопки "Try it out" и тестировать все endpoints визуально!

### Примеры запросов в Swagger:

1. **POST /auth/register** - создай пользователя
2. **POST /auth/login** - залогинься, скопируй token
3. **Нажми "Authorize"** вверху страницы, вставь `Bearer YOUR_TOKEN`
4. **GET /users/me** - получи свой профиль
5. **POST /messages/conversations/direct** - создай диалог
6. **POST /messages** - отправь сообщение (зашифрованное)

---

## 🔍 Смотри логи

```bash
# Docker
docker-compose logs -f backend
docker-compose logs -f ai-service

# Без Docker
# Логи в терминалах где запустил сервисы
```

---

## 🛑 Остановка

```bash
# Docker
docker-compose down

# Или полная очистка (удалит все данные!)
docker-compose down -v

# Без Docker
# Ctrl+C в терминалах
```

---

## 🐛 Проблемы?

### "Cannot connect to database"
```bash
# Проверь что PostgreSQL запущен
docker ps | grep postgres

# Проверь .env файл - правильный ли пароль
```

### "Redis connection failed"
```bash
# Проверь что Redis запущен
docker ps | grep redis

# Или запусти вручную
docker start achat-redis
```

### "Port already in use"
```bash
# Найди процесс на порту
lsof -i :3000

# Останови его
kill -9 <PID>
```

### "Module not found"
```bash
# Переустанови зависимости
rm -rf node_modules package-lock.json
npm install
```

---

## 📸 Что ты увидишь

### Backend запустился:
```
🚀 AChat Backend API is running!

📝 API Documentation: http://localhost:3000/api/docs
🔌 WebSocket: http://localhost:3000
🔐 Security: Enclave-protected AI processing

Environment: development
```

### AI Service запустился:
```
INFO:     Started server process
INFO:     Waiting for application startup.
🚀 Starting AChat AI Service...
🔐 Initializing Content Moderator...
✅ Content Moderator initialized (keyword-based mode)
✅ Conversation Assistant initialized
✅ AI Service initialized successfully
INFO:     Application startup complete.
```

---

## ✅ Готово!

Теперь можешь тестировать через:
- 🌐 Браузер: http://localhost:3000/api/docs
- 💻 curl команды (см. выше)
- 📱 Postman/Insomnia
- 🧪 Swagger UI

Удачи! 🚀
