# ChatGPT Manager Client

A professional, modern React application for managing ChatGPT cookies, user accounts, and website permissions.

## 🚀 Features

### **Authentication & User Management**
- **Secure Login/Register**: JWT-based authentication with bcrypt password hashing
- **User Profiles**: Track login history, cookie insertions, and user statistics
- **Admin Support**: Special privileges for administrators
- **Session Management**: Automatic token refresh and logout handling

### **Cookie Management**
- **Multi-Website Support**: Manage cookies across allowed domains
- **Cookie Bundles**: Upload, store, and manage cookie collections
- **Insertion Tracking**: Monitor successful and failed cookie insertions
- **Permission Control**: Grant/revoke website access (via Settings)

### **Professional UI/UX**
- **Material-UI Design**: Modern, responsive interface with professional styling
- **Responsive Layout**: Works seamlessly on desktop and mobile devices
- **Interactive Components**: Steppers, forms, tables, and data visualization
- **Theme System**: Customizable color schemes and typography

### **Data Management**
- **Real-time Updates**: Live data synchronization with the server
- **Error Handling**: Comprehensive error handling and user feedback
- **Loading States**: Smooth loading animations and progress indicators
- **Data Validation**: Client-side and server-side validation

## 🛠️ Technology Stack

- **Frontend Framework**: React 18 with TypeScript
- **UI Library**: Material-UI (MUI) v5
- **Styling**: Emotion CSS-in-JS
- **Routing**: React Router DOM v6
- **HTTP Client**: Axios with interceptors
- **Build Tool**: Vite
- **Package Manager**: npm

## 📁 Project Structure

```
client/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── Navigation.tsx   # Main navigation bar
│   │   └── ProtectedRoute.tsx # Authentication guard
│   ├── pages/               # Page components
│   │   ├── Dashboard.tsx    # Main dashboard
│   │   ├── Login.tsx        # Authentication page
│   │   ├── Register.tsx     # User registration
│   │   ├── CookieManager.tsx # Cookie management
│   │   ├── UserStats.tsx    # User statistics
│   │   ├── Users.tsx        # Admin: manage users & website access
│   │   └── Settings.tsx     # Account preferences & website permissions
│   ├── services/            # API services
│   │   └── api.ts          # HTTP client and endpoints
│   ├── types/               # TypeScript type definitions
│   │   └── index.ts        # All application types
│   ├── theme.ts             # Material-UI theme configuration
│   ├── App.tsx              # Main application component
│   ├── main.tsx             # Application entry point
│   └── index.css            # Global styles
├── package.json             # Dependencies and scripts
├── tsconfig.json            # TypeScript configuration
├── vite.config.ts           # Vite build configuration
└── README.md                # This file
```

## 🚀 Getting Started

### **Prerequisites**
- Node.js 16+ and npm
- Running server instance (see server README)
- Modern web browser

### **Installation**

1. **Navigate to client directory:**
   ```bash
   cd client
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

### **Build for Production**

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🔧 Configuration

- Dev server runs on `http://localhost:3000`
- Backend runs on `http://localhost:8080`

To change API target:
1. **Update API URL** in `src/services/api.ts`:
   ```typescript
   const API_URL = 'http://your-server-url:port/api';
   ```
2. **Update Vite proxy** in `vite.config.ts`:
   ```typescript
   proxy: {
     '/api': {
       target: 'http://your-server-url:port',
       changeOrigin: true,
     },
   },
   ```

## 📱 Pages & Features

### **Dashboard** (`/dashboard`)
- User statistics overview
- Quick access to main features

### **Login** (`/login`)
- Secure authentication with validation

### **Register** (`/register`)
- Multi-step registration with validation

### **Cookie Manager** (`/cookies`)
- Upload/manage cookie bundles and track insertions

### **User Statistics** (`/stats`)
- Login history and cookie insertion metrics

### **Settings** (`/settings`)
- Website permission management and account preferences

### **Users** (`/users`, Admin only)
- Manage users and assign website access

## 🔐 Authentication Flow

1. Registration → Login (JWT stored locally)
2. Protected routes guard unauthenticated access
3. Token refresh and auto logout on expiration

## 🧪 Testing & Troubleshooting

- Ensure server is running on `8080` and CORS allows `http://localhost:3000`
- Clear localStorage if auth issues occur
- Check browser console/network tab for API errors

## 🔒 Security

- JWT Authentication
- Input validation (client & server)
- HTTPS-ready for production

## 🤝 Contributing

- Follow code style and add types
- Include error handling
- Update docs for changes
