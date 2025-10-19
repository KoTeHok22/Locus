#!/bin/bash

echo "=== Тестирование API ==="
echo ""

echo "1. Логин..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8501/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"client@example.com","password":"Password123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['token'])")

echo "✓ Токен получен"
echo ""

echo "2. Получение списка материалов..."
curl -s http://localhost:8501/api/materials \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -20
echo ""

echo "3. Получение плана работ для проекта 3..."
curl -s http://localhost:8501/api/projects/3/work-plan \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -30
echo ""

echo "4. Получение списка задач для проекта 3..."
curl -s "http://localhost:8501/api/tasks?project_id=3" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool | head -40
