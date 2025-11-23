# 📚 Справочник API

## Базовый URL

```
http://localhost:3000/api/v1
```

## Аутентификация

Все защищенные эндпоинты требуют JWT токен в заголовке Authorization:

```
Authorization: Bearer <ваш-токен>
```

## Эндпоинты

### Аутентификация

#### Регистрация Пользователя
```http
POST /auth/register

Запрос:
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "Иван",
  "lastName": "Петров",
  "company": "ООО Строй"
}

Ответ:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Иван",
    "lastName": "Петров",
    "role": "user"
  }
}
```

#### Вход
```http
POST /auth/login

Запрос:
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Ответ: Аналогично регистрации
```

### Сметы

#### Создание Сметы
```http
POST /estimates
Authorization: Bearer <токен>

Запрос:
{
  "title": "Ремонт офиса",
  "description": "Капитальный ремонт офиса 100 м²",
  "client": "ООО Строй",
  "project": "Офис-2024",
  "currency": "RUB",
  "region": "moscow",
  "items": [
    {
      "name": "Штукатурка стен",
      "description": "Улучшенная штукатурка",
      "quantity": 150,
      "unit": "м²",
      "unitPrice": 350,
      "type": "work",
      "normCode": "ГЭСН-15-01-001-01",
      "coefficients": {
        "regional": 1.0,
        "difficulty": 1.1
      },
      "order": 1
    },
    {
      "name": "Краска водоэмульсионная",
      "quantity": 50,
      "unit": "кг",
      "unitPrice": 250,
      "type": "material",
      "order": 2
    }
  ]
}

Ответ:
{
  "id": "uuid",
  "title": "Ремонт офиса",
  "totalCost": 65000.00,
  "items": [...],
  "createdAt": "2025-01-15T10:00:00Z",
  "version": 1
}
```

#### Получение Всех Смет
```http
GET /estimates?status=draft&search=ремонт

Ответ:
[
  {
    "id": "uuid",
    "title": "Ремонт офиса",
    "client": "ООО Строй",
    "totalCost": 65000.00,
    "status": "draft",
    "createdAt": "2025-01-15T10:00:00Z",
    "itemsCount": 10
  }
]
```

#### Получение Сметы по ID
```http
GET /estimates/:id

Ответ:
{
  "id": "uuid",
  "title": "Ремонт офиса",
  "description": "...",
  "client": "ООО Строй",
  "totalCost": 65000.00,
  "items": [
    {
      "id": "uuid",
      "name": "Штукатурка стен",
      "quantity": 150,
      "unit": "м²",
      "unitPrice": 350,
      "totalPrice": 52500,
      "type": "work",
      "normCode": "ГЭСН-15-01-001-01"
    }
  ],
  "version": 1
}
```

#### Обновление Сметы
```http
PATCH /estimates/:id

Запрос:
{
  "title": "Ремонт офиса (обновлено)",
  "status": "approved"
}

Ответ: Обновленный объект сметы
```

#### Удаление Сметы
```http
DELETE /estimates/:id

Ответ: 204 No Content
```

#### Дублирование Сметы
```http
POST /estimates/:id/duplicate

Ответ: Новый объект сметы с суффиксом " (копия)"
```

### Нормы (ФЕР/ГЭСН/ТЕР)

#### Поиск Норм
```http
GET /norms?search=штукатурка&type=GESN&category=отделочные

Ответ:
[
  {
    "id": "uuid",
    "code": "ГЭСН-15-01-001-01",
    "type": "GESN",
    "name": "Штукатурка стен внутренняя",
    "description": "Улучшенная штукатурка...",
    "unit": "м²",
    "basePrice": 380.00,
    "category": "Отделочные работы",
    "materials": [
      {
        "name": "Раствор цементно-известковый",
        "unit": "м³",
        "quantity": 0.015,
        "coefficient": 1.1
      }
    ],
    "labor": {
      "hours": 1.2,
      "category": "3 разряд"
    }
  }
]
```

#### Получение Нормы по Коду
```http
GET /norms/:code/:type

Пример: GET /norms/ГЭСН-15-01-001-01/GESN

Ответ: Один объект нормы
```

#### Подбор Норм к Работе (ИИ)
```http
POST /norms/match

Запрос:
{
  "description": "нужно оштукатурить стены в комнате 20 квадратных метров",
  "quantity": 20,
  "unit": "м²"
}

Ответ:
[
  {
    "norm": { /* объект нормы */ },
    "confidence": 0.95,
    "reason": "Точное совпадение по описанию работ"
  },
  {
    "norm": { /* объект нормы */ },
    "confidence": 0.75,
    "reason": "Похожий тип работ"
  }
]
```

