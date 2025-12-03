'use client';

import { useState, useEffect } from 'react';
import { getToken } from '@/lib/auth';
import { 
  Users as UsersIcon, 
  Plus, 
  Shield, 
  User as UserIcon, 
  Lock, 
  Calendar, 
  Globe, 
  Phone, 
  MessageCircle,
  Search,
  X,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface User {
  _id: string;
  email: string;
  name?: string;
  isAdmin?: boolean;
  isActive?: boolean;
  expiryDate?: string;
  loginCount?: number;
  lastLogin?: string;
  phone?: {
    countryCode?: string;
    number?: string;
  };
  websitePermissions?: Array<{
    website: string;
    hasAccess: boolean;
    lastAccessed?: string;
    approvedBy?: string;
  }>;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [expiryDialogOpen, setExpiryDialogOpen] = useState(false);
  const [websiteDialogOpen, setWebsiteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState({ email: '', password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [phoneById, setPhoneById] = useState<Record<string, string>>({});
  const [userWebsites, setUserWebsites] = useState<string[]>([]);
  const [availableWebsites, setAvailableWebsites] = useState<string[]>([]);

  useEffect(() => {
    fetchUsers();
    fetchAvailableWebsites();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (!response.ok) throw new Error('Failed to fetch users');
      
      const data = await response.json();
      const usersList = Array.isArray(data.data) ? data.data : [];
      setUsers(usersList);
      
      // Load saved phone numbers
      const map: Record<string, string> = {};
      (data.data || []).forEach((u: User) => {
        const key = `user_phone_${u._id}`;
        const saved = localStorage.getItem(key);
        if (saved) {
          map[u._id] = saved;
        } else if (u.phone?.number) {
          const full = (u.phone.countryCode || '') + u.phone.number;
          map[u._id] = full;
        }
      });
      setPhoneById(map);
    } catch (error: any) {
      setMessage({ type: 'error', text: 'Failed to load users' });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableWebsites = async () => {
    try {
      const token = getToken();
      const response = await fetch('/api/users/websites', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        const websites = new Set<string>();
        (data.data || []).forEach((item: any) => {
          if (item.website) websites.add(normalizeDomain(item.website));
        });
        setAvailableWebsites(Array.from(websites).sort());
      }
    } catch (error) {
      console.error('Error fetching websites:', error);
    }
  };

  const normalizeDomain = (raw: string): string => {
    if (!raw) return '';
    try {
      let input = raw.trim();
      if (!/^https?:\/\//i.test(input)) {
        input = `https://${input}`;
      }
      const url = new URL(input);
      let host = url.host.toLowerCase();
      if (host.startsWith('www.')) host = host.slice(4);
      return host;
    } catch {
      return raw
        .replace(/^https?:\/\//i, '')
        .replace(/^www\./i, '')
        .replace(/\/$/, '')
        .toLowerCase()
        .trim();
    }
  };

  const filteredUsers = users.filter(u => {
    if (!u) return false;
    const email = (u.email || '').toLowerCase();
    const name = (u.name || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return email.includes(search) || name.includes(search);
  });

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      setMessage({ type: 'error', text: 'Email and password are required' });
      return;
    }

    try {
      const token = getToken();
      const response = await fetch('/api/auth/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create user');
      }

      setMessage({ type: 'success', text: data.message || 'User created successfully' });
      setCreateDialogOpen(false);
      setNewUser({ email: '', password: '' });
      fetchUsers();
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create user. Please try again.';
      setMessage({ type: 'error', text: errorMessage });
      console.error('Create user error:', error);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    try {
      const token = getToken();
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to update status');

      setMessage({ type: 'success', text: `User ${!isActive ? 'activated' : 'deactivated'} successfully` });
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update status' });
    }
  };

  const handleBulkStatusChange = async (isActive: boolean) => {
    if (selectedUserIds.length === 0) return;
    try {
      const token = getToken();
      const response = await fetch('/api/users/status-bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ userIds: selectedUserIds, isActive }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMessage({ type: 'success', text: data.message || `Users ${isActive ? 'activated' : 'deactivated'} successfully` });
      setSelectedUserIds([]);
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update users' });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`/api/users/${selectedUser!._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      if (!response.ok) throw new Error('Failed to change password');

      setMessage({ type: 'success', text: 'Password changed successfully' });
      setPasswordDialogOpen(false);
      setNewPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to change password' });
    }
  };

  const handleSetExpiry = async () => {
    try {
      const token = getToken();
      const response = await fetch(`/api/users/${selectedUser!._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ expiryDate: expiryDate || null }),
      });

      if (!response.ok) throw new Error('Failed to set expiry');

      setMessage({ type: 'success', text: expiryDate ? 'Expiry date set successfully' : 'Expiry date removed successfully' });
      setExpiryDialogOpen(false);
      setExpiryDate('');
      fetchUsers();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to set expiry date' });
    }
  };

  const handleSavePhone = async (user: User) => {
    try {
      const full = (phoneById[user._id] || '').replace(/\D+/g, '');
      if (!full) return;

      let countryCode = '';
      let number = full;
      if (full.length > 10) {
        countryCode = full.slice(0, full.length - 10);
        number = full.slice(-10);
      }

      const token = getToken();
      const response = await fetch(`/api/users/${user._id}/phone`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ countryCode, number }),
      });

      if (!response.ok) throw new Error('Failed to save phone');

      setMessage({ type: 'success', text: 'Phone saved' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to save phone' });
    }
  };

  const handlePhoneChange = (userId: string, val: string) => {
    const digits = val.replace(/\D+/g, '');
    setPhoneById(prev => ({ ...prev, [userId]: digits }));
    localStorage.setItem(`user_phone_${userId}`, digits);
  };

  const handleWhatsApp = (user: User) => {
    try {
      const digits = (phoneById[user._id] || '').replace(/\D+/g, '');
      if (!digits) {
        alert('Add a mobile number first in the Mobile column.');
        return;
      }
      const userName = user.name || user.email || 'User';
      const url = `https://wa.me/${digits}?text=${encodeURIComponent('Hello ' + userName)}`;
      window.open(url, '_blank');
    } catch {}
  };

  const handleManageWebsites = (user: User) => {
    setSelectedUser(user);
    const currentWebsites = user.websitePermissions?.filter(p => p.hasAccess).map(p => normalizeDomain(p.website)) || [];
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

      const token = getToken();
      const response = await fetch(`/api/users/${selectedUser._id}/websites`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ permissions }),
      });

      if (!response.ok) throw new Error('Failed to update permissions');

      setMessage({ type: 'success', text: 'Website permissions updated successfully' });
      setWebsiteDialogOpen(false);
      fetchUsers();
      fetchAvailableWebsites();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Failed to update permissions' });
    }
  };

  const isUserExpired = (user: User) => {
    return user.expiryDate && new Date() > new Date(user.expiryDate);
  };

  const getUserStatus = (user: User) => {
    if (!user.isActive) return { label: 'Inactive', color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200' };
    if (isUserExpired(user)) return { label: 'Expired', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200' };
    return { label: 'Active', color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200' };
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectedUserIds(checked ? filteredUsers.map(u => u._id) : []);
  };

  const handleSelectRow = (userId: string, checked: boolean) => {
    setSelectedUserIds(prev => checked ? [...prev, userId] : prev.filter(id => id !== userId));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
        <div className="text-center">
          <div className="text-lg font-medium text-zinc-900 dark:text-zinc-50">Loading users...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black pb-16 lg:pb-0">
      <div className="p-3 sm:p-4 md:p-6 lg:p-8">
        <div className="mb-4 sm:mb-6 flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl flex items-center gap-2">
              <UsersIcon className="w-5 h-5 sm:w-6 sm:h-6" />
              User Management
            </h1>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 sm:text-sm mt-1">
              Manage system users and their permissions • {filteredUsers.length}/{users.length}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                type="search"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-48 pl-10 pr-4 py-2 text-sm rounded-lg border border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50"
              />
            </div>
            <button
              onClick={() => handleBulkStatusChange(true)}
              disabled={selectedUserIds.length === 0}
              className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-green-300 text-green-700 bg-green-50 hover:bg-green-100 dark:border-green-700 dark:text-green-300 dark:bg-green-900/20 dark:hover:bg-green-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Activate Selected
            </button>
            <button
              onClick={() => handleBulkStatusChange(false)}
              disabled={selectedUserIds.length === 0}
              className="px-3 py-2 text-xs sm:text-sm rounded-lg border border-red-300 text-red-700 bg-red-50 hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:bg-red-900/20 dark:hover:bg-red-900/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Deactivate Selected
            </button>
            <button
              onClick={() => setCreateDialogOpen(true)}
              className="px-3 py-2 text-xs sm:text-sm rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200 flex items-center gap-1 sm:gap-2"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Create User</span>
              <span className="sm:hidden">Create</span>
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 sm:p-4 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-200' 
              : 'bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-sm">{message.text}</span>
              <button onClick={() => setMessage(null)} className="text-current opacity-70 hover:opacity-100">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="p-3 sm:p-4 md:p-6">
            <h2 className="text-base sm:text-lg font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
              All Users ({filteredUsers.length}/{users.length})
            </h2>

            {filteredUsers.length === 0 ? (
              <div className="text-center py-12">
                <UsersIcon className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                <p className="text-zinc-600 dark:text-zinc-400">No users found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-800">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        <input
                          type="checkbox"
                          checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-zinc-300 text-zinc-950 focus:ring-2 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900"
                        />
                      </th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">#</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">User</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">Role</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">Status</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden sm:table-cell">Expiry</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300 hidden md:table-cell">Logins</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm font-medium text-zinc-700 dark:text-zinc-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {filteredUsers.map((user, idx) => (
                      <tr key={user._id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800">
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <input
                            type="checkbox"
                            checked={selectedUserIds.includes(user._id)}
                            onChange={(e) => handleSelectRow(user._id, e.target.checked)}
                            className="rounded border-zinc-300 text-zinc-950 focus:ring-2 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900"
                          />
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400">{idx + 1}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-2">
                            {user.isAdmin ? (
                              <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            ) : (
                              <UserIcon className="w-4 h-4 text-zinc-600 dark:text-zinc-400" />
                            )}
                            <div>
                              <div className="text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-50">
                                {user.name || (user.email ? user.email.split('@')[0] : 'Unknown User')}
                              </div>
                              <div className="text-xs text-zinc-500 dark:text-zinc-400 hidden sm:block">{user.email || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            user.isAdmin 
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200' 
                              : 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200'
                          }`}>
                            {user.isAdmin ? 'Admin' : 'User'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getUserStatus(user).color}`}>
                            {getUserStatus(user).label}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 hidden sm:table-cell">
                          {user.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : 'No expiry'}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 hidden md:table-cell">
                          {user.loginCount || 0}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={user.isActive || false}
                                onChange={() => handleToggleStatus(user._id, user.isActive || false)}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-zinc-950 dark:peer-focus:ring-zinc-50 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-zinc-600 peer-checked:bg-black dark:peer-checked:bg-zinc-50"></div>
                            </label>
                            <button
                              onClick={() => handleWhatsApp(user)}
                              className="p-1.5 sm:p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { setSelectedUser(user); setPasswordDialogOpen(true); }}
                              className="p-1.5 sm:p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded"
                              title="Change Password"
                            >
                              <Lock className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => { 
                                setSelectedUser(user); 
                                setExpiryDate(user.expiryDate ? user.expiryDate.split('T')[0] : ''); 
                                setExpiryDialogOpen(true); 
                              }}
                              className="p-1.5 sm:p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded hidden sm:inline-flex"
                              title="Set Expiry"
                            >
                              <Calendar className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleManageWebsites(user)}
                              className="p-1.5 sm:p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800 rounded hidden sm:inline-flex"
                              title="Manage Websites"
                            >
                              <Globe className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create User Dialog */}
      {createDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">Create New User</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50"
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3 justify-end">
                <button
                  onClick={() => setCreateDialogOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateUser}
                  className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Dialog */}
      {passwordDialogOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Change Password - {selectedUser.name || selectedUser.email || 'User'}
              </h2>
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50"
                />
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setPasswordDialogOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Set Expiry Dialog */}
      {expiryDialogOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg max-w-md w-full">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Set Expiry Date - {selectedUser.name || selectedUser.email || 'User'}
              </h2>
              <div className="mb-6">
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-zinc-950 dark:focus:ring-zinc-50"
                />
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Leave empty to remove expiry date</p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setExpiryDialogOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSetExpiry}
                  className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200"
                >
                  Set Expiry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Websites Dialog */}
      {websiteDialogOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-4">
                Manage Websites - {selectedUser.name || selectedUser.email || 'User'}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
                Select which websites this user can access.
              </p>
              {availableWebsites.length === 0 ? (
                <div className="text-center py-8">
                  <Globe className="w-12 h-12 text-zinc-400 mx-auto mb-4" />
                  <p className="text-zinc-600 dark:text-zinc-400">No websites available.</p>
                </div>
              ) : (
                <div className="space-y-2 mb-6">
                  {availableWebsites.map((website) => (
                    <label key={website} className="flex items-center gap-2 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={userWebsites.includes(website)}
                        onChange={() => handleWebsiteToggle(website)}
                        className="rounded border-zinc-300 text-zinc-950 focus:ring-2 focus:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-900"
                      />
                      <span className="text-sm text-zinc-900 dark:text-zinc-50">{website}</span>
                    </label>
                  ))}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setWebsiteDialogOpen(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveWebsites}
                  disabled={availableWebsites.length === 0}
                  className="px-4 py-2 text-sm rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-black dark:hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Permissions
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

