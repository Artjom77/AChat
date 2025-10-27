# AChat - Самый Защищённый AI-Мессенджер

<div align="center">

**🔐 Непроницаемая безопасность • 🤖 Продвинутый AI • 💬 Лучшее общение**

[Концепция](./CONCEPT.md) • [Документация](#) • [API](#) • [Безопасность](#)

</div>

---

## 🎯 Что такое AChat?

**AChat** - революционный мессенджер, который сочетает:
- 🛡️ **Максимальную защиту**: End-to-end шифрование + защищённые анклавы (TEE)
- 🤖 **AI нового уровня**: Умная модерация + личный AI-помощник для общения
- 💡 **Инновации**: AI анализирует диалоги, помогает в звонках, автоматически отвечает

## 🏗️ Архитектура

```
AChat (Monorepo)
├── apps/
│   ├── backend/           # Node.js + NestJS API
│   ├── frontend-web/      # React + TypeScript веб-приложение
│   ├── frontend-mobile/   # React Native iOS/Android
│   └── ai-service/        # Python AI/ML сервисы
├── packages/
│   ├── shared/            # Общие утилиты
│   ├── crypto/            # Криптография и шифрование
│   └── types/             # TypeScript типы
└── docs/                  # Документация
```

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- Python 3.11+
- PostgreSQL 15+
- Redis 7+
- Docker (опционально)

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/yourusername/AChat.git
cd AChat

# Установить зависимости
npm install

# Скопировать конфигурацию
cp .env.example .env

# Запустить в режиме разработки
npm run dev
```

### Запуск отдельных сервисов

```bash
# Backend API
npm run backend

# Frontend Web
npm run frontend-web

# Frontend Mobile
npm run frontend-mobile

# AI Service
npm run ai-service
```

## 🔐 Безопасность

### Уровни шифрования

1. **Client-to-Enclave**: Сообщения шифруются на устройстве
2. **Enclave Processing**: AI работает в защищённом анклаве (AWS Nitro/Intel SGX)
3. **End-to-End**: Получатель расшифровывает на своём устройстве

### Технологии

- **Signal Protocol**: Для E2E шифрования
- **AES-256-GCM**: Симметричное шифрование
- **Ed25519**: Цифровые подписи
- **AWS Nitro Enclaves**: Защищённая среда выполнения
- **HSM**: Хранение мастер-ключей

Подробнее: [CONCEPT.md](./CONCEPT.md)

## 🤖 AI Возможности

### Модерация (Бесплатно)
- Автоматическое обнаружение незаконного контента
- Защита от спама и мошенничества
- Работает в реальном времени в защищённом анклаве

### AI Помощник (Premium $20/мес)
- **Умные подсказки**: AI предлагает что написать
- **Анализ диалогов**: Понимание контекста и настроения
- **Автоответчик**: AI отвечает за вас по заданным правилам
- **Анализ звонков**: Определение настроения собеседника в реальном времени
- **Психологический анализ**: Рекомендации по улучшению коммуникации

## 💰 Монетизация

| Функция | Бесплатно | Premium ($20) | Business ($50) |
|---------|-----------|---------------|----------------|
| Сообщения | ✅ Безлимит | ✅ Безлимит | ✅ Безлимит |
| E2E шифрование | ✅ | ✅ | ✅ |
| AI модерация | ✅ | ✅ | ✅ |
| AI помощник | ❌ | ✅ | ✅ |
| Видео звонки | ❌ | ✅ HD | ✅ 4K |
| Облако | 5 GB | 100 GB | 1 TB |
| Группы | 100 | 10,000 | Безлимит |

## 📦 Пакеты

### `@achat/shared`
Общие утилиты, валидация, константы

### `@achat/crypto`
Криптографические функции, шифрование, ключи

### `@achat/types`
TypeScript типы для всего проекта

## 🛠️ Технологии

**Backend**:
- Node.js + TypeScript
- NestJS (framework)
- PostgreSQL (база данных)
- Redis (кэш)
- WebSocket (real-time)
- AWS Nitro Enclaves

**Frontend Web**:
- React + TypeScript
- Next.js
- Redux Toolkit
- Socket.io
- TailwindCSS

**Frontend Mobile**:
- React Native
- TypeScript
- Redux Toolkit
- Socket.io

**AI/ML**:
- Python 3.11+
- FastAPI
- PyTorch
- Transformers (HuggingFace)
- OpenAI API

## 🧪 Тестирование

```bash
# Все тесты
npm test

# Тесты конкретного пакета
npm test --workspace=apps/backend

# E2E тесты
npm run test:e2e

# Покрытие
npm run test:coverage
```

## 📈 Производительность

Целевые метрики:
- ⚡ Отправка сообщения: < 100ms
- 🤖 AI модерация: < 200ms (99% случаев)
- 📞 Задержка звонков: < 50ms
- 📊 Пропускная способность: 1M сообщений/сек

## 🌍 Развёртывание

### Production

```bash
# Build всех приложений
npm run build

# Deploy с помощью Docker
docker-compose up -d

# Или на AWS
npm run deploy:aws
```

### Требования к инфраструктуре

- AWS Nitro Enclaves или Intel SGX
- PostgreSQL кластер (Primary + Replicas)
- Redis кластер
- Load Balancer (ALB/NLB)
- CDN (CloudFront)

## 🤝 Вклад в проект

Мы приветствуем вклад в проект! См. [CONTRIBUTING.md](./CONTRIBUTING.md)

### Команда

- **Backend**: Node.js, NestJS, PostgreSQL, Security
- **Frontend**: React, React Native, TypeScript
- **AI/ML**: Python, PyTorch, ML Engineering
- **DevOps**: AWS, Docker, Kubernetes

## 📄 Лицензия

[MIT License](./LICENSE) - свободное использование с указанием авторства

## 🔗 Ссылки

- [Сайт](https://achat.app) (в разработке)
- [Документация](https://docs.achat.app) (в разработке)
- [API Reference](https://api.achat.app/docs) (в разработке)
- [Status Page](https://status.achat.app) (в разработке)

## 📧 Контакты

- Email: team@achat.app
- Twitter: [@AChat](https://twitter.com/achat)
- Discord: [AChat Community](https://discord.gg/achat)

---

<div align="center">

**Сделано с ❤️ командой AChat**

[GitHub](https://github.com/yourusername/AChat) • [Twitter](https://twitter.com/achat) • [Discord](https://discord.gg/achat)

</div>
