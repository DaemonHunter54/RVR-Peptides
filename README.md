# River Valley Research Peptides

Full-stack e-commerce application for research peptides with admin control panel, NowPayments crypto checkout, and customer accounts.

## Tech Stack

- **Frontend:** React 19, Tailwind CSS 4, tRPC client, Wouter routing
- **Backend:** Express 4, tRPC 11, MySQL (TiDB/PlanetScale compatible)
- **Auth:** Local email/password with JWT sessions
- **Payments:** NowPayments crypto gateway
- **Deploy:** Railway (Docker)

## Quick Start

```bash
# Install dependencies
pnpm install

# Set environment variables (see .env.example)
cp .env.example .env

# Run in development
pnpm dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string |
| `JWT_SECRET` | Secret for signing session cookies |
| `PORT` | Server port (default: 3000) |

NowPayments credentials are managed through the admin panel (Settings > Payments).

## Deployment (Railway)

1. Push to GitHub
2. Connect repo to Railway
3. Set `DATABASE_URL` and `JWT_SECRET` environment variables
4. Railway will auto-detect the Dockerfile and deploy

## Admin Access

1. Register a normal account at `/register`
2. Promote to admin via SQL: `UPDATE users SET role = 'admin' WHERE email = 'your@email.com';`
3. Access admin panel at `/admin`

## Features

- **Storefront:** Product grid, category filtering, search, product detail with research citations
- **Cart & Checkout:** Add to cart, guest checkout, NowPayments crypto payment
- **Customer Accounts:** Register/login, order history, tracking information
- **Admin Panel:** Dashboard, product management, order management with tracking, discounts, site settings, NowPayments config, website customization with holiday templates
- **Website Customization:** Visual builder for colors/text/banners + one-click holiday templates (Christmas, Halloween, Easter, Valentine's, 4th of July, Black Friday)

## Project Structure

```
client/src/         - React frontend
  pages/            - Page components
  components/       - Reusable UI components
  lib/              - Utilities and tRPC client
server/             - Express backend
  _core/            - Framework plumbing
  routers.ts        - tRPC API procedures
  db.ts             - Database query helpers
  nowpayments.ts    - NowPayments integration
drizzle/            - Database schema & migrations
client/public/images/ - Brand assets (logo, hero, vials)
```

## Images & Assets

All brand images are stored locally in `client/public/images/`:
- `rvr-logo.png` - Full logo
- `rvr-logo-icon.png` - Icon-only logo
- `rvr-hero-vials.png` - Hero banner with 3 branded vials
- `rvr-single-vial-generic.png` - Default product image
- `rvr-single-vial-bpc157.png` - BPC-157 product image
- `rvr-single-vial-tb500.png` - TB-500 product image

These are referenced via `/images/filename.png` in the code (see `client/src/lib/assets.ts`).
