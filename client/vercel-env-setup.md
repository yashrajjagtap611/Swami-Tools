# Vercel Environment Variables Setup

To fix the deployment issues, you need to set the following environment variables in your Vercel dashboard:

## Required Environment Variables

Go to your Vercel project dashboard → Settings → Environment Variables and add:

```
VITE_API_URL=https://swami-tools-server.vercel.app/api
VITE_API_TIMEOUT=10000
VITE_APP_NAME=ChatGPT Manager
VITE_APP_VERSION=1.0.0
VITE_SESSION_TIMEOUT=3600000
VITE_ACTIVITY_CHECK_INTERVAL=60000
VITE_NODE_ENV=production
VITE_DEBUG=false
```

## Important Notes

1. **VITE_API_URL** is the most critical - it must point to your deployed server
2. Set these for **Production** environment in Vercel
3. After adding these variables, redeploy your application
4. The client will now connect to your deployed server instead of localhost

## Quick Setup Commands

If you want to set up local development environment:

```bash
npm run setup-env
# Then edit the created .env file with your local settings
```
