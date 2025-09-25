import { createTheme, ThemeProvider } from '@mui/material/styles';
import { PaletteMode } from '@mui/material';

// Professional color palette with excellent accessibility and modern design
const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          // Light mode - Professional & Clean (matching your current UI)
          primary: {
            main: '#4f46e5', // Professional blue (matching your header)
            light: '#6366f1',
            dark: '#3730a3',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#7c3aed', // Professional purple
            light: '#8b5cf6',
            dark: '#6d28d9',
            contrastText: '#ffffff',
          },
          background: {
            default: '#f1f5f9', // Light gray background (matching your UI)
            paper: '#ffffff',
          },
          text: {
            primary: '#1e293b', // Dark text for excellent readability
            secondary: '#64748b', // Medium gray
          },
          success: {
            main: '#059669', // Professional green
            light: '#10b981',
            dark: '#047857',
          },
          error: {
            main: '#dc2626', // Professional red
            light: '#ef4444',
            dark: '#b91c1c',
          },
          warning: {
            main: '#d97706', // Professional amber
            light: '#f59e0b',
            dark: '#b45309',
          },
          info: {
            main: '#0284c7', // Professional cyan
            light: '#0ea5e9',
            dark: '#0369a1',
          },
          divider: '#e2e8f0',
          action: {
            hover: 'rgba(37, 99, 235, 0.04)',
            selected: 'rgba(37, 99, 235, 0.08)',
          },
        }
      : {
          // Dark mode - Modern & Sophisticated
          primary: {
            main: '#3b82f6', // Bright blue for dark mode
            light: '#60a5fa',
            dark: '#2563eb',
            contrastText: '#ffffff',
          },
          secondary: {
            main: '#8b5cf6', // Bright purple for dark mode
            light: '#a78bfa',
            dark: '#7c3aed',
            contrastText: '#ffffff',
          },
          background: {
            default: '#1a202c', // Dark blue-gray background
            paper: '#2d3748', // Darker paper for cards
          },
          text: {
            primary: '#f7fafc', // Very light text for excellent readability
            secondary: '#a0aec0', // Medium gray for secondary text
          },
          success: {
            main: '#10b981', // Bright green
            light: '#34d399',
            dark: '#059669',
          },
          error: {
            main: '#ef4444', // Bright red
            light: '#f87171',
            dark: '#dc2626',
          },
          warning: {
            main: '#f59e0b', // Bright amber
            light: '#fbbf24',
            dark: '#d97706',
          },
          info: {
            main: '#0ea5e9', // Bright cyan
            light: '#38bdf8',
            dark: '#0284c7',
          },
          divider: '#334155',
          action: {
            hover: 'rgba(59, 130, 246, 0.08)',
            selected: 'rgba(59, 130, 246, 0.12)',
          },
        }),
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    // Mobile-first typography with better scaling
    h1: {
      fontSize: 'clamp(1.75rem, 4vw + 1rem, 2.75rem)', // Better mobile scaling
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: '-0.025em',
    },
    h2: {
      fontSize: 'clamp(1.5rem, 3vw + 1rem, 2.25rem)',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h3: {
      fontSize: 'clamp(1.25rem, 2.5vw + 0.5rem, 1.875rem)',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: 'clamp(1.125rem, 2vw + 0.5rem, 1.5rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: 'clamp(1rem, 1.5vw + 0.25rem, 1.25rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h6: {
      fontSize: 'clamp(0.875rem, 1vw + 0.25rem, 1.125rem)',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: 'clamp(0.875rem, 0.5vw + 0.75rem, 1rem)', // Responsive body text
      lineHeight: 1.6,
      fontWeight: 400,
    },
    body2: {
      fontSize: 'clamp(0.8125rem, 0.5vw + 0.6875rem, 0.875rem)',
      lineHeight: 1.5,
      fontWeight: 400,
    },
    button: {
      fontSize: 'clamp(0.875rem, 0.5vw + 0.75rem, 0.9375rem)',
      textTransform: 'none' as const,
      fontWeight: 600,
      letterSpacing: '0.01em',
    },
    caption: {
      fontSize: 'clamp(0.75rem, 0.25vw + 0.6875rem, 0.8125rem)',
      lineHeight: 1.4,
      fontWeight: 400,
    },
    overline: {
      fontSize: 'clamp(0.6875rem, 0.25vw + 0.625rem, 0.75rem)',
      lineHeight: 1.4,
      fontWeight: 700,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
    },
  },
  breakpoints: {
    values: {
      xs: 0,      // Mobile phones
      sm: 640,    // Large phones / small tablets
      md: 768,    // Tablets
      lg: 1024,   // Small laptops
      xl: 1280,   // Desktops
      xxl: 1536,  // Large desktops
    } as any,
  },
  shape: {
    borderRadius: 8, // Slightly smaller for mobile
  },
  spacing: (factor: number) => `${0.5 * factor}rem`, // More flexible spacing
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          minHeight: 44, // Better touch target for mobile
          padding: '10px 20px',
          fontSize: 'clamp(0.875rem, 0.5vw + 0.75rem, 0.9375rem)',
          fontWeight: 600,
          textTransform: 'none' as const,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '@media (max-width: 640px)': {
            padding: '12px 16px',
            minHeight: 48, // Larger touch target on mobile
          },
        },
        contained: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        outlined: {
          borderWidth: '1.5px',
          '&:hover': {
            borderWidth: '1.5px',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: 'rgba(37, 99, 235, 0.04)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '@media (hover: hover)': {
            '&:hover': {
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              transform: 'translateY(-1px)',
            },
          },
          '@media (max-width: 640px)': {
            borderRadius: 8,
            margin: '0 4px',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundImage: 'none',
          '@media (max-width: 640px)': {
            borderRadius: 8,
          },
        },
        elevation1: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        },
        elevation4: {
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            minHeight: 44, // Better touch target
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            '@media (max-width: 640px)': {
              minHeight: 48,
            },
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '1.5px',
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px',
              },
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: 'clamp(0.875rem, 0.5vw + 0.75rem, 1rem)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
          backdropFilter: 'blur(20px)',
          '@media (max-width: 640px)': {
            paddingLeft: 8,
            paddingRight: 8,
          },
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '64px !important',
          '@media (max-width: 640px)': {
            minHeight: '56px !important',
            paddingLeft: 8,
            paddingRight: 8,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: 'clamp(0.75rem, 0.25vw + 0.6875rem, 0.8125rem)',
          height: 'auto',
          minHeight: 28,
          '@media (max-width: 640px)': {
            minHeight: 32,
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: '0 12px 12px 0',
          '@media (max-width: 640px)': {
            borderRadius: 0,
            width: '85vw !important',
            maxWidth: '320px',
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          borderTop: `1px solid rgba(0,0,0,0.08)`,
          backdropFilter: 'blur(20px)',
          height: 64,
          '@media (max-width: 640px)': {
            height: 72,
            paddingBottom: 'env(safe-area-inset-bottom)',
          },
        },
      },
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          '@media (max-width: 640px)': {
            paddingLeft: 16,
            paddingRight: 16,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 12,
          '@media (max-width: 640px)': {
            borderRadius: '12px 12px 0 0',
            margin: 8,
            width: 'calc(100% - 16px)',
            maxHeight: 'calc(100% - 16px)',
          },
        },
      },
    },
    MuiSnackbar: {
      styleOverrides: {
        root: {
          '@media (max-width: 640px)': {
            left: 8,
            right: 8,
            bottom: 'calc(8px + env(safe-area-inset-bottom))',
          },
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 48,
          fontSize: 'clamp(0.875rem, 0.5vw + 0.75rem, 0.9375rem)',
          fontWeight: 500,
          textTransform: 'none' as const,
          '@media (max-width: 640px)': {
            minHeight: 52,
            minWidth: 'auto',
            padding: '12px 8px',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '@media (max-width: 640px)': {
            padding: 12,
          },
        },
      },
    },
  },
});

export const lightTheme = createTheme(getDesignTokens('light'));
export const darkTheme = createTheme(getDesignTokens('dark'));

// Default theme (light)
export const theme = lightTheme;

// Theme context for switching between light and dark modes
export { ThemeProvider };
