# 🚀 Инструкция по установке AChat (Mac)

## ✨ ЧТО ДОБАВЛЕНО:

### 🛡️ **Критические функции безопасности:**
- ✅ **Автоматическая блокировка за CSAM** (детская порнография)
- ✅ **AI модерация каждого сообщения** через Claude
- ✅ **Сбор аналитики чатов** для статистики
- ✅ **API для получения данных** и логов модерации

### 🤖 **Автоматический скрипт установки:**
- ✅ Создаёт venv
- ✅ Устанавливает все зависимости
- ✅ Исправляет конфликт портов (AirPlay занимает 5000)
- ✅ Запускает все сервисы автоматически

---

## 📥 ШАГ 1: Скачай последнюю версию

```bash
cd ~/J2-Assistant/backend/AChat
git pull origin claude/secure-ai-messenger-concept-011CUYBTaTrpTKcysdGjpa8K
```

---

## 🔑 ШАГ 2: Добавь свой API ключ

После запуска скрипта, **ОБЯЗАТЕЛЬНО** отредактируй `.env`:

```bash
nano .env
```

Замени:
```env
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

На свой ключ от Anthropic:
```env
ANTHROPIC_API_KEY=sk-ant-api03-...твой-ключ...
```

**Важно:** Используй ключ который я тебе дал в начале!

Сохрани: `Ctrl+O`, `Enter`, `Ctrl+X`

---

## 🚀 ШАГ 3: Запусти автоматический скрипт

```bash
cd ~/J2-Assistant/backend/AChat
chmod +x setup-mac.sh
./setup-mac.sh
```

Скрипт:
1. ✅ Проверит Python
2. ✅ Создаст venv
3. ✅ Установит все библиотеки (fastapi, uvicorn, anthropic, httpx и др.)
4. ✅ Исправит порт 5000 → 5001 (если занят AirPlay)
5. ✅ Создаст .env файл
6. ✅ Запустит Backend API (порт 5001)
7. ✅ Запустит Web Server (порт 4000)
8. ✅ Запустит AI Service (порт 8000)

---

## 🌐 ШАГ 4: Открой в браузере

```
http://localhost:4000
```

Увидишь красивую главную страницу! 🎨

---

## 🧪 ШАГ 5: Протестируй

### Регистрация:

1. Прокрути до формы
2. Нажми **"Регистрация"**
3. Заполни данные
4. Нажми **"Зарегистрироваться"**
5. Автоматически откроется мессенджер!

### Отправка сообщений:

1. Открой второе окно браузера
2. Зарегистрируй второго пользователя
3. В первом окне: вкладка **"Пользователи"** → выбери второго пользователя
4. Начни переписку! 💬

---

## 🛡️ ТЕСТ БЕЗОПАСНОСТИ (Опционально):

### Тест AI модерации:

```bash
# Безопасное сообщение (должно пройти)
curl -X POST http://localhost:5001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","displayName":"Test","password":"pass123"}'

# Получи токен и попробуй отправить сообщение с флагами
# Система должна заблокировать
```

**ВНИМАНИЕ:** Не тестируй с реальным CSAM контентом! Система заблокирует аккаунт навсегда!

---

## 📊 НОВЫЕ API ENDPOINTS:

### Получить статистику (Premium):
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5001/analytics/stats
```

### Получить логи модерации (Business):
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:5001/analytics/moderation
```

### Список заблокированных (Business):
```bash
curl -H "Authorization: Bearer ADMIN_TOKEN" \
  http://localhost:5001/analytics/blocked-users
```

Подробнее в **SECURITY_AND_ANALYTICS.md**!

---

## 🐛 TROUBLESHOOTING:

### Проблема: "Load failed" при регистрации

**Решение:**
```bash
# Проверь что backend работает
curl http://localhost:5001/

# Должен вернуть JSON
```

### Проблема: Порт занят

**Решение:**
```bash
# Останови старые процессы
pkill -f "simple-backend"
pkill -f "http.server"
pkill -f "uvicorn"

# Перезапусти
./setup-mac.sh
```

### Проблема: AI не работает

**Решение:**
```bash
# Проверь .env
cat .env | grep ANTHROPIC_API_KEY

# Убедись что там твой ключ, а не placeholder!
nano .env
```

### Проблема: Нет библиотек

**Решение:**
```bash
source venv/bin/activate
pip install fastapi uvicorn python-dotenv anthropic httpx websockets pydantic
```

---

## 📖 ДОКУМЕНТАЦИЯ:

- **AI_FEATURES.md** - Всё про AI функции (модерация, ассистент)
- **SECURITY_AND_ANALYTICS.md** - Система безопасности и аналитики
- **PWA_INSTALL.md** - Установка как приложение на телефон
- **START_MESSENGER.md** - Быстрый старт мессенджера

---

## ✅ CHECKLIST:

- [ ] Скачал последнюю версию (`git pull`)
- [ ] Запустил `./setup-mac.sh`
- [ ] Отредактировал `.env` и добавил API ключ
- [ ] Перезапустил сервисы
- [ ] Открыл http://localhost:4000
- [ ] Зарегистрировался
- [ ] Начал переписку
- [ ] Протестировал AI модерацию

---

## 🎉 ГОТОВО!

Теперь у тебя:
- ✅ Полностью рабочий мессенджер
- ✅ Claude AI интегрирован
- ✅ Автоматическая защита от CSAM
- ✅ Аналитика чатов
- ✅ API для получения данных
- ✅ PWA приложение
- ✅ Один скрипт для запуска всего!

---

## 🚀 БЫСТРЫЙ СТАРТ (TL;DR):

```bash
cd ~/J2-Assistant/backend/AChat
git pull origin claude/secure-ai-messenger-concept-011CUYBTaTrpTKcysdGjpa8K
chmod +x setup-mac.sh
./setup-mac.sh
nano .env  # Добавь API ключ!
pkill -f "simple-backend|http.server|uvicorn"
./setup-mac.sh
```

Открой: **http://localhost:4000**

**Хорошего общения! 💬✨**
