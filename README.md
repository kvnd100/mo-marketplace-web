# MO Marketplace Web

A modern e-commerce marketplace frontend with product browsing, variant selection, cart management, and Quick Buy flow.

## Overview

MO Marketplace is a product marketplace where sellers can create products with multiple variants (color, size, material). Each variant has a unique `combination_key` (e.g., `"red-M-cotton"`), individual pricing, and stock tracking. Buyers can browse products, filter and sort listings, select variants, add items to cart, and use the Quick Buy flow for fast purchases.

## Tech Stack

- **React 18** + **TypeScript** — UI framework (Vite)
- **Tailwind CSS v4** — Utility-first styling
- **react-router-dom v6** — Client-side routing
- **react-hook-form + zod** — Form validation
- **axios** — HTTP client with Bearer token interceptor

## Prerequisites

- Node.js >= 18
- npm or yarn
- Backend API running (see `mo-marketplace-api/`)

## Setup

```bash
cp .env.example .env
# Verify VITE_API_URL points to your backend (default: http://localhost:3000)
npm install
npm run dev
```

The app will be available at `http://localhost:5173`.

## Features

### Product Browsing
- Paginated product grid with responsive layout
- Filter by category, brand, condition, rating, price range, and stock status
- Sort by price (asc/desc), rating, newest, or oldest
- Search products by name

### Variant Selection
- Grouped selectors (color, size, material) with cross-filtering
- Out-of-stock indicators with visual badges and disabled states
- Variant-specific pricing and stock display

### Cart
- Add-to-cart with variant and quantity selection
- Cart quantity management with stock-aware limits
- Persistent cart state via React Context
- Cart badge in navbar showing item count

### Quick Buy
- One-click purchase confirmation modal with animated transitions
- Shows variant details and pricing before purchase

### Authentication
- JWT-based with Bearer token in Authorization header
- Login and registration forms with validation
- 401 responses trigger automatic token cleanup and redirect to login
- Protected routes for product creation and editing

## API Endpoints Used

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/register | No | Create account |
| POST | /auth/login | No | Login, receive JWT |
| GET | /products | No | List products (supports filtering, sorting, pagination) |
| GET | /products/:id | No | Get product detail with variants |
| POST | /products | Yes | Create product |
| PATCH | /products/:id | Yes | Update product |
| DELETE | /products/:id | Yes | Delete product |
| POST | /products/:productId/variants | Yes | Create variant |
| PATCH | /variants/:id | Yes | Update variant |
| DELETE | /variants/:id | Yes | Delete variant |

## Project Structure

```
src/
  api/client.ts                # Axios instance with interceptors
  components/
    Icon.tsx                   # SVG icon component
    Navbar.tsx                 # Responsive navigation with auth state and cart badge
    ProductCard.tsx            # Product card with add-to-cart
    ProductImage.tsx           # Product image with fallback handling
    VariantSelector.tsx        # Grouped variant selection with stock filtering
    QuickBuy.tsx               # Purchase confirmation modal
    ProtectedRoute.tsx         # Auth guard for routes
  pages/
    Login.tsx                  # Sign in form
    Register.tsx               # Account creation form
    ProductList.tsx            # Product grid with filters, sorting, and pagination
    ProductDetail.tsx          # Product page with variant selector + Quick Buy
    ProductCreate.tsx          # Product creation form with dynamic variant rows
    ProductEdit.tsx            # Product editing form
    Cart.tsx                   # Shopping cart page
  store/
    auth-context.tsx           # Auth context provider
    cart-context.tsx            # Cart context provider
  types/index.ts               # TypeScript interfaces
```
