import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Switch,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Checkbox,
  List,
  ListItem,
  Stack,
  Tooltip,
  useTheme,
  useMediaQuery,
  Card,
  CardContent,
  Grid,
  Divider,
  Avatar
} from '@mui/material';
import {
  People as PeopleIcon,
  Add as AddIcon,
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Lock as LockIcon,
  Schedule as ScheduleIcon,
  Web as WebIcon,
  WhatsApp as WhatsAppIcon,
  Phone as PhoneIcon,
  CalendarToday as CalendarIcon,
  Login as LoginIcon
} from '@mui/icons-material';
import { userAPI } from '../services/api';
import { config } from '../config/env';

interface User {
  _id: string;
  username: string;
  email?: string;
  isAdmin: boolean;
  isActive: boolean;
  expiryDate?: string;
  loginCount: number;
  lastLogin?: string;
  createdAt: string;
  websitePermissions?: Array<{
    website: string;
    hasAccess: boolean;
    lastAccessed?: string;
    approvedBy?: string;
  }>;
}

const Users: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [expiryDialogOpen, setExpiryDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ username: '', password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [websiteDialogOpen, setWebsiteDialogOpen] = useState(false);
  const [userWebsites, setUserWebsites] = useState<string[]>([]);
  const [availableWebsites, setAvailableWebsites] = useState<string[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const allSelected = users.length > 0 && selectedUserIds.length === users.length;
  const someSelected = selectedUserIds.length > 0 && selectedUserIds.length < users.length;
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneById, setPhoneById] = useState<Record<string, string>>({});
  

  const normalizeDomain = (raw: string): string => {
    if (!raw) return '';
    try {
      let input = raw.trim();
      // If user typed just domain (no protocol), prepend for URL parsing
      if (!/^https?:\/\//i.test(input)) {
        input = `https://${input}`;
      }
      const url = new URL(input);
      let host = url.host.toLowerCase();
      // Remove leading www.
      if (host.startsWith('www.')) host = host.slice(4);
      // Remove trailing slash from pathname when it represents domain root only
      return host;
    } catch {
      // Fallback basic cleanup: remove protocol and trailing slashes
      return raw
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/$/, '')
        .toLowerCase()
        .trim();
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchAvailableWebsites();
  }, []);

  const fetchAvailableWebsites = async () => {
    try {
      const response = await userAPI.getWebsitePermissions();
      const websites = new Set<string>();
      (response.data || []).forEach((perm: any) => {
        const normalized = normalizeDomain(perm.website);
        if (normalized) websites.add(normalized);
      });
      setAvailableWebsites(Array.from(websites).sort());
    } catch (error) {
      console.error('Error fetching available websites:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userAPI.getAdminUsers();
      setUsers(response.data);
      setSelectedUserIds([]);
      // Load saved phone numbers for these users
      const map: Record<string, string> = {};
      (response.data || []).forEach((u: any) => {
        const key = `user_phone_${u._id}`;
        const val = localStorage.getItem(key) || '';
        if (val) map[u._id] = val;
      });
      setPhoneById(map);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredUsers = users.filter(u => {
    if (!normalizedSearch) return true;
    const username = (u?.username || '').toLowerCase();
    const email = (u?.email || '').toLowerCase();
    return username.includes(normalizedSearch) || email.includes(normalizedSearch);
  });

  const handleWhatsApp = (user: User) => {
    try {
      const digits = (phoneById[user._id] || '').replace(/\D+/g, '');
      if (!digits) {
        alert('Add a mobile number first in the Mobile column.');
        return;
      }
      const url = `https://wa.me/${digits}?text=${encodeURIComponent('Hello ' + user.username)}`;
      window.open(url, '_blank');
    } catch {}
  };

  const handlePhoneChange = (userId: string, val: string) => {
    const digits = val.replace(/\D+/g, '');
    setPhoneById(prev => ({ ...prev, [userId]: digits }));
    localStorage.setItem(`user_phone_${userId}`, digits);
  };

  const handleSavePhone = async (user: User) => {
    try {
      const full = (phoneById[user._id] || '').replace(/\D+/g, '');
      if (!full) return;
      // Split into country code (assume up to 3 digits) and subscriber number (rest)
      // If starts with country code 1-3 digits, store accordingly; default assume first 2 digits country code if length > 10
      let cc = '';
      let number = full;
      if (full.length > 10) {
        cc = full.slice(0, full.length - 10);
        number = full.slice(-10);
      }
      await userAPI.updateUserPhone(user._id, cc, number);
      setMessage({ type: 'success', text: 'Phone saved' });
    } catch (e: any) {
      setMessage({ type: 'error', text: e?.response?.data?.message || 'Failed to save phone' });
    }
  };

  const handleSelectAll = (_: any, checked: boolean) => {
    if (checked) {
      setSelectedUserIds(users.map(u => u._id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectRow = (userId: string, checked: boolean) => {
    setSelectedUserIds(prev => checked ? Array.from(new Set([...prev, userId])) : prev.filter(id => id !== userId));
  };

  const handleBulkStatusChange = async (isActive: boolean) => {
    if (selectedUserIds.length === 0) return;
    try {
      const response = await fetch(`${config.apiUrl}/users/admin/users/status-bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userIds: selectedUserIds, isActive })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Bulk update failed');
      setMessage({ type: 'success', text: result.message || `Users ${isActive ? 'activated' : 'deactivated'} successfully` });
      await fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update users' });
    }
  };

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      await userAPI.updateUserStatus(userId, !isActive);
      setMessage({ 
        type: 'success', 
        text: `User ${!isActive ? 'activated' : 'deactivated'} successfully` 
      });
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update user status' });
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.username || !newUser.password) {
      setMessage({ type: 'error', text: 'Username and password are required' });
      return;
    }

    try {
      const response = await fetch(`${config.apiUrl}/auth/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          username: newUser.username,
          password: newUser.password
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }
      
      setMessage({ type: 'success', text: 'User created successfully' });
      setCreateDialogOpen(false);
      setNewUser({ username: '', password: '' });
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to create user' });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      await userAPI.changeUserPassword(selectedUser!._id, newPassword);
      setMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to change password' });
    }
  };

  const handleSetExpiry = async () => {
    try {
      await userAPI.setUserExpiry(selectedUser!._id, expiryDate || null);
      setMessage({ type: 'success', text: expiryDate ? 'Expiry date set successfully' : 'Expiry date removed successfully' });
      setExpiryDialogOpen(false);
      setExpiryDate('');
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to set expiry date' });
    }
  };

  const isUserExpired = (user: User) => {
    return user.expiryDate && new Date() > new Date(user.expiryDate);
  };

  const getUserStatus = (user: User) => {
    if (!user.isActive) return { label: 'Inactive', color: 'error' as const };
    if (isUserExpired(user)) return { label: 'Expired', color: 'warning' as const };
    return { label: 'Active', color: 'success' as const };
  };

  const handleManageWebsites = (user: User) => {
    setSelectedUser(user);
    const currentWebsites = user.websitePermissions?.filter(p => p.hasAccess).map(p => normalizeDomain(p.website)) || [];
    // Only keep websites that are in availableWebsites
    const allowedSet = new Set(availableWebsites.map(normalizeDomain));
    const filtered = Array.from(new Set(currentWebsites.filter(w => allowedSet.has(normalizeDomain(w)))));
    setUserWebsites(filtered);
    
    setWebsiteDialogOpen(true);
  };

  const handleWebsiteToggle = (website: string) => {
    const normalized = normalizeDomain(website);
    if (!normalized) return;
    setUserWebsites(prev =>
      prev.includes(normalized)
        ? prev.filter(w => w !== normalized)
        : [...prev, normalized]
    );
  };

  // Removed adding new websites here to ensure only available websites are shown

  const handleSaveWebsites = async () => {
    if (!selectedUser) return;

    try {
      const permissions = Array.from(new Set(availableWebsites.map(normalizeDomain)))
        .filter(Boolean)
        .map(website => ({
          website,
          hasAccess: userWebsites.includes(website),
          lastAccessed: new Date().toISOString(),
          approvedBy: 'Admin'
        }));

      await userAPI.updateUserWebsitePermissions(selectedUser._id, permissions);
      setMessage({ type: 'success', text: 'Website permissions updated successfully' });
      setWebsiteDialogOpen(false);
      fetchUsers();
      fetchAvailableWebsites();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update permissions' });
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
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PeopleIcon color="primary" />
            User Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage system users and their permissions • {filteredUsers.length}/{users.length}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField 
            size="small"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            variant="outlined"
            color="success"
            disabled={selectedUserIds.length === 0}
            onClick={() => handleBulkStatusChange(true)}
          >
            Activate Selected
          </Button>
          <Button
            variant="outlined"
            color="error"
            disabled={selectedUserIds.length === 0}
            onClick={() => handleBulkStatusChange(false)}
          >
            Deactivate Selected
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create User
          </Button>
        </Box>
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

      <Paper elevation={2} sx={{ borderRadius: 3 }}>
        <Box sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            All Users ({filteredUsers.length}/{users.length})
          </Typography>
          
          {isMobile ? (
            // Mobile Card Layout
            <Grid container spacing={2}>
              {filteredUsers.length === 0 ? (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                    <Typography color="text.secondary">
                      No users found
                    </Typography>
                  </Box>
                </Grid>
              ) : (
                filteredUsers.map((user, idx) => (
                  <Grid item xs={12} key={user._id}>
                    <Card sx={{ borderRadius: 2 }}>
                      <CardContent>
                        <Stack spacing={2}>
                          {/* Header */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Checkbox
                                checked={selectedUserIds.includes(user._id)}
                                onChange={(e) => handleSelectRow(user._id, e.target.checked)}
                                size="small"
                              />
                              <Avatar sx={{ width: 32, height: 32, bgcolor: user.isAdmin ? 'primary.main' : 'grey.400' }}>
                                {user.isAdmin ? <AdminIcon fontSize="small" /> : <UserIcon fontSize="small" />}
                              </Avatar>
                              <Box>
                                <Typography variant="subtitle1" fontWeight={600}>
                                  {user.username}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  #{idx + 1}
                                </Typography>
                              </Box>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip 
                                label={user.isAdmin ? 'Admin' : 'User'} 
                                color={user.isAdmin ? 'primary' : 'default'}
                                size="small"
                              />
                              <Chip 
                                label={getUserStatus(user).label}
                                color={getUserStatus(user).color}
                                size="small"
                              />
                            </Box>
                          </Box>

                          <Divider />

                          {/* Details */}
                          <Grid container spacing={2}>
                            <Grid item xs={6}>
                              <Stack spacing={1}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CalendarIcon fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    Expiry: {user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : 'No expiry'}
                                  </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <LoginIcon fontSize="small" color="action" />
                                  <Typography variant="body2" color="text.secondary">
                                    Logins: {user.loginCount || 0}
                                  </Typography>
                                </Box>
                              </Stack>
                            </Grid>
                            <Grid item xs={6}>
                              <Stack spacing={1}>
                                <Typography variant="body2" color="text.secondary">
                                  Last Login: {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <PhoneIcon fontSize="small" color="action" />
                                  <TextField 
                                    size="small"
                                    placeholder="Phone"
                                    value={phoneById[user._id] || ''}
                                    onChange={(e) => handlePhoneChange(user._id, e.target.value)}
                                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                    sx={{ flexGrow: 1 }}
                                  />
                                  <Button variant="outlined" size="small" onClick={() => handleSavePhone(user)}>
                                    Save
                                  </Button>
                                </Box>
                              </Stack>
                            </Grid>
                          </Grid>

                          {/* Websites */}
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              Websites:
                            </Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {(() => {
                                const permitted = user.websitePermissions?.filter(p => p.hasAccess) ?? [];
                                return permitted.slice(0, 3).map((perm, idx) => (
                                  <Chip key={idx} label={perm.website} size="small" variant="outlined" />
                                ));
                              })()}
                              {(() => {
                                const count = (user.websitePermissions?.filter(p => p.hasAccess)?.length ?? 0);
                                return count > 3 ? (
                                  <Chip label={`+${count - 3}`} size="small" />
                                ) : null;
                              })()}
                              {(!user.websitePermissions || (user.websitePermissions.filter(p => p.hasAccess).length === 0)) && (
                                <Chip label="None" size="small" color="error" />
                              )}
                            </Box>
                          </Box>

                          <Divider />

                          {/* Actions */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Active:
                              </Typography>
                              <Switch
                                checked={user.isActive}
                                onChange={() => handleToggleUserStatus(user._id, user.isActive)}
                                color="primary"
                                size="small"
                              />
                            </Box>
                            <Stack direction="row" spacing={1}>
                              <Tooltip title="Chat on WhatsApp">
                                <IconButton 
                                  size="small"
                                  onClick={() => handleWhatsApp(user)}
                                  color="success"
                                >
                                  <WhatsAppIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Change Password">
                                <IconButton 
                                  size="small" 
                                  onClick={() => { setSelectedUser(user); setPasswordDialogOpen(true); }}
                                >
                                  <LockIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Set Expiry Date">
                                <IconButton 
                                  size="small" 
                                  onClick={() => { 
                                    setSelectedUser(user); 
                                    setExpiryDate(user.expiryDate ? user.expiryDate.split('T')[0] : '');
                                    setExpiryDialogOpen(true); 
                                  }}
                                >
                                  <ScheduleIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Manage Websites">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleManageWebsites(user)}
                                >
                                  <WebIcon />
                                </IconButton>
                              </Tooltip>
                            </Stack>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))
              )}
            </Grid>
          ) : (
            // Desktop Table Layout
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell padding="checkbox">
                      <Checkbox
                        indeterminate={someSelected}
                        checked={allSelected}
                        onChange={(e) => handleSelectAll(e, e.target.checked)}
                      />
                    </TableCell>
                    <TableCell>#</TableCell>
                    <TableCell>Username</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell>Login Count</TableCell>
                    <TableCell>Last Login</TableCell>
                    <TableCell>Mobile</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} align="center">
                        <Box sx={{ py: 4 }}>
                          <PeopleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                          <Typography color="text.secondary">
                            No users found
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user, idx) => (
                      <TableRow key={user._id} hover>
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedUserIds.includes(user._id)}
                            onChange={(e) => handleSelectRow(user._id, e.target.checked)}
                          />
                        </TableCell>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {user.isAdmin ? <AdminIcon color="primary" fontSize="small" /> : <UserIcon fontSize="small" />}
                            <Typography variant="body2" fontWeight={500}>
                              {user.username}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={user.isAdmin ? 'Admin' : 'User'} 
                            color={user.isAdmin ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={getUserStatus(user).label}
                            color={getUserStatus(user).color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.expiryDate 
                              ? new Date(user.expiryDate).toLocaleDateString()
                              : 'No expiry'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.loginCount || 0}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {user.lastLogin 
                              ? new Date(user.lastLogin).toLocaleDateString()
                              : 'Never'
                            }
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', minWidth: 200 }}>
                            <TextField 
                              size="small"
                              placeholder="e.g., 15551234567"
                              value={phoneById[user._id] || ''}
                              onChange={(e) => handlePhoneChange(user._id, e.target.value)}
                              inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                              sx={{ flexGrow: 1 }}
                            />
                            <Button variant="outlined" size="small" onClick={() => handleSavePhone(user)}>
                              Save
                            </Button>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={0.5}>
                            <Tooltip title={`Active: ${user.isActive ? 'Yes' : 'No'}`}>
                              <Switch
                                checked={user.isActive}
                                onChange={() => handleToggleUserStatus(user._id, user.isActive)}
                                color="primary"
                                size="small"
                              />
                            </Tooltip>
                            <Tooltip title="Chat on WhatsApp">
                              <IconButton 
                                size="small"
                                onClick={() => handleWhatsApp(user)}
                                color="success"
                              >
                                <WhatsAppIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Change Password">
                              <IconButton 
                                size="small" 
                                onClick={() => { setSelectedUser(user); setPasswordDialogOpen(true); }}
                              >
                                <LockIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Set Expiry Date">
                              <IconButton 
                                size="small" 
                                onClick={() => { 
                                  setSelectedUser(user); 
                                  setExpiryDate(user.expiryDate ? user.expiryDate.split('T')[0] : '');
                                  setExpiryDialogOpen(true); 
                                }}
                              >
                                <ScheduleIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Manage Websites">
                              <IconButton 
                                size="small" 
                                onClick={() => handleManageWebsites(user)}
                              >
                                <WebIcon />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      </Paper>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Username"
              value={newUser.username}
              onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
            />
            <TextField
              fullWidth
              type="password"
              label="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreateUser} variant="contained">
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password - {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="password"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleChangePassword} variant="contained">
            Change Password
          </Button>
        </DialogActions>
      </Dialog>

      {/* Set Expiry Date Dialog */}
      <Dialog open={expiryDialogOpen} onClose={() => setExpiryDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Set Expiry Date - {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            type="date"
            label="Expiry Date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ mt: 1 }}
            helperText="Leave empty to remove expiry date"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExpiryDialogOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSetExpiry} variant="contained">
            Set Expiry
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manage Websites Dialog */}
      <Dialog open={websiteDialogOpen} onClose={() => setWebsiteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Manage Websites - {selectedUser?.username}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select which websites this user can access.
          </Typography>
          {availableWebsites.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">
                No websites available.
              </Typography>
            </Box>
          ) : (
            <List>
              {availableWebsites.map((website) => (
                <ListItem key={website} dense>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={userWebsites.includes(website)}
                        onChange={() => handleWebsiteToggle(website)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2">{website}</Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setWebsiteDialogOpen(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveWebsites} 
            variant="contained"
            disabled={availableWebsites.length === 0}
          >
            Save Permissions
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Users;