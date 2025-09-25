import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  Stepper,
  Step,
  StepLabel,
  Slide,
  useTheme,
  useMediaQuery,
  Stack,
  MobileStepper
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd as RegisterIcon,
  Person as PersonIcon,
  Lock as LockIcon,
  CheckCircle as CheckIcon,
  AccountCircle as AccountIcon,
  KeyboardArrowLeft,
  KeyboardArrowRight
} from '@mui/icons-material';
import { authAPI } from '../services/api';

const steps = ['Account Details', 'Password Setup', 'Confirmation'];

const Register: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activeStep, setActiveStep] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [slideIn] = useState(true);

  const handleNext = () => {
    if (activeStep === 0 && username.trim().length >= 3) {
      setActiveStep(1);
      setError('');
    } else if (activeStep === 1 && password.length >= 6 && password === confirmPassword) {
      setActiveStep(2);
      setError('');
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await authAPI.register(username.trim(), password);
      navigate('/login', { 
        state: { message: 'Registration successful! Please sign in with your new account.' } 
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleToggleConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <TextField
            fullWidth
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <PersonIcon color="action" />
                </InputAdornment>
              ),
            }}
            helperText="Username must be at least 3 characters long"
            error={username.length > 0 && username.length < 3}
            sx={{ mb: 2 }}
          />
        );
      case 1:
        return (
          <Box>
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleTogglePassword} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText="Password must be at least 6 characters long"
              error={password.length > 0 && password.length < 6}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleToggleConfirmPassword} edge="end">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              helperText={password !== confirmPassword && confirmPassword.length > 0 ? 'Passwords do not match' : ''}
              error={password !== confirmPassword && confirmPassword.length > 0}
            />
          </Box>
        );
      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <CheckIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Ready to Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Username: <strong>{username}</strong><br />
              Password: {password.length >= 6 ? '✓ Valid' : '✗ Too short'}
            </Typography>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  const canProceed = () => {
    switch (activeStep) {
      case 0:
        return username.trim().length >= 3;
      case 1:
        return password.length >= 6 && password === confirmPassword;
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100dvh',
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
                  bgcolor: 'secondary.main',
                  mb: 2,
                  boxShadow: 3
                }}
              >
                <AccountIcon sx={{ fontSize: isMobile ? 32 : 40, color: 'white' }} />
              </Box>
              
              <Typography variant={isMobile ? "h4" : "h3"} component="h1" gutterBottom sx={{ fontWeight: 700 }}>
                Create Account
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 400, mx: 'auto' }}>
                Join ChatGPT Manager to manage your cookies and preferences
              </Typography>
            </Box>

            {/* Registration Form */}
            <Paper 
              elevation={isMobile ? 1 : 8} 
              sx={{ 
                p: isMobile ? 3 : 4, 
                borderRadius: 4,
                backdropFilter: 'blur(10px)',
                border: `1px solid ${theme.palette.divider}`,
              }}
            >
              {/* Progress Indicator */}
              {isMobile ? (
                <MobileStepper
                  steps={steps.length}
                  position="static"
                  activeStep={activeStep}
                  sx={{ mb: 3, bgcolor: 'transparent', p: 0 }}
                  nextButton={<div />}
                  backButton={<div />}
                />
              ) : (
                <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
                  {steps.map((label) => (
                    <Step key={label}>
                      <StepLabel>{label}</StepLabel>
                    </Step>
                  ))}
                </Stepper>
              )}

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Box sx={{ minHeight: isMobile ? 200 : 250 }}>
                  {getStepContent(activeStep)}
                </Box>

                <Stack 
                  direction="row" 
                  justifyContent="space-between" 
                  alignItems="center"
                  sx={{ mt: 3 }}
                >
                  <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    startIcon={<KeyboardArrowLeft />}
                    sx={{ 
                      borderRadius: 3,
                      visibility: activeStep === 0 ? 'hidden' : 'visible'
                    }}
                  >
                    Back
                  </Button>
                  
                  {activeStep === steps.length - 1 ? (
                    <Button
                      variant="contained"
                      type="submit"
                      disabled={loading || !canProceed()}
                      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <RegisterIcon />}
                      sx={{ 
                        py: 1.5,
                        px: 4,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderRadius: 3,
                        boxShadow: 3,
                        '&:hover': {
                          boxShadow: 6,
                        }
                      }}
                    >
                      {loading ? 'Creating Account...' : 'Create Account'}
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      onClick={handleNext}
                      disabled={!canProceed()}
                      endIcon={<KeyboardArrowRight />}
                      sx={{ 
                        py: 1.5,
                        px: 4,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        borderRadius: 3,
                        boxShadow: 3,
                        '&:hover': {
                          boxShadow: 6,
                        }
                      }}
                    >
                      Next
                    </Button>
                  )}
                </Stack>
              </form>

              <Divider sx={{ my: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  OR
                </Typography>
              </Divider>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Already have an account?
                </Typography>
                <Button
                  component={Link}
                  to="/login"
                  variant="outlined"
                  color="primary"
                  disabled={loading}
                  sx={{ 
                    borderRadius: 3,
                    px: 3,
                    py: 1
                  }}
                >
                  Sign In
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

export default Register;
