# Cookie Admin Backend Server

A Node.js/Express backend server for managing browser cookies with user authentication and admin controls.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- MongoDB running locally or accessible via connection string
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   # Copy the example environment file
   copy env.example .env
   
   # Edit .env with your configuration
   notepad .env
   ```

3. **Configure your .env file:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/cookie_admin
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=3000
   NODE_ENV=development
   ```

4. **Start the server:**
   ```bash
   # Option 1: Use the batch file (Windows)
   start.bat
   
   # Option 2: Use npm
   npm run dev
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/cookie_admin` |
| `JWT_SECRET` | Secret key for JWT tokens | Required |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000,http://localhost:3001,chrome-extension://*` |

### CORS Configuration

The server automatically allows:
- Chrome extensions (`chrome-extension://*`)
- Localhost connections (`http://localhost:*`, `https://localhost:*`)
- Origins specified in `ALLOWED_ORIGINS`
- All origins in development mode

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/create` - Create user (admin only)
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/users` - List all users (admin only)

### Cookies
- `POST /api/cookies/upload` - Upload cookies (admin only)
- `GET /api/cookies/get` - Get active cookies
- `GET /api/cookies` - List all bundles (admin only)
- `GET /api/cookies/:id` - Get specific bundle (admin only)

### Users
- `GET /api/users/stats` - Get user statistics
- `GET /api/users/login-history` - Get login history
- `GET /api/users/cookie-insertions` - Get cookie insertion history
- `GET /api/users/website-permissions` - Get website permissions
- `PUT /api/users/permissions` - Update website permissions

## 🛠️ Admin Setup

### Create Admin User

1. **Start the server first**
2. **Run the admin creation script:**
   ```bash
   npm run setup
   ```

This will create an admin user with:
- Username: `Yashrajjagtap95`
- Password: `Yash@2702`
- Admin privileges: `true`

### Reset Users

To clear all users from the database:
```bash
npm run reset
```

### Fix Database Indexes

If you encounter index-related errors:
```bash
npm run fix-indexes
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt for password security
- **Rate Limiting** - Prevents abuse
- **CORS Protection** - Controlled cross-origin access
- **Helmet** - Security headers
- **Input Validation** - Request data validation

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Failed**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network access

2. **JWT Authentication Fails**
   - Check `JWT_SECRET` in `.env`
   - Ensure token format: `Bearer <token>`
   - Verify token expiration

3. **CORS Errors**
   - Check `ALLOWED_ORIGINS` in `.env`
   - Verify client origin matches allowed origins
   - Check browser console for CORS details

4. **Port Already in Use**
   - Change `PORT` in `.env`
   - Kill process using the port
   - Use `netstat -ano | findstr :3000` to find process

### Debug Mode

Enable detailed logging by setting:
```env
NODE_ENV=development
```

## 📁 Project Structure

```
server/
├── src/
│   ├── middleware/     # Authentication middleware
│   ├── models/         # MongoDB models
│   ├── routes/         # API route handlers
│   └── server.js       # Main server file
├── .env                # Environment variables
├── env.example         # Environment template
├── package.json        # Dependencies and scripts
├── start.bat          # Windows startup script
└── README.md          # This file
```

## 🔄 Development

### Adding New Routes

1. Create route file in `src/routes/`
2. Import and use in `src/server.js`
3. Add authentication middleware if needed

### Adding New Models

1. Create model file in `src/models/`
2. Define Mongoose schema
3. Export model for use in routes

## 📞 Support

For issues and questions:
1. Check this README
2. Review server logs
3. Check MongoDB connection
4. Verify environment variables

## 🚀 Production Deployment

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET`
3. Configure production MongoDB
4. Set up proper CORS origins
5. Use HTTPS in production
6. Set up monitoring and logging
