# MigrateMate

Bulut Geçiş Otomasyonu

## Ne Yapar / What It Does



## Problem



## Çözüm / Solution



## Hedef Kitle / Target Audience



## Temel Özellikler / Core Features



## Gelir Modeli / Revenue Model



## Teknoloji / Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Node.js + Express
- **Stil:** Vanilla CSS (koyu tema)

## Hızlı Başlangıç / Quick Start

```bash
# Backend
cd backend
npm install
npm run dev        # http://localhost:4000

# Frontend (ayrı terminal)
cd frontend
npm install
npm run dev        # http://localhost:5173
```

## MVP Yol Haritası / MVP Roadmap



---

*Generated as part of the 100-SaaS archive.*


---

## API Dokümantasyonu / API Reference

`/api/migration-plans` kaynağı üzerinde tam CRUD:

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| GET | `/api/health` | Sağlık kontrolü |
| GET | `/api/migration-plans` | Tüm kayıtları listeler |
| GET | `/api/migration-plans/:id` | Tek kayıt |
| POST | `/api/migration-plans` | Yeni kayıt (`title` zorunlu) |
| PUT | `/api/migration-plans/:id` | Güncelle |
| DELETE | `/api/migration-plans/:id` | Sil |

Örnek:

```bash
curl -X POST http://localhost:4000/api/migration-plans \
  -H "Content-Type: application/json" \
  -d '{"title": "Örnek", "detail": "açıklama"}'
```

## Testler

```bash
cd backend && npm test
```

## Docker ile Çalıştırma

```bash
docker compose up --build
# API: http://localhost:4000  Web: http://localhost:3000
```


---

## Kimlik Doğrulama / Authentication

Tüm `/api/migration-plans` uç noktaları bir token gerektirir:

```bash
# Kayıt
curl -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"secret123"}'

# Giriş
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"secret123"}'
# -> {"token":"..."}

# Korunan uç noktalara token ile erişim
curl http://localhost:4000/api/migration-plans \
  -H "Authorization: Bearer <token>"
```

## Sorgu Parametreleri / Query Parameters

`GET /api/migration-plans` şunları destekler:

| Param | Açıklama | Varsayılan |
|-------|----------|------------|
| `q` | `title`/`detail` içinde arama | boş |
| `page` | Sayfa numarası | 1 |
| `limit` | Sayfa başına kayıt (≤100) | 20 |
| `sort` | `asc` veya `desc` | desc |

```bash
curl "http://localhost:4000/api/migration-plans?q=ara&page=1&limit=10&sort=desc" \
  -H "Authorization: Bearer <token>"
```

## Veritabanı / Database

Veriler SQLite (`node:sqlite`, sıfır bağımlılık) içinde `backend/data/app.db` dosyasında saklanır.
Kullanıcılar (`users`) ve kayıtlar (`items`) tabloları otomatik oluşturulur.
