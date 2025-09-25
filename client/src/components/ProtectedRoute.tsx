import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, Fade } from '@mui/material';
import LoadingScreen from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  isLoading?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  isAuthenticated, 
  isLoading = false 
}) => {
  // Show loading screen while checking authentication
  if (isLoading) {
    return <LoadingScreen message="Verifying access..." />;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Render protected content with smooth transition
  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          minHeight: '100dvh',
          bgcolor: 'background.default',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {children}
      </Box>
    </Fade>
  );
};

export default ProtectedRoute;
