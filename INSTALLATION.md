# 📦 Руководство по Установке

## Полная Мультиплатформенная Система Расчета Строительных Смет

Это руководство охватывает установку всех компонентов системы.

## Системные Требования

### Минимальные Требования
- **CPU**: 2 ядра
- **RAM**: 4ГБ
- **Хранилище**: 10ГБ
- **ОС**: Linux, macOS, или Windows 10+

### Рекомендуемые Требования
- **CPU**: 4+ ядра
- **RAM**: 8ГБ+
- **Хранилище**: 50ГБ SSD
- **ОС**: Ubuntu 22.04 LTS или macOS

## Предварительные Требования

### 1. Установка Node.js 18+

```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node@18

# Проверка установки
node --version
npm --version
```

### 2. Установка PostgreSQL 14+

```bash
# Ubuntu/Debian
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql@14

# Запуск PostgreSQL
sudo systemctl start postgresql  # Linux
brew services start postgresql@14  # macOS
```

### 3. Установка Rust (для WASM ядра)

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source $HOME/.cargo/env
rustc --version
```

### 4. Установка wasm-pack

```bash
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
wasm-pack --version
```

### 5. Установка Python 3.9+ (для AI модуля)

```bash
# Ubuntu/Debian
sudo apt install python3 python3-pip

# macOS
brew install python@3.9

# Проверка
python3 --version
pip3 --version
```

## Шаги Установки

### Шаг 1: Клонирование Репозитория

```bash
git clone https://github.com/rd8r8bkd9m-tech/smeta.git
cd smeta
```

### Шаг 2: Настройка Базы Данных

```bash
# Создание пользователя и базы данных
sudo -u postgres psql
CREATE USER smeta_user WITH PASSWORD 'smeta_password';
CREATE DATABASE smeta_db OWNER smeta_user;
GRANT ALL PRIVILEGES ON DATABASE smeta_db TO smeta_user;
\q
```

### Шаг 3: Настройка Backend

```bash
cd backend
npm install
cp .env.example .env

# Отредактируйте .env с вашими данными базы данных
nano .env

# Запуск миграций
npm run migration:run

# Запуск backend
npm run start:dev
```

Backend будет доступен по адресу `http://localhost:3000`

### Шаг 4: Сборка WASM Ядра

```bash
cd ../wasm_core
wasm-pack build --target web --release

# WASM модуль будет в директории pkg/
```

### Шаг 5: Настройка Frontend

```bash
cd ../frontend
npm install
cp .env.example .env

# Отредактируйте .env
nano .env

# Запуск frontend
npm run dev
```

Frontend будет доступен по адресу `http://localhost:5173`

### Шаг 6: Настройка AI Модуля (Опционально)

```bash
cd ../ai
npm install
pip3 install -r requirements.txt

# Установите API ключ Gemini
export GEMINI_API_KEY=ваш_api_ключ_здесь

# Запуск AI сервиса
npm start
```

### Шаг 7: Настройка Мобильного Приложения (Опционально)

#### iOS (только macOS)

```bash
cd ../mobile
npm install
cd ios
pod install
cd ..
npm run ios
```

#### Android

```bash
cd ../mobile
npm install
npm run android
```

## Установка через Docker (Рекомендуется)

Для упрощенного развертывания используйте Docker:

```bash
# Установите Docker и Docker Compose
# См. https://docs.docker.com/engine/install/

# Запуск всех сервисов
docker-compose up -d

# Сервисы будут доступны по адресам:
# - Backend: http://localhost:3000
# - Frontend: http://localhost:80
# - База данных: localhost:5432
```

## Проверка

### 1. Проверка Backend

```bash
curl http://localhost:3000/api/docs
```

Должна отобразиться документация Swagger API.

### 2. Проверка Frontend

Откройте `http://localhost:5173` в браузере.

### 3. Проверка Базы Данных

```bash
psql -U smeta_user -d smeta_db -h localhost
\dt  # Список таблиц
```

## Устранение Неполадок

### Backend не запускается

- Проверьте, что PostgreSQL запущен: `sudo systemctl status postgresql`
- Проверьте учетные данные базы данных в `.env`
- Проверьте логи: `npm run start:dev`

### Сборка WASM не удается

- Убедитесь, что Rust установлен: `rustc --version`
- Установите wasm-pack: `cargo install wasm-pack`
- Проверьте синтаксис Cargo.toml

### Ошибки Frontend

- Очистите node_modules: `rm -rf node_modules && npm install`
- Проверьте, что backend запущен
- Проверьте URL API в .env

### Ошибки подключения к базе данных

- Проверьте, что PostgreSQL запущен
- Проверьте учетные данные
- Проверьте настройки файрвола

## Следующие Шаги

1. **Импорт Данных Норм**: Загрузите нормы ФЕР/ГЭСН/ТЕР в базу данных
2. **Настройка AI**: Установите API ключ Gemini
3. **Создание Администратора**: Зарегистрируйте первого пользователя через API
4. **Импорт Шаблонов**: Загрузите шаблоны смет
5. **Настройка Региональных Коэффициентов**: Установите региональные цены

## Поддержка

- **Документация**: См. директорию `/docs`
- **Issues**: https://github.com/rd8r8bkd9m-tech/smeta/issues
- **API Документация**: http://localhost:3000/api/docs

## Примечания по Безопасности

- Измените стандартный пароль базы данных
- Используйте надежный JWT секрет
- Включите HTTPS в продакшн
- Настройте CORS правильно
- Храните API ключи в безопасности

---

**Установка завершена! 🎉**
