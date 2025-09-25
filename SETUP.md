# ChatGPT Client-Server-Extension Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- MongoDB  
- Chrome/Chromium browser

## Quick Setup

### 1. Environment Setup
Create a `.env` file in the `server/` directory:

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/cookie_admin

# JWT Secret (change this in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Port
PORT=3000

# Allowed Origins for CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,chrome-extension://*

# Environment
NODE_ENV=development
```

### 2. Install Dependencies

```bash
# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install

# Server client dependencies (if needed)
cd ../server/client
npm install
```

### 3. Create Admin User

```bash
cd server
node create-admin.js
```

This creates an admin user with:
- Username: `admin`
- Password: `admin123!@#`

### 4. Start the Server

```bash
cd server
npm run dev
```

The server will start on port 3000 (or 3001 if 3000 is busy).

### 5. Start the Client

```bash
cd client
npm run dev
```

The client will start on port 3000 and proxy API calls to the server.

### 6. Load the Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select the `Extention/` folder
4. The extension should now appear in your extensions list

## Testing

### Test Server
- Visit `http://localhost:3000` - should show the admin interface
- Test login with admin credentials

### Test Client
- Visit `http://localhost:3000` - should show the React app
- Try registering a new user
- Try logging in

### Test Extension
- Click the extension icon in Chrome
- Try logging in with admin credentials
- Test cookie insertion functionality

## Troubleshooting

### Port Conflicts
- If port 3000 is busy, the server will automatically try port 3001
- Update client proxy settings if server uses a different port

### MongoDB Issues
- Ensure MongoDB is running: `mongod`
- Check connection string in `.env` file

### Extension Issues
- Reload the extension after making changes
- Check browser console for errors
- Verify host permissions in manifest.json

### CORS Issues
- Check `ALLOWED_ORIGINS` in `.env`
- Ensure client and server ports match

## File Structure

```
├── client/                 # React client app
├── server/                 # Node.js backend
│   ├── src/               # Server source code
│   ├── client/            # Server's client (if needed)
│   └── .env              # Environment variables
├── Extention/             # Chrome extension
└── SETUP.md              # This file
```

## API Endpoints

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/create` - Admin create user
- `GET /api/auth/me` - Get current user
- `GET /api/auth/users` - List users (admin only)
- `POST /api/cookies/upload` - Upload cookies (admin only)
- `GET /api/cookies/get` - Get active cookies
- `GET /api/cookies` - List cookie bundles (admin only)
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/login-history` - Get login history
