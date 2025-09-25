import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Slide,
  useTheme,
  useMediaQuery,
  Stack,
  Card,
  CardContent,
  Fade,
  Chip
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  Fingerprint as FingerprintIcon,
  Security as SecurityIcon,
  Cookie as CookieIcon
} from '@mui/icons-material';
import { authAPI } from '../services/api';

const Login: React.FC = () => {
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [slideIn] = useState(true);

  const message = location.state?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.login(username.trim(), password);
      localStorage.setItem('token', response.data.token);
      
      // Force page reload to update authentication state
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh', // Dynamic viewport height for mobile
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'background.default',
        backgroundImage: isMobile ? 'none' : 
          `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
        py: isMobile ? 2 : 4,
      }}
    >
      <Container maxWidth="sm">
        <Slide direction="up" in={slideIn} timeout={600}>
          <Box>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Box 
                sx={{ 
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: isMobile ? 64 : 80,
                  height: isMobile ? 64 : 80,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                  mb: 2,
                  boxShadow: 3
                }}
              >
                <FingerprintIcon sx={{ fontSize: isMobile ? 32 : 40, color: 'white' }} />
              </Box>
              
              <Typography variant={isMobile ? "h4" : "h3"} component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                Welcome Back
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                Sign in to your ChatGPT Manager account to continue
              </Typography>
            </Box>

            {/* Login Form */}
            <Paper 
              elevation={isMobile ? 1 : 8} 
              sx={{ 
                p: isMobile ? 3 : 4, 
                borderRadius: 4,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {message && (
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  {message}
                </Alert>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Stack spacing={3}>
                  <TextField
                    fullWidth
                    label="Username"
                    value={username}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <PersonIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    disabled={loading}
                    autoComplete="username"
                    autoFocus={!isMobile} // Don't auto-focus on mobile to prevent keyboard pop-up
                  />
                  
                  <TextField
                    fullWidth
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockIcon color="action" />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={handleTogglePassword}
                            edge="end"
                            disabled={loading}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                    disabled={loading}
                    autoComplete="current-password"
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={loading || !username.trim() || !password.trim()}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LoginIcon />}
                    sx={{ 
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      borderRadius: 3,
                      boxShadow: 3,
                      '&:hover': {
                        boxShadow: 6,
                      }
                    }}
                  >
                    {loading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </Stack>
              </form>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Don't have an account?
                </Typography>
                <Button
                  component={Link}
                  to="/register"
                  variant="outlined"
                  color="primary"
                  disabled={loading}
                  sx={{ 
                    borderRadius: 3,
                    px: 3,
                    py: 1
                  }}
                >
                  Create Account
                </Button>
              </Box>
            </Paper>

            {/* Footer */}
            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                © 2024 ChatGPT Manager. Secure & Trusted.
              </Typography>
            </Box>
          </Box>
        </Slide>
      </Container>
    </Box>
  );
};

export default Login;
