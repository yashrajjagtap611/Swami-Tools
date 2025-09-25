import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline, Box, useTheme, useMediaQuery } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeContext';
import { isAuthenticated, getCurrentUserInfo } from './services/api';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import { SessionManager } from './components/SessionManager';
import LoadingScreen from './components/LoadingScreen';

// Lazy load components
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const CookieManager = React.lazy(() => import('./pages/CookieManager'));
// UserStats page removed
const Settings = React.lazy(() => import('./pages/Settings'));
// AdminPanel page removed
const Users = React.lazy(() => import('./pages/Users'));
// WebsitePermissions page removed during UI cleanup

const AppContent: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [userInfo, setUserInfo] = useState<{ username: string; isAdmin: boolean } | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      const user = getCurrentUserInfo();
      setIsAuth(authenticated);
      setUserInfo(user);
      setLoading(false);
    };

    checkAuth();
    
    // Listen for storage changes (login/logout)
    const handleStorageChange = () => {
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <SessionManager>
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            minHeight: '100dvh', // Dynamic viewport height for mobile
            bgcolor: 'background.default'
          }}
        >
          {isAuth && <Navigation userInfo={userInfo} />}
          <Box 
            component="main" 
            sx={{ 
              flexGrow: 1,
              bgcolor: 'background.default',
              // Add bottom padding on mobile for bottom navigation
              pb: isMobile && isAuth ? '80px' : 0,
              // Add safe area padding for mobile devices
              paddingBottom: isMobile && isAuth ? 'calc(80px + env(safe-area-inset-bottom))' : 0,
            }}
          >
            <React.Suspense fallback={<LoadingScreen />}>
              <Routes>
                <Route path="/login" element={
                  isAuth ? <Navigate to="/dashboard" replace /> : <Login />
                } />
                <Route path="/register" element={
                  isAuth ? <Navigate to="/dashboard" replace /> : <Register />
                } />
                <Route path="/dashboard" element={
                  <ProtectedRoute isAuthenticated={isAuth}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/cookies" element={
                  <ProtectedRoute isAuthenticated={isAuth}>
                    <CookieManager />
                  </ProtectedRoute>
                } />
                {/* /stats removed */}
                <Route path="/settings" element={
                  <ProtectedRoute isAuthenticated={isAuth}>
                    <Settings />
                  </ProtectedRoute>
                } />
                {/* /admin removed */}
                <Route path="/users" element={
                  <ProtectedRoute isAuthenticated={isAuth}>
                    <Users />
                  </ProtectedRoute>
                } />
                {/* WebsitePermissions route removed; use Settings for website management */}
                <Route path="/" element={
                  isAuth ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />
                } />
              </Routes>
            </React.Suspense>
          </Box>
        </Box>
      </SessionManager>
    </BrowserRouter>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
