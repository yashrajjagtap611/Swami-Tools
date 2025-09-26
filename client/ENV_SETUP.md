# Environment Setup Guide

## Quick Setup

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Update the values in `.env` file:**
   ```bash
   # Development Environment Variables
   VITE_API_URL=http://localhost:8080/api
   VITE_API_TIMEOUT=10000
   VITE_APP_NAME=ChatGPT Manager
   VITE_APP_VERSION=1.0.0
   VITE_SESSION_TIMEOUT=3600000
   VITE_ACTIVITY_CHECK_INTERVAL=60000
   VITE_NODE_ENV=development
   VITE_DEBUG=false
   ```

## Production Setup

1. **For production deployment, create `.env.production`:**
   ```bash
   cp .env.production.example .env.production
   ```

2. **Update with your production API URL:**
   ```bash
   VITE_API_URL=https://swami-tools-server.onrender.com/api
   ```

## Environment Variables Explained

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:8080/api` |
| `VITE_API_TIMEOUT` | API request timeout in milliseconds | `10000` |
| `VITE_APP_NAME` | Application display name | `ChatGPT Manager` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |
| `VITE_SESSION_TIMEOUT` | Session timeout in milliseconds | `3600000` (1 hour) |
| `VITE_ACTIVITY_CHECK_INTERVAL` | Activity check interval in milliseconds | `60000` (1 minute) |
| `VITE_NODE_ENV` | Environment mode | `development` |
| `VITE_DEBUG` | Enable debug logging | `false` |

## Important Notes

- **All environment variables must start with `VITE_`** to be accessible in the client-side code
- **Never commit `.env` files** to version control (they're in `.gitignore`)
- **Use `.env.example` as a template** for other developers
- **Production variables** should be set in your deployment platform (Vercel, Netlify, etc.)

## Vercel Deployment

When deploying to Vercel, set these environment variables in your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add each variable with the `VITE_` prefix
4. Set the appropriate values for production

Example:
- `VITE_API_URL` → `https://swami-tools-server.onrender.com/api`
- `VITE_NODE_ENV` → `production`
- `VITE_DEBUG` → `false`
