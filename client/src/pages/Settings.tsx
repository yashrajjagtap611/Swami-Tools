import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Divider,
  Alert,
  Button,
  CircularProgress,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Security as SecurityIcon,
  Cookie as CookieIcon,
  Save as SaveIcon,
  Add as AddIcon,
  Upload as UploadIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  Web as WebIcon
} from '@mui/icons-material';
import { userAPI } from '../services/api';
import { WebsitePermission, Cookie } from '../types';



const Settings: React.FC = () => {
  const [permissions, setPermissions] = useState<WebsitePermission[]>([]);
  // Session timeout removed
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [newWebsite, setNewWebsite] = useState('');
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [cookieFile, setCookieFile] = useState<File | null>(null);
  const [cookieData, setCookieData] = useState<Cookie[]>([]);

  useEffect(() => {
    fetchPermissions();
    loadSessionInfo();
  }, []);
  
  const loadSessionInfo = () => {};

  const fetchPermissions = async () => {
    try {
      const response = await userAPI.getWebsitePermissions();
      setPermissions(response.data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  };

  // handlePermissionChange not used in current UI; removed to satisfy TS

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      await userAPI.updatePermissions(permissions);
      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddWebsite = async () => {
    if (!newWebsite.trim()) {
      setMessage({ type: 'error', text: 'Website URL is required' });
      return;
    }

    try {
      await userAPI.addWebsitePermission(newWebsite.trim());
      setMessage({ type: 'success', text: 'Website added successfully' });
      setAddDialogOpen(false);
      setNewWebsite('');
      fetchPermissions();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to add website' });
    }
  };

  const handleRemoveWebsite = async (website: string) => {
    try {
      await userAPI.removeWebsitePermission(website);
      setMessage({ type: 'success', text: 'Website removed successfully' });
      fetchPermissions();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to remove website' });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCookieFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = e.target?.result as string;
        const parsed = JSON.parse(result);

        // Support both formats:
        // 1) Top-level array of cookies
        // 2) Object with a `cookies` array property
        const cookies: any[] = Array.isArray(parsed)
          ? parsed
          : (parsed && Array.isArray(parsed.cookies) ? parsed.cookies : []);

        if (cookies.length > 0) {
          setCookieData(cookies as any);
          setMessage({ type: 'success', text: `Loaded ${cookies.length} cookies` });
        } else {
          throw new Error('Cookie file must contain an array or a `cookies` array');
        }
      } catch (error) {
        setMessage({ type: 'error', text: 'Invalid cookie file format. Must be valid JSON array.' });
        setCookieData([]);
      }
    };
    reader.readAsText(file);
  };

  const handleUploadCookies = async () => {
    if (!selectedWebsite || cookieData.length === 0) {
      setMessage({ type: 'error', text: 'Please select website and upload valid cookies' });
      return;
    }

    try {
      await userAPI.uploadWebsiteCookies(selectedWebsite, cookieData);
      setMessage({ type: 'success', text: 'Cookies uploaded successfully' });
      setUploadDialogOpen(false);
      setCookieFile(null);
      setCookieData([]);
      setSelectedWebsite('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to upload cookies' });
    }
  };



  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SettingsIcon color="primary" />
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account preferences and website access permissions
        </Typography>
      </Box>

      {message && (
        <Alert 
          severity={message.type} 
          sx={{ mb: 3 }}
          onClose={() => setMessage(null)}
        >
          {message.text}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <UploadIcon color="primary" />
              Quick Actions
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setAddDialogOpen(true)}
                  fullWidth
                  sx={{ height: 56 }}
                >
                  Add Website
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<UploadIcon />}
                  onClick={() => setUploadDialogOpen(true)}
                  fullWidth
                  sx={{ height: 56 }}
                >
                  Upload Cookies
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving}
                  fullWidth
                  sx={{ height: 56 }}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Button
                  variant="outlined"
                  startIcon={<SecurityIcon />}
                  fullWidth
                  sx={{ height: 56 }}
                  disabled
                >
                  Security Check
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Website Permissions */}
        <Grid item xs={12} md={8}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <SecurityIcon color="primary" />
              <Typography variant="h6">
                Website Access Permissions
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Control which websites can access your cookie data and preferences
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Website</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last Accessed</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {permissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        <Typography color="text.secondary">
                          No websites added yet. Click "Add Website" to get started.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    permissions.map((permission, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <WebIcon color="primary" />
                            {permission.website}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={permission.hasAccess ? 'Allowed' : 'Denied'} 
                            color={permission.hasAccess ? 'success' : 'error'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {permission.lastAccessed 
                            ? new Date(permission.lastAccessed).toLocaleDateString()
                            : 'Never'
                          }
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => handleRemoveWebsite(permission.website)}
                            title="Remove Website"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>


          </Paper>
        </Grid>

        {/* Account Info */}
        <Grid item xs={12} md={4}>
          <Paper elevation={2} sx={{ p: 3, borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <CookieIcon color="primary" />
              <Typography variant="h6">
                Account Information
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Active Permissions
              </Typography>
              <Typography variant="h4" color="primary">
                {permissions.filter(p => p.hasAccess).length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                websites allowed
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Last Updated
              </Typography>
              <Typography variant="body2">
                {new Date().toLocaleDateString()}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
              These settings control how your cookie data is shared across different AI platforms. 
              Enable only the services you trust and actively use.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Add Website Dialog */}
      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Website Permission</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Website URL"
            placeholder="e.g., chatgpt.com or openai.com"
            value={newWebsite}
            onChange={(e) => setNewWebsite(e.target.value)}
            sx={{ mt: 1 }}
            helperText="Enter the domain name without http:// or https://"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddWebsite} variant="contained">Add Website</Button>
        </DialogActions>
      </Dialog>

      {/* Upload Cookies Dialog */}
      <Dialog open={uploadDialogOpen} onClose={() => {
        setUploadDialogOpen(false);
        setCookieFile(null);
        setCookieData([]);
        setSelectedWebsite('');
      }} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Cookies for Website</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              select
              fullWidth
              label="Select Website"
              value={selectedWebsite}
              onChange={(e) => setSelectedWebsite(e.target.value)}
              SelectProps={{ native: true }}
            >
              <option value="">Choose a website...</option>
              {permissions.filter(p => p.hasAccess).map((permission, index) => (
                <option key={index} value={permission.website}>
                  {permission.website}
                </option>
              ))}
            </TextField>
            
            <Box>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="cookie-upload"
              />
              <label htmlFor="cookie-upload">
                <Button
                  variant="outlined"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  fullWidth
                >
                  {cookieFile ? cookieFile.name : 'Choose Cookie File (.json)'}
                </Button>
              </label>
            </Box>
            
            {cookieData.length > 0 && (
              <Alert severity="info">
                Found {cookieData.length} cookies in the uploaded file
              </Alert>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setUploadDialogOpen(false);
            setCookieFile(null);
            setCookieData([]);
            setSelectedWebsite('');
          }}>Cancel</Button>
          <Button 
            onClick={handleUploadCookies} 
            variant="contained"
            disabled={!selectedWebsite || cookieData.length === 0}
          >
            Upload Cookies
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Settings;
