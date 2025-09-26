import React, { useEffect, useState } from 'react';
import {
  Container,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack,
  LinearProgress,
  Divider,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  Cookie as CookieIcon,
  Login as LoginIcon,
  Public as PublicIcon,
  Timeline as TimelineIcon,
  Refresh as RefreshIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { userAPI } from '../services/api';

interface UserStats {
  loginCount: number;
  lastLogin: string;
  cookiesInserted: number;
  websitesAccessed: number;
  recentActivity?: Array<{
    id: string;
    type: 'login' | 'cookie' | 'website';
    description: string;
    timestamp: string;
  }>;
  securityScore?: number;
  activeSession?: boolean;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const fetchStats = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await userAPI.getUserStats();
      const data = response.data as any; // Type assertion for API response
      setStats({
        loginCount: data.loginCount || 0,
        lastLogin: (data.lastLogin ? data.lastLogin.toString() : new Date().toISOString()),
        cookiesInserted: data.cookiesInserted || 0,
        websitesAccessed: data.websitesAccessed || 0,
        // Mock additional data for enhanced dashboard
        recentActivity: [
          {
            id: '1',
            type: 'login',
            description: 'Logged in from new device',
            timestamp: new Date().toISOString()
          },
          {
            id: '2', 
            type: 'cookie',
            description: 'Cookies inserted for chatgpt.com',
            timestamp: new Date(Date.now() - 3600000).toISOString()
          },
          {
            id: '3',
            type: 'website',
            description: 'Accessed ChatGPT Plus',
            timestamp: new Date(Date.now() - 7200000).toISOString()
          }
        ],
        securityScore: 95,
        activeSession: true
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    fetchStats(true);
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <LoginIcon />;
      case 'cookie': return <CookieIcon />;
      case 'website': return <PublicIcon />;
      default: return <TimelineIcon />;
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container 
      maxWidth="xl" 
      sx={{ 
        mt: isMobile ? 2 : 4, 
        mb: isMobile ? 10 : 4, // Extra bottom margin for mobile bottom nav
        px: isMobile ? 2 : 3 
      }}
    >
      {/* Header */}
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? 2 : 0
        }}
      >
        <Box>
          <Typography variant={isMobile ? "h5" : "h4"} gutterBottom>
            Welcome back! 👋
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Here's your activity overview
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {stats?.activeSession && (
            <Chip
              icon={<SecurityIcon />}
              label="Active Session"
              color="success"
              variant="outlined"
              size="small"
            />
          )}
          
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={handleRefresh} 
              disabled={refreshing}
              sx={{ 
                bgcolor: 'background.paper',
                boxShadow: 1,
                '&:hover': { boxShadow: 2 }
              }}
            >
              <RefreshIcon sx={{ 
                animation: refreshing ? 'spin 1s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' }
                }
              }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Stats Cards */}
        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <LoginIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Total Logins
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.loginCount || 0}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>
                      +12% this week
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'secondary.main' }}>
                  <CookieIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Cookies Inserted
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.cookiesInserted || 0}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>
                      +8% this week
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'info.main' }}>
                  <PublicIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Websites Accessed
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.websitesAccessed || 0}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <TrendingUpIcon color="success" fontSize="small" />
                    <Typography variant="caption" color="success.main" sx={{ ml: 0.5 }}>
                      +5% this week
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} lg={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <SecurityIcon />
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography color="text.secondary" gutterBottom variant="body2">
                    Security Score
                  </Typography>
                  <Typography variant="h4" component="div">
                    {stats?.securityScore || 0}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats?.securityScore || 0} 
                    sx={{ mt: 1, height: 6, borderRadius: 3 }}
                    color="success"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <TimelineIcon color="primary" />
                <Typography variant="h6" component="div">
                  Recent Activity
                </Typography>
              </Box>
              
              <List>
                {stats?.recentActivity?.map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    <ListItem sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'background.default' }}>
                          {getActivityIcon(activity.type)}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.description}
                        secondary={
                          <>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <ScheduleIcon fontSize="small" color="action" />
                              <span style={{ color: 'rgba(0,0,0,0.6)', fontSize: 12 }}>
                                {formatTimeAgo(activity.timestamp)}
                              </span>
                            </span>
                          </>
                        }
                      />
                    </ListItem>
                    {index < (stats?.recentActivity?.length || 1) - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Quick Overview
              </Typography>
              
              <Stack spacing={2}>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Last Login
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {stats?.lastLogin ? new Date(stats.lastLogin).toLocaleDateString() : 'Never'}
                  </Typography>
                </Box>
                
                <Divider />
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Session Status
                  </Typography>
                  <Chip 
                    label={stats?.activeSession ? "Active" : "Inactive"}
                    color={stats?.activeSession ? "success" : "default"}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
                
                <Divider />
                
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Account Type
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    Premium User
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;