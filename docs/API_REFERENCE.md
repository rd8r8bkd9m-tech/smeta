# 📚 API Reference

## Base URL

```
http://localhost:3000/api/v1
```

## Authentication

All protected endpoints require JWT token in Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /auth/register

Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "firstName": "Ivan",
  "lastName": "Petrov",
  "company": "ООО Строй"
}

Response:
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "Ivan",
    "lastName": "Petrov",
    "role": "user"
  }
}
```

#### Login
```http
POST /auth/login

Request:
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}

Response: Same as register
```

### Estimates

#### Create Estimate
```http
POST /estimates
Authorization: Bearer <token>

Request:
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

Response:
{
  "id": "uuid",
  "title": "Ремонт офиса",
  "totalCost": 65000.00,
  "items": [...],
  "createdAt": "2025-01-15T10:00:00Z",
  "version": 1
}
```

#### Get All Estimates
```http
GET /estimates?status=draft&search=ремонт

Response:
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

#### Get Estimate by ID
```http
GET /estimates/:id

Response:
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

#### Update Estimate
```http
PATCH /estimates/:id

Request:
{
  "title": "Ремонт офиса (обновлено)",
  "status": "approved"
}

Response: Updated estimate object
```

#### Delete Estimate
```http
DELETE /estimates/:id

Response: 204 No Content
```

#### Duplicate Estimate
```http
POST /estimates/:id/duplicate

Response: New estimate object with " (копия)" suffix
```

### Norms (FER/GESN/TER)

#### Search Norms
```http
GET /norms?search=штукатурка&type=GESN&category=отделочные

Response:
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

#### Get Norm by Code
```http
GET /norms/:code/:type

Example: GET /norms/ГЭСН-15-01-001-01/GESN

Response: Single norm object
```

#### Match Work to Norms (AI)
```http
POST /norms/match

Request:
{
  "description": "нужно оштукатурить стены в комнате 20 квадратных метров",
  "quantity": 20,
  "unit": "м²"
}

Response:
[
  {
    "norm": { /* norm object */ },
    "confidence": 0.95,
    "reason": "Точное совпадение по описанию работ"
  },
  {
    "norm": { /* norm object */ },
    "confidence": 0.75,
    "reason": "Похожий тип работ"
  }
]
```

#### Generate Estimate from Text (AI)
```http
POST /norms/generate-estimate

Request:
{
  "text": "Ремонт 2-комнатной квартиры 52 кв.м. Нужно выровнять стены штукатуркой, покрасить стены и потолки, уложить ламинат в комнатах и плитку в ванной."
}

Response:
[
  {
    "description": "Штукатурка стен",
    "quantity": 95,
    "unit": "м²",
    "suggestedNorms": [ /* norms */ ],
    "bestMatch": { /* best matching norm */ }
  },
  {
    "description": "Укладка ламината",
    "quantity": 40,
    "unit": "м²",
    "suggestedNorms": [ /* norms */ ]
  }
]
```

#### Bulk Import Norms
```http
POST /norms/bulk-import

Request:
{
  "norms": [
    {
      "code": "ФЕР-01-001-01",
      "type": "FER",
      "name": "...",
      /* other fields */
    }
  ]
}

Response: { imported: 100, failed: 0 }
```

### Materials

#### Get All Materials
```http
GET /materials?category=строительные&search=цемент&region=moscow

Response:
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

#### Get Material by Code
```http
GET /materials/:code

Response: Single material object
```

#### Update Material Price
```http
PATCH /materials/:id/price

Request:
{
  "price": 6000.00,
  "priceDate": "2025-01-15"
}

Response: Updated material object
```

### Export

#### Export to PDF
```http
GET /export/:id?format=pdf

Response: Binary PDF file
Content-Type: application/pdf
Content-Disposition: attachment; filename=estimate-{id}.pdf
```

#### Export to Excel
```http
GET /export/:id?format=excel

Response: Binary XLSX file
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

#### Export to Word
```http
GET /export/:id?format=word

Response: Binary DOCX file
Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

#### Export to JSON
```http
GET /export/:id?format=json

Response: JSON estimate object
```

### Coefficients

#### Get All Coefficients
```http
GET /coefficients

Response:
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

#### Get Coefficients by Category
```http
GET /coefficients?category=regional

Response: Filtered coefficients
```

#### Apply Coefficients
```http
POST /coefficients/apply

Request:
{
  "baseValue": 100000,
  "coefficients": ["REG_MSK", "DIFF_HARD", "SEASON_WINTER"]
}

Response:
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

## Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Estimate not found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## Rate Limiting

- **Rate**: 100 requests per minute per IP
- **Headers**: 
  - `X-RateLimit-Limit`: 100
  - `X-RateLimit-Remaining`: 95
  - `X-RateLimit-Reset`: 1705320000

## Pagination

For endpoints returning lists:

```http
GET /estimates?page=1&limit=20

Response:
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

## Swagger Documentation

Interactive API documentation available at:
```
http://localhost:3000/api/docs
```
