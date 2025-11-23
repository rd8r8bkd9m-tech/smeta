# 📦 Deployment Guide

## Prerequisites

- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 14+
- Rust (for WASM)

## Local Development

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
npm run ios    # or npm run android
```

## Production Deployment

### Docker

```bash
docker-compose up -d
```

### Manual

1. Build backend: `cd backend && npm run build`
2. Build WASM: `cd wasm_core && wasm-pack build`
3. Build frontend: `cd frontend && npm run build`
4. Deploy to server

## Environment Variables

See `.env.example` files in each module.

## Database Migration

```bash
cd backend
npm run migration:run
```
