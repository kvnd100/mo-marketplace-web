# MO Marketplace Web

A full-stack e-commerce product management system with variant selection and Quick Buy flow, built as a technical assessment.

## Overview

MO Marketplace is a product management platform where sellers can create products with multiple variants (color, size, material). Each variant has a unique `combination_key` (e.g., `"red-M-cotton"`), individual pricing, and stock tracking. Buyers can browse products, select variants, and use the Quick Buy flow to purchase.

## Tech Stack

### Backend (`mo-marketplace-api/`)
- **NestJS** — Node.js framework with TypeScript
- **TypeORM** + **PostgreSQL 15** — ORM and database (Docker)
- **class-validator / class-transformer** — DTO validation
- **@nestjs/jwt + passport-jwt** — JWT authentication
- **@nestjs/swagger** — API documentation at `/api`

### Frontend (`mo-marketplace-web/`)
- **React 18** + **TypeScript** — UI framework (Vite)
- **Tailwind CSS v4** — Utility-first styling
- **react-router-dom v6** — Client-side routing
- **react-hook-form + zod** — Form validation
- **axios** — HTTP client with Bearer token interceptor

## Prerequisites

- Node.js >= 18
- Docker & Docker Compose (for PostgreSQL)
- npm or yarn

## Setup Instructions

### 1. Database (PostgreSQL via Docker)

```bash
docker run -d \
  --name mo-postgres \
  -e POSTGRES_USER=mo_user \
  -e POSTGRES_PASSWORD=mo_password \
  -e POSTGRES_DB=mo_marketplace \
  -p 5432:5432 \
  postgres:15
```

### 2. Backend

```bash
cd mo-marketplace-api
cp .env.example .env
# Edit .env with your database credentials
npm install
npm run start:dev
```

The API will be available at `http://localhost:3000` and Swagger docs at `http://localhost:3000/api`.

### 3. Frontend

```bash
cd mo-marketplace-web
cp .env.example .env
# Verify VITE_API_URL points to your backend
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Architecture Decisions

### Database Design
- **UUID primary keys** for all entities — avoids sequential ID enumeration
- **`combinationKey`** auto-generated as `"color-size-material"` (lowercase) — enforces uniqueness per product at the database level
- **`basePrice` on Product + `price` on Variant** — allows variant-specific pricing while maintaining a base price for display

### Authentication
- **JWT-based** with Bearer token in Authorization header
- **Public endpoints**: GET /products, GET /products/:id
- **Protected endpoints**: All write operations (POST, PATCH, DELETE)
- **401 responses** trigger automatic token cleanup and redirect to login

### Frontend State Management
- **React Context** for auth state — lightweight, no external state library needed
- **localStorage** for token persistence — survives page refresh
- **Axios interceptors** for automatic token attachment and 401 handling

### Variant Selection UX
- **Grouped selectors** (color, size, material) with cross-filtering — selecting a color disables sizes/materials that have no in-stock combination
- **Out-of-stock indicators** — visual badges and disabled states prevent selecting unavailable variants
- **Quick Buy modal** — confirms variant details before purchase, with animated transitions

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Create account |
| POST | /auth/login | No | Login, receive JWT |
| GET | /products | No | List all products with variants |
| GET | /products/:id | No | Get product by ID |
| POST | /products | Yes | Create product |
| PATCH | /products/:id | Yes | Update product |
| DELETE | /products/:id | Yes | Delete product |
| POST | /products/:productId/variants | Yes | Create variant |
| PATCH | /variants/:id | Yes | Update variant |
| DELETE | /variants/:id | Yes | Delete variant |

## Edge Cases Handled

1. **Duplicate variant combinations** — 409 Conflict with clear message, displayed inline on the form
2. **Out-of-stock variants** — Disabled in selector, cannot proceed to Quick Buy
3. **Invalid inputs** — Validated at both frontend (zod) and backend (class-validator)
4. **Unauthorized access** — 401 response clears token and redirects to login
5. **Product not found** — 404 page with friendly message and back navigation
6. **Empty product list** — "Create your first product" CTA for authenticated users

## Project Structure

```
mo-marketplace-web/
  src/
    api/client.ts              # Axios instance with interceptors
    components/
      Navbar.tsx               # Responsive navigation with auth state
      VariantSelector.tsx      # Grouped variant selection with stock filtering
      QuickBuy.tsx             # Purchase confirmation modal
      ProtectedRoute.tsx       # Auth guard for routes
    pages/
      Login.tsx                # Sign in form with validation
      Register.tsx             # Account creation form
      ProductList.tsx          # Product grid with loading/empty/error states
      ProductDetail.tsx        # Product page with variant selector + Quick Buy
      ProductCreate.tsx        # Multi-section form with dynamic variant rows
    store/auth-context.tsx     # Auth context provider
    types/index.ts             # TypeScript interfaces
```

## Screenshots

<!-- Add screenshots here -->
