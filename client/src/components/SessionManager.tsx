import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Snackbar, 
  Alert, 
  AlertTitle, 
  Button, 
  Box, 
  useTheme, 
  useMediaQuery,
  Slide,
  SlideProps
} from '@mui/material';
import { 
  Warning as WarningIcon, 
  ExitToApp as LogoutIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { isAuthenticated, authAPI } from '../services/api';

interface SessionManagerProps {
  children: React.ReactNode;
}

// Custom transition for mobile-optimized snackbar
const SlideTransition = (props: SlideProps) => {
  return <Slide {...props} direction="up" />;
};

export const SessionManager: React.FC<SessionManagerProps> = ({ children }) => {
  const [showWarning, setShowWarning] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    setSessionExpired(true);
    setShowWarning(false);
    // Clear any stored auth data
    localStorage.removeItem('token');
    localStorage.removeItem('userInfo');
    // Redirect after a short delay to show the message
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 3000);
  }, [navigate]);

  // Handle session warning (5 minutes before expiry)
  const handleSessionWarning = useCallback(() => {
    setShowWarning(true);
  }, []);

  // Refresh session
  const refreshSession = useCallback(async () => {
    try {
      // Attempt to refresh the session
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        setShowWarning(false);
      } else {
        handleSessionExpired();
      }
    } catch (error) {
      console.error('Session refresh failed:', error);
      handleSessionExpired();
    }
  }, [handleSessionExpired]);

  // Check session status
  const checkSession = useCallback(() => {
    if (!isAuthenticated()) {
      // Only redirect if we're not already on login page
      if (window.location.pathname !== '/login') {
        handleSessionExpired();
      }
      return;
    }

    // Check token expiration (if token has exp claim)
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        const timeUntilExpiry = payload.exp - now;
        
        // Show warning 5 minutes before expiry
        if (timeUntilExpiry > 0 && timeUntilExpiry < 300) {
          handleSessionWarning();
        }
        
        // Session expired
        if (timeUntilExpiry <= 0) {
          handleSessionExpired();
        }
      }
    } catch (error) {
      console.error('Token parsing error:', error);
    }
  }, [handleSessionExpired, handleSessionWarning]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Session monitoring
  useEffect(() => {
    // Check immediately
    checkSession();

    // Check every 30 seconds
    const interval = setInterval(checkSession, 30000);

    return () => clearInterval(interval);
  }, [checkSession]);

  // Handle logout
  const handleLogout = () => {
    authAPI.logout();
    setShowWarning(false);
    setSessionExpired(false);
  };

  return (
    <>
      {children}
      
      {/* Session Warning Snackbar */}
      <Snackbar
        open={showWarning}
        anchorOrigin={{ 
          vertical: isMobile ? 'bottom' : 'top', 
          horizontal: 'center' 
        }}
        TransitionComponent={isMobile ? SlideTransition : undefined}
        sx={{
          '& .MuiSnackbarContent-root': {
            minWidth: isMobile ? '90vw' : 'auto',
          },
          bottom: isMobile ? 'calc(16px + env(safe-area-inset-bottom))' : undefined,
        }}
      >
        <Alert
          severity="warning"
          icon={<WarningIcon />}
          sx={{
            width: '100%',
            alignItems: 'center',
          }}
          action={
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                color="inherit"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={refreshSession}
                sx={{ minWidth: 'auto' }}
              >
                Extend
              </Button>
              <Button
                color="inherit"
                size="small"
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                sx={{ minWidth: 'auto' }}
              >
                Logout
              </Button>
            </Box>
          }
        >
          <AlertTitle sx={{ mb: 0 }}>Session Expiring Soon</AlertTitle>
          Your session will expire in 5 minutes. Extend or logout?
        </Alert>
      </Snackbar>

      {/* Session Expired Snackbar */}
      <Snackbar
        open={sessionExpired}
        anchorOrigin={{ 
          vertical: isMobile ? 'bottom' : 'top', 
          horizontal: 'center' 
        }}
        TransitionComponent={isMobile ? SlideTransition : undefined}
        sx={{
          bottom: isMobile ? 'calc(16px + env(safe-area-inset-bottom))' : undefined,
        }}
      >
        <Alert
          severity="error"
          icon={<LogoutIcon />}
          sx={{ width: '100%' }}
        >
          <AlertTitle>Session Expired</AlertTitle>
          Redirecting to login...
        </Alert>
      </Snackbar>

      {/* Offline Status */}
      <Snackbar
        open={!isOnline}
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: isMobile ? 'center' : 'left' 
        }}
        TransitionComponent={isMobile ? SlideTransition : undefined}
        sx={{
          bottom: isMobile ? 'calc(80px + env(safe-area-inset-bottom))' : 16,
        }}
      >
        <Alert
          severity="info"
          sx={{ 
            width: '100%',
            bgcolor: 'grey.800',
            color: 'white',
          }}
        >
          You're offline. Some features may not work.
        </Alert>
      </Snackbar>
    </>
  );
};