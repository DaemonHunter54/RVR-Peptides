# Environment Variables Setup

This document describes the environment variables needed to deploy River Valley Research Peptides on Railway.

## Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MySQL/TiDB connection string | `mysql://user:pass@host:3306/db` |
| `JWT_SECRET` | Secret for signing JWT tokens (64+ random chars) | `a1b2c3d4...` |
| `PORT` | Server port (Railway sets automatically) | `3000` |
| `NODE_ENV` | Environment mode | `production` |

## NowPayments Configuration

NowPayments credentials are managed through the **Admin Control Panel** at `/admin/payments`. No environment variables needed — they are stored securely in the database.

## Railway Deployment Steps

1. Push code to GitHub
2. Create a new Railway project
3. Add a MySQL database service
4. Connect your GitHub repo
5. Set the environment variables listed above
6. Deploy

The `railway.toml` and `Dockerfile` are already configured for Railway deployment.