#### Генерация Сметы из Текста (ИИ)
```http
POST /norms/generate-estimate

Запрос:
{
  "text": "Ремонт 2-комнатной квартиры 52 кв.м. Нужно выровнять стены штукатуркой, покрасить стены и потолки, уложить ламинат в комнатах и плитку в ванной."
}

Ответ:
[
  {
    "description": "Штукатурка стен",
    "quantity": 95,
    "unit": "м²",
    "suggestedNorms": [ /* нормы */ ],
    "bestMatch": { /* лучшая подходящая норма */ }
  },
  {
    "description": "Укладка ламината",
    "quantity": 40,
    "unit": "м²",
    "suggestedNorms": [ /* нормы */ ]
  }
]
```

#### Массовый Импорт Норм
```http
POST /norms/bulk-import

Запрос:
{
  "norms": [
    {
      "code": "ФЕР-01-001-01",
      "type": "FER",
      "name": "...",
      /* другие поля */
    }
  ]
}

Ответ: { imported: 100, failed: 0 }
```

### Материалы

#### Получение Всех Материалов
```http
GET /materials?category=строительные&search=цемент&region=moscow

Ответ:
[
  {
    "id": "uuid",
    "code": "MAT-001",
    "name": "Цемент М500",
    "description": "Портландцемент...",
    "unit": "т",
    "price": 5500.00,
    "currency": "RUB",
    "manufacturer": "ООО Цемент",
    "category": "Строительные материалы",
    "region": "moscow",
    "isAvailable": true
  }
]
```

#### Получение Материала по Коду
```http
GET /materials/:code

Ответ: Один объект материала
```

#### Обновление Цены Материала
```http
PATCH /materials/:id/price

Запрос:
{
  "price": 6000.00,
  "priceDate": "2025-01-15"
}

Ответ: Обновленный объект материала
```

### Экспорт

#### Экспорт в PDF
```http
GET /export/:id?format=pdf

Ответ: Бинарный файл PDF
Content-Type: application/pdf
Content-Disposition: attachment; filename=estimate-{id}.pdf
```

#### Экспорт в Excel
```http
GET /export/:id?format=excel

Ответ: Бинарный файл XLSX
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

#### Экспорт в Word
```http
GET /export/:id?format=word

Ответ: Бинарный файл DOCX
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

#### Экспорт в JSON
```http
GET /export/:id?format=json

Ответ: JSON объект сметы
```

### Коэффициенты

#### Получение Всех Коэффициентов
```http
GET /coefficients

Ответ:
[
  {
    "name": "Москва",
    "code": "REG_MSK",
    "value": 1.0,
    "category": "regional"
  },
  {
    "name": "Сложные условия",
    "code": "DIFF_HARD",
    "value": 1.15,
    "category": "difficulty"
  }
]
```

#### Получение Коэффициентов по Категории
```http
GET /coefficients?category=regional

Ответ: Отфильтрованные коэффициенты
```

#### Применение Коэффициентов
```http
POST /coefficients/apply

Запрос:
{
  "baseValue": 100000,
  "coefficients": ["REG_MSK", "DIFF_HARD", "SEASON_WINTER"]
}

Ответ:
{
  "value": 126500.00,
  "applied": [
    {
      "name": "Москва",
      "code": "REG_MSK",
      "value": 1.0
    },
    {
      "name": "Сложные условия",
      "code": "DIFF_HARD",
      "value": 1.15
    },
    {
      "name": "Зима",
      "code": "SEASON_WINTER",
      "value": 1.1
    }
  ]
}
```

## Ответы с Ошибками

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Ошибка валидации",
  "errors": [
    {
      "field": "email",
      "message": "Неверный формат email"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Не авторизован"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Смета не найдена"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Внутренняя ошибка сервера"
}
```

## Ограничение Запросов

- **Лимит**: 100 запросов в минуту на IP
- **Заголовки**: 
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 95
  - `X-RateLimit-Reset`: 1705320000

## Пагинация

Для эндпоинтов, возвращающих списки:

```http
GET /estimates?page=1&limit=20

Ответ:
{
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## Документация Swagger

Интерактивная документация API доступна по адресу:
```
http://localhost:3000/api/docs
```
