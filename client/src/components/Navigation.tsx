import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Avatar,
  Menu,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  useTheme,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Cookie as CookieIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  AdminPanelSettings as AdminIcon,
  People as PeopleIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon
} from '@mui/icons-material';
import { authAPI } from '../services/api';
import { useTheme as useCustomTheme } from '../contexts/ThemeContext';

interface NavigationProps {
  userInfo: { username: string; isAdmin: boolean } | null;
}

const Navigation: React.FC<NavigationProps> = ({ userInfo }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const { mode, toggleTheme } = useCustomTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    authAPI.logout();
    handleMenuClose();
  };

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Cookies', path: '/cookies', icon: <CookieIcon /> },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
    ...(userInfo?.isAdmin ? [
      { label: 'Users', path: '/users', icon: <PeopleIcon /> }
    ] : []),
  ];

  // Mobile Bottom Navigation
  if (isMobile) {
    const currentIndex = navItems.findIndex(item => item.path === location.pathname);
    
    return (
      <>
        {/* Top App Bar for Mobile */}
        <AppBar position="fixed" elevation={0}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
              ChatGPT Manager
            </Typography>
            
            <IconButton
              color="inherit"
              onClick={toggleTheme}
              sx={{ mr: 1 }}
            >
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={handleMenuOpen}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {userInfo?.username.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Toolbar>
        </AppBar>
        
        {/* Add top spacing for fixed AppBar */}
        <Toolbar />
        
        {/* Bottom Navigation for Mobile */}
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: 1000,
            borderTop: 1,
            borderColor: 'divider'
          }} 
          elevation={8}
        >
          <BottomNavigation
            value={currentIndex === -1 ? false : currentIndex}
            onChange={(_event, newValue) => {
              if (newValue !== false && navItems[newValue]) {
                navigate(navItems[newValue].path);
              }
            }}
            showLabels
          >
            {navItems.map((item) => (
              <BottomNavigationAction
                key={item.path}
                label={item.label}
                icon={item.icon}
                sx={{
                  '&.Mui-selected': {
                    color: 'primary.main',
                  },
                }}
              />
            ))}
          </BottomNavigation>
        </Paper>
        
        {/* User Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem disabled>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {userInfo?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {userInfo?.isAdmin ? 'Administrator' : 'User'}
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
            <SettingsIcon sx={{ mr: 2 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <LogoutIcon sx={{ mr: 2 }} />
            Logout
          </MenuItem>
        </Menu>
      </>
    );
  }

  // Desktop Navigation
  return (
    <AppBar position="static" elevation={0}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
            ChatGPT Manager
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          {navItems.map((item) => (
            <Button
              key={item.path}
              startIcon={item.icon}
              onClick={() => navigate(item.path)}
              sx={{
                color: 'white',
                bgcolor: isActive(item.path) ? 'rgba(255,255,255,0.15)' : 'transparent',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                borderRadius: 2,
                px: 2,
                py: 1,
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            color="inherit"
            onClick={toggleTheme}
            sx={{ color: 'white' }}
          >
            {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
          
          {userInfo?.isAdmin && (
            <Chip
              icon={<AdminIcon />}
              label="Admin"
              color="secondary"
              size="small"
              sx={{ color: 'white' }}
            />
          )}
          
          <Tooltip title="Account settings">
            <IconButton onClick={handleMenuOpen} sx={{ color: 'white' }}>
              <Avatar sx={{ bgcolor: 'secondary.main' }}>
                {userInfo?.username.charAt(0).toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <MenuItem disabled>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {userInfo?.username}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {userInfo?.isAdmin ? 'Administrator' : 'User'}
              </Typography>
            </Box>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => { navigate('/settings'); handleMenuClose(); }}>
            <SettingsIcon sx={{ mr: 2 }} />
            Settings
          </MenuItem>
          <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
            <LogoutIcon sx={{ mr: 2 }} />
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
