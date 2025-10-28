# 📱 Настройка SMS-верификации через Twilio

## Что такое Twilio?

Twilio - это платформа для отправки SMS, звонков и других коммуникаций. Мы используем её для отправки кодов подтверждения номера телефона.

---

## 💰 Стоимость

- **Регистрация:** БЕСПЛАТНО
- **Бонус для новых пользователей:** $15 кредитов
- **Стоимость SMS:** ~$0.0075 за SMS в США/Канаде, ~$0.05-0.10 в России
- **Аренда номера:** $1-2/месяц

**Итого:** На $15 можно отправить ~1500-2000 SMS!

---

## 🚀 Быстрая настройка (5 минут)

### Шаг 1: Создать аккаунт Twilio

1. Перейди: https://www.twilio.com/try-twilio
2. Заполни форму регистрации
3. Подтверди email
4. Подтверди свой номер телефона (получишь SMS с кодом)

### Шаг 2: Получить номер для SMS

1. В Dashboard нажми **Get a Twilio phone number**
2. Выбери номер (рекомендую US number для начала - дешевле)
3. Нажми **Choose this number**

### Шаг 3: Найти учётные данные

В Twilio Console найди:

- **Account SID** - идентификатор аккаунта (начинается с AC...)
- **Auth Token** - токен авторизации (кликни "Show" чтобы увидеть)
- **Phone Number** - твой Twilio номер (формат: +1234567890)

### Шаг 4: Настроить AChat

В файле `.env` добавь:

```bash
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

### Шаг 5: Установить библиотеку Twilio

```bash
cd ~/J2-Assistant/backend/AChat
source venv/bin/activate
pip install twilio
```

### Шаг 6: Запустить SMS-сервис

```bash
cd apps/sms-service
python twilio-sms.py
```

Сервис запустится на порту **5002**

---

## 🧪 Тестирование

### Тест 1: Проверить статус сервиса

```bash
curl http://localhost:5002/
```

Ответ должен показать `"twilio_configured": true`

### Тест 2: Отправить SMS

```bash
curl -X POST http://localhost:5002/sms/send-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+79991234567"}'
```

Должна прийти SMS на указанный номер!

### Тест 3: Проверить код

```bash
curl -X POST http://localhost:5002/sms/verify-code \
  -H "Content-Type: application/json" \
  -d '{"phone": "+79991234567", "code": "123456"}'
```

---

## 🔧 Интеграция с Backend

Обнови `simple-backend.py`, добавь проверку телефона при регистрации:

```python
@app.post("/auth/register")
async def register(req: RegisterRequest):
    # ... existing code ...

    # Check if phone is verified
    if req.phone:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"http://localhost:5002/sms/is-verified/{req.phone}"
            )
            data = response.json()

            if not data['verified']:
                raise HTTPException(
                    status_code=400,
                    detail="Phone number not verified. Please verify first."
                )

    # ... continue registration ...
```

---

## 🌍 Отправка SMS в Россию

### Проблема: Ограничения на SMS в Россию

Twilio может иметь ограничения на отправку SMS в некоторые страны из-за санкций и регуляций.

### Решение 1: Использовать SMS.ru (российский аналог)

```bash
pip install requests
```

Файл `apps/sms-service/smsru-service.py`:

```python
import requests

SMS_RU_API_KEY = "your-api-key"

def send_sms_via_smsru(phone, message):
    response = requests.post('https://sms.ru/sms/send', {
        'api_id': SMS_RU_API_KEY,
        'to': phone,
        'msg': message,
        'json': 1
    })

    data = response.json()
    return data['status'] == 'OK'
```

Регистрация: https://sms.ru/

### Решение 2: Использовать email-верификацию

Если SMS не работает - можно отправлять коды на email (бесплатно через SMTP).

---

## 💡 TEST MODE (без Twilio)

Если у тебя ещё нет Twilio аккаунта, SMS-сервис работает в **TEST MODE**:

- Код **печатается в консоль** вместо отправки SMS
- Можно тестировать локально бесплатно
- Просто запусти сервис БЕЗ переменных окружения

Код появится в консоли:

```
============================================================
📱 TEST MODE - Verification Code
============================================================
Phone: +79991234567
Code:  584729
============================================================
```

---

## 📊 Мониторинг

### Twilio Dashboard

- **Logs:** https://console.twilio.com/us1/monitor/logs/sms
- **Usage:** https://console.twilio.com/us1/billing/usage
- **Balance:** Проверяй баланс, чтобы не закончились деньги!

### AChat Metrics

Добавь в `simple-backend.py`:

```python
sms_stats = {
    'sent': 0,
    'verified': 0,
    'failed': 0
}

@app.get("/stats/sms")
async def get_sms_stats():
    return sms_stats
```

---

## 🚨 Troubleshooting

### Ошибка: "Twilio not configured"

**Решение:** Проверь `.env` файл, убедись что переменные экспортированы:

```bash
source .env
echo $TWILIO_ACCOUNT_SID  # Должно показать твой SID
```

### Ошибка: "Phone number not valid"

**Решение:** Используй международный формат: `+79991234567`

### SMS не приходят

**Проверь:**
1. Баланс Twilio > $0
2. Номер телефона правильный
3. Номер Twilio не заблокирован
4. Проверь Twilio logs

### Ошибка 403: Forbidden

**Причина:** Не хватает прав или истёк токен

**Решение:** Перегенерируй Auth Token в Twilio Console

---

## 💰 Экономия денег

### Совет 1: Кэшируй проверенные номера

```python
# Сохраняй в БД, не проверяй повторно
verified_phones_db = {}
```

### Совет 2: Rate Limiting

Не позволяй отправлять больше 3 SMS в час на один номер.

### Совет 3: Используй Email для повторных кодов

Первый раз - SMS, потом можно на email (бесплатно).

---

## 🎯 Next Steps

1. ✅ Создать Twilio аккаунт
2. ✅ Настроить .env
3. ✅ Запустить SMS-сервис
4. ✅ Протестировать
5. ⏳ Интегрировать в регистрацию
6. ⏳ Добавить в start.sh

---

**Готово!** Теперь у тебя работает SMS-верификация! 🎉

Если есть вопросы - читай Twilio Docs: https://www.twilio.com/docs
