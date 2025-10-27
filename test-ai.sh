#!/bin/bash

echo "======================================"
echo "🧪 Тестирование AChat AI Service"
echo "======================================"
echo ""

echo "1️⃣ Проверка статуса сервиса..."
curl -s http://localhost:8000/ | python3 -m json.tool
echo ""
echo ""

echo "2️⃣ Тест модерации: БЕЗОПАСНОЕ сообщение"
curl -s -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello! How are you doing today?"}' | python3 -m json.tool
echo ""
echo ""

echo "3️⃣ Тест модерации: ПОДОЗРИТЕЛЬНОЕ сообщение (наркотики)"
curl -s -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Want to buy cocaine and drugs?"}' | python3 -m json.tool
echo ""
echo ""

echo "4️⃣ Тест модерации: ОЧЕНЬ ПОДОЗРИТЕЛЬНОЕ (оружие + наркотики)"
curl -s -X POST http://localhost:8000/moderation/analyze \
  -H "Content-Type: application/json" \
  -d '{"content": "Selling guns, bombs, cocaine, and heroin. Money laundering service."}' | python3 -m json.tool
echo ""
echo ""

echo "5️⃣ Тест AI Assistant: Подсказки для разговора"
curl -s -X POST http://localhost:8000/assistant/suggest \
  -H "Content-Type: application/json" \
  -d '{"message": "How are you?", "userId": "test-user"}' | python3 -m json.tool
echo ""
echo ""

echo "6️⃣ Тест анализа сентимента: ПОЗИТИВНОЕ сообщение"
curl -s -X POST http://localhost:8000/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I am so happy and excited about this amazing project!"}' | python3 -m json.tool
echo ""
echo ""

echo "7️⃣ Тест анализа сентимента: НЕГАТИВНОЕ сообщение"
curl -s -X POST http://localhost:8000/sentiment/analyze \
  -H "Content-Type: application/json" \
  -d '{"text": "I am so sad and frustrated. This is terrible."}' | python3 -m json.tool
echo ""
echo ""

echo "======================================"
echo "✅ Тестирование завершено!"
echo "======================================"
echo ""
echo "📚 Документация API: http://localhost:8000/docs"
echo "🔍 Альтернативная документация: http://localhost:8000/redoc"
