import React from 'react';
import { Box, CircularProgress, Typography, Fade, useTheme, useMediaQuery, Stack } from '@mui/material';
import { Cookie as CookieIcon } from '@mui/icons-material';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Loading..." }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Fade in timeout={300}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100dvh', // Dynamic viewport height for mobile
          bgcolor: 'background.default',
          gap: { xs: 2, sm: 3 },
          px: { xs: 2, sm: 3 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background decoration */}
        <Box
          sx={{
            position: 'absolute',
            top: '20%',
            left: '10%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            bgcolor: 'primary.main',
            opacity: 0.05,
            animation: 'pulse 3s ease-in-out infinite',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: '20%',
            right: '15%',
            width: 60,
            height: 60,
            borderRadius: '50%',
            bgcolor: 'secondary.main',
            opacity: 0.05,
            animation: 'pulse 3s ease-in-out infinite 1s',
          }}
        />

        {/* Main content */}
        <Stack spacing={{ xs: 2, sm: 3 }} alignItems="center">
          {/* Logo/Icon */}
          <Box
            sx={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CircularProgress
              size={isMobile ? 50 : 60}
              thickness={3}
              sx={{
                color: 'primary.main',
                position: 'absolute',
              }}
            />
            <CookieIcon
              sx={{
                fontSize: isMobile ? 24 : 28,
                color: 'primary.main',
                zIndex: 1,
              }}
            />
          </Box>

          {/* Brand name */}
          <Typography
            variant={isMobile ? "h5" : "h4"}
            color="primary.main"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.025em',
              textAlign: 'center',
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            ChatGPT Manager
          </Typography>

          {/* Loading message */}
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              fontWeight: 500,
              textAlign: 'center',
              maxWidth: 300,
              opacity: 0.8,
            }}
          >
            {message}
          </Typography>

          {/* Loading dots animation */}
          <Box
            sx={{
              display: 'flex',
              gap: 0.5,
              '& > div': {
                width: 8,
                height: 8,
                borderRadius: '50%',
                bgcolor: 'primary.main',
                opacity: 0.6,
                animation: 'loadingDots 1.4s ease-in-out infinite both',
              },
              '& > div:nth-of-type(1)': { animationDelay: '-0.32s' },
              '& > div:nth-of-type(2)': { animationDelay: '-0.16s' },
            }}
          >
            <Box />
            <Box />
            <Box />
          </Box>
        </Stack>

        {/* CSS animations */}
        <style>
          {`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 0.05; }
              50% { transform: scale(1.1); opacity: 0.1; }
            }
            
            @keyframes loadingDots {
              0%, 80%, 100% { transform: scale(0); }
              40% { transform: scale(1); }
            }
          `}
        </style>
      </Box>
    </Fade>
  );
};

export default LoadingScreen;