# 📦 Руководство по Развертыванию

## Предварительные Требования

- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 14+
- Rust (для WASM)

## Локальная Разработка

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
npm run start:dev
```

### 2. Frontend

```bash
cd frontend  
npm install
npm run dev
```

### 3. Mobile

```bash
cd mobile
npm install
npm run ios    # или npm run android
```

## Продакшн Развертывание

### Docker

```bash
docker-compose up -d
```

### Вручную

1. Сборка backend: `cd backend && npm run build`
2. Сборка WASM: `cd wasm_core && wasm-pack build`
3. Сборка frontend: `cd frontend && npm run build`
4. Развертывание на сервере

## Переменные Окружения

См. файлы `.env.example` в каждом модуле.

## Миграция Базы Данных

```bash
cd backend
npm run migration:run
```
