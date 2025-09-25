import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Alert,
  Snackbar,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Stack,
  Divider,
  Fab,
  Slide,
  Fade
} from '@mui/material';
import {
  Add as AddIcon,
  Cookie as CookieIcon,
  Refresh as RefreshIcon,
  Upload as UploadIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Security as SecurityIcon,
  Schedule as ScheduleIcon,
  Public as PublicIcon
} from '@mui/icons-material';
import { cookiesAPI } from '../services/api';
import type { CookieBundle, Cookie } from '../types';

const CookieManager: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [cookieBundles, setCookieBundles] = useState<CookieBundle[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [cookieData, setCookieData] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  useEffect(() => {
    fetchCookieBundles();
  }, []);

  const fetchCookieBundles = async () => {
    try {
      setLoading(true);
      const response = await cookiesAPI.listBundles();
      setCookieBundles(response.data);
    } catch (error) {
      console.error('Error fetching cookie bundles:', error);
      setError('Failed to fetch cookie bundles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCookie = async () => {
    try {
      // Parse the cookieData string into Cookie objects
      let cookies: Cookie[];
      try {
        cookies = JSON.parse(cookieData);
        if (!Array.isArray(cookies)) {
          throw new Error('Cookie data must be an array');
        }
      } catch (e) {
        setError('Invalid cookie data format. Must be a JSON array of cookies.');
        return;
      }

      // Insert the cookies and track the insertion
      await cookiesAPI.insertCookies(selectedWebsite, cookies);
      await cookiesAPI.trackInsertion(selectedWebsite, true);
      
      setOpen(false);
      setSelectedWebsite('');
      setCookieData('');
      fetchCookieBundles();
    } catch (error) {
      console.error('Error adding cookies:', error);
      setError('Failed to add cookies');
      // Track failed insertion
      try {
        await cookiesAPI.trackInsertion(selectedWebsite, false);
      } catch (e) {
        console.error('Failed to track cookie insertion:', e);
      }
    }
  };

  // Render cookie bundles as cards (mobile-first)
  const renderCookieCards = () => (
    <Grid container spacing={{ xs: 2, md: 3 }}>
      {cookieBundles.map((bundle, idx) => (
        <Grid item xs={12} sm={6} lg={4} key={(bundle as any)._id || (bundle as any).id || idx}>
          <Fade in timeout={300 + idx * 100}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Stack spacing={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <CookieIcon color="primary" />
                    <Typography variant="h6" component="h2" noWrap>
                      Cookie Bundle
                    </Typography>
                  </Box>
                  
                  <Divider />
                  
                  <Stack spacing={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <ScheduleIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {new Date(bundle.uploadedAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <SecurityIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary">
                        {bundle.cookies.length} cookies
                      </Typography>
                    </Box>
                    
                    <Box display="flex" alignItems="center" gap={1}>
                      <PublicIcon fontSize="small" color="action" />
                      <Typography variant="body2" color="text.secondary" noWrap>
                        By {bundle.uploadedBy}
                      </Typography>
                    </Box>
                  </Stack>
                  
                  <Chip
                    label={`${bundle.cookies.length} Cookies`}
                    color="primary"
                    variant="outlined"
                    size="small"
                  />
                </Stack>
              </CardContent>
              
              <CardActions>
                <Tooltip title="View Details">
                  <IconButton size="small" color="primary">
                    <ViewIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download">
                  <IconButton size="small" color="secondary">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Fade>
        </Grid>
      ))}
    </Grid>
  );

  // Render cookie bundles as table (desktop)
  const renderCookieTable = () => (
    <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Upload Date</TableCell>
            <TableCell>Cookie Count</TableCell>
            <TableCell>Uploaded By</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cookieBundles.map((bundle, idx) => (
            <TableRow 
              key={(bundle as any)._id || (bundle as any).id || idx}
              sx={{ '&:hover': { bgcolor: 'action.hover' } }}
            >
              <TableCell>
                {new Date(bundle.uploadedAt).toLocaleString()}
              </TableCell>
              <TableCell>
                <Chip
                  label={bundle.cookies.length}
                  color="primary"
                  variant="outlined"
                  size="small"
                />
              </TableCell>
              <TableCell>{bundle.uploadedBy}</TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Tooltip title="View Details">
                    <IconButton size="small" color="primary">
                      <ViewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Download">
                    <IconButton size="small" color="secondary">
                      <DownloadIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Header Section */}
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        justifyContent="space-between"
        alignItems={{ xs: 'stretch', sm: 'center' }}
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography 
            variant="h4" 
            component="h1" 
            gutterBottom
            sx={{ 
              fontWeight: 800,
              background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Cookie Manager
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage and organize your cookie bundles
          </Typography>
        </Box>
        
        <Stack direction="row" spacing={1} alignItems="center">
          {!isMobile && (
            <Tooltip title={`Switch to ${viewMode === 'cards' ? 'table' : 'cards'} view`}>
              <IconButton
                onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                color="primary"
              >
                {viewMode === 'cards' ? <ViewIcon /> : <CookieIcon />}
              </IconButton>
            </Tooltip>
          )}
          
          <Tooltip title="Refresh">
            <IconButton onClick={fetchCookieBundles} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
            sx={{ minWidth: { xs: 'auto', sm: 'auto' } }}
          >
            {isMobile ? 'Add' : 'Add Cookies'}
          </Button>
        </Stack>
      </Stack>

      {/* Content Section */}
      {loading ? (
        <Grid container spacing={2}>
          {[...Array(6)].map((_, idx) => (
            <Grid item xs={12} sm={6} lg={4} key={idx}>
              <Card sx={{ height: 200 }}>
                <CardContent>
                  <Box className="loading-shimmer" sx={{ height: '100%', borderRadius: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : cookieBundles.length === 0 ? (
        <Paper
          sx={{
            p: 4,
            textAlign: 'center',
            bgcolor: 'background.paper',
            borderRadius: 2,
          }}
        >
          <CookieIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Cookie Bundles Found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Get started by adding your first cookie bundle
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpen(true)}
          >
            Add Your First Cookies
          </Button>
        </Paper>
      ) : (
        <>
          {isMobile || viewMode === 'cards' ? renderCookieCards() : renderCookieTable()}
        </>
      )}

      {/* Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add cookies"
          onClick={() => setOpen(true)}
          sx={{
            position: 'fixed',
            bottom: { xs: 80, sm: 16 }, // Account for bottom navigation
            right: 16,
            zIndex: 1000,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Enhanced Dialog for Adding Cookies */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        maxWidth="md" 
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={isMobile ? Slide : undefined}
        TransitionProps={isMobile ? { direction: 'up' } as any : undefined}
        PaperProps={{
          sx: {
            borderRadius: isMobile ? 0 : 2,
            m: isMobile ? 0 : 2,
          }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          pb: 1
        }}>
          <UploadIcon color="primary" />
          <Typography variant="h6" component="span">
            Add New Cookies
          </Typography>
        </DialogTitle>
        
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Website URL"
              placeholder="e.g., chatgpt.com, openai.com, example.com"
              value={selectedWebsite}
              onChange={(e) => setSelectedWebsite(e.target.value)}
              InputProps={{
                startAdornment: (
                  <Box sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                    <PublicIcon color="action" fontSize="small" />
                  </Box>
                ),
              }}
              helperText="Enter the website domain (without http:// or https://)"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
            
            <TextField
              fullWidth
              label="Cookie Data (JSON Array)"
              multiline
              rows={isMobile ? 6 : 8}
              value={cookieData}
              onChange={(e) => setCookieData(e.target.value)}
              placeholder={`[
  {
    "name": "session_id",
    "value": "abc123",
    "domain": ".example.com",
    "path": "/",
    "secure": true,
    "httpOnly": true,
    "sameSite": "Lax"
  }
]`}
              helperText="Enter a JSON array of cookie objects with properties: name, value, domain, path, secure, httpOnly, sameSite, expirationDate"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  fontFamily: 'monospace',
                }
              }}
            />
            
            {/* Helper Information */}
            <Paper 
              sx={{ 
                p: 2, 
                bgcolor: 'info.main', 
                color: 'info.contrastText',
                borderRadius: 2
              }}
            >
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <SecurityIcon fontSize="small" />
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Cookie Format Tips
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    • Use valid JSON array format<br/>
                    • Include required fields: name, value, domain<br/>
                    • Optional: path, secure, httpOnly, sameSite, expirationDate
                  </Typography>
                </Box>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        
        <DialogActions sx={{ p: 3, pt: 2 }}>
          <Button 
            onClick={() => setOpen(false)}
            sx={{ minWidth: 100 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAddCookie} 
            variant="contained" 
            startIcon={<AddIcon />}
            disabled={!selectedWebsite.trim() || !cookieData.trim()}
            sx={{ minWidth: 120 }}
          >
            Add Cookies
          </Button>
        </DialogActions>
      </Dialog>

      {/* Enhanced Snackbar for Mobile */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ 
          vertical: 'bottom', 
          horizontal: 'center' 
        }}
        TransitionComponent={isMobile ? Slide : undefined}
        TransitionProps={isMobile ? { direction: 'up' } as any : undefined}
        sx={{
          bottom: isMobile ? 'calc(16px + env(safe-area-inset-bottom))' : 16,
          '& .MuiSnackbarContent-root': {
            minWidth: isMobile ? '90vw' : 'auto',
          }
        }}
      >
        <Alert 
          onClose={() => setError(null)} 
          severity="error"
          sx={{ 
            width: '100%',
            borderRadius: 2
          }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CookieManager;
