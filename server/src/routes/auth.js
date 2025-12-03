import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { CookieBundle } from '../models/CookieBundle.js';
import { authMiddleware } from '../middleware/auth.js';

export const authRouter = express.Router();

const generateEmailForUser = (username, providedEmail) => {
  const cleaned = (providedEmail || '').trim().toLowerCase();
  if (cleaned) return cleaned;
  return `${username.toLowerCase()}@swami-tools.local`;
};

// Login endpoint
authRouter.post('/login', async (req, res) => {
  try {
    console.log('🔐 Login attempt from:', req.headers.origin);
    console.log('📝 Request body:', { username: req.body.username, hasPassword: !!req.body.password });
    
    const { username, password, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      console.log('❌ Login failed: User not found:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      console.log('❌ Login failed: User account inactive:', username);
      return res.status(401).json({ message: 'Account is inactive. Contact administrator.' });
    }

    if (user.expiryDate && new Date() > user.expiryDate) {
      console.log('❌ Login failed: User account expired:', username);
      return res.status(401).json({ message: 'Account has expired. Contact administrator.' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      console.log('❌ Login failed: Invalid password for user:', username);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update login history
    const loginEntry = {
      timestamp: new Date(),
      ipAddress: req.ip || req.connection.remoteAddress,
      browser: req.get('User-Agent') || 'Unknown'
    };

    await User.findByIdAndUpdate(user._id, {
      $inc: { loginCount: 1 },
      $set: { lastLogin: new Date() },
      $push: { loginHistory: loginEntry }
    });

    // Single-session: increment tokenVersion and set a new session id
    const newSessionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    await User.findByIdAndUpdate(user._id, {
      $inc: { tokenVersion: 1 },
      $set: { currentSessionId: newSessionId }
    });

    // REMOVED: Automatic cookie deletion on login
    // This was causing cookies to disappear after user login
    // Cookies should persist across login sessions

    const freshUser = await User.findById(user._id);
    // No session timeout-based expiry; set long-lived token (e.g., 7d)
    const expiresIn = '7d';
    const token = jwt.sign(
      { 
        userId: freshUser._id, 
        isAdmin: freshUser.isAdmin, 
        username: freshUser.username,
        tokenVersion: freshUser.tokenVersion,
        sessionId: freshUser.currentSessionId
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    console.log('✅ Login successful for user:', username, 'Admin:', user.isAdmin);

    res.json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        username: freshUser.username,
        isAdmin: freshUser.isAdmin,
        sessionTimeout: freshUser.sessionTimeout || 60
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Register endpoint
authRouter.post('/register', async (req, res) => {
  try {
    console.log('📝 Registration attempt from:', req.headers.origin);
    
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ message: 'Username must be at least 3 characters long' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = generateEmailForUser(username, email);

    // Check if username already exists
    const existing = await User.findOne({ 
      $or: [
        { username }, 
        { email: normalizedEmail }
      ]
    });
    if (existing) {
      console.log('❌ Registration failed: Username or email already exists:', username, normalizedEmail);
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email: normalizedEmail,
      passwordHash,
      isAdmin: false
    });

    console.log('✅ User registered successfully:', username);

    res.json({
      message: 'User registered successfully',
      user: {
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Admin endpoint to create users
authRouter.post('/create', authMiddleware, async (req, res) => {
  try {
    console.log('👑 Admin user creation attempt from:', req.headers.origin);
    
    const { userId, isAdmin } = req.user;
    if (!isAdmin) {
      console.log('❌ Access denied: Non-admin user attempted to create user:', userId);
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { username, password, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password required' });
    }

    const normalizedEmail = generateEmailForUser(username, email);

    // Check if username already exists
    const existing = await User.findOne({ 
      $or: [
        { username }, 
        { email: normalizedEmail }
      ]
    });
    if (existing) {
      console.log('❌ User creation failed: Username or email already exists:', username, normalizedEmail);
      return res.status(409).json({ message: 'Username or email already exists' });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      username,
      email: normalizedEmail,
      passwordHash,
      isAdmin: false // New users created by admin are regular users
    });

    console.log('✅ User created by admin:', username);

    res.json({
      message: 'User created successfully',
      user: {
        username: user.username,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({ message: 'Server error during user creation' });
  }
});

// Refresh token endpoint
authRouter.post('/refresh', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User account is inactive' });
    }

    const expiresIn = '7d';
    const token = jwt.sign(
      { userId: user._id, isAdmin: user.isAdmin, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn }
    );

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    res.json({
      token,
      expiresAt: expiresAt.toISOString(),
      user: {
        username: user.username,
        isAdmin: user.isAdmin,
        sessionTimeout: user.sessionTimeout || 60
      }
    });
  } catch (error) {
    console.error('❌ Token refresh error:', error);
    res.status(500).json({ message: 'Server error refreshing token' });
  }
});

// Get current user info
authRouter.get('/me', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      loginCount: user.loginCount,
      lastLogin: user.lastLogin,
      sessionTimeout: user.sessionTimeout,
      loginHistory: user.loginHistory,
      websitePermissions: user.websitePermissions,
      cookieInsertions: user.cookieInsertions
    });
  } catch (error) {
    console.error('❌ Get user info error:', error);
    res.status(500).json({ message: 'Server error getting user info' });
  }
});

// Admin endpoint to list all users
authRouter.get('/users', authMiddleware, async (req, res) => {
  try {
    const { isAdmin } = req.user;
    if (!isAdmin) {
      console.log('❌ Access denied: Non-admin user attempted to list users');
      return res.status(403).json({ message: 'Admin access required' });
    }

    const users = await User.find({}, { username: 1, isAdmin: 1 });
    res.json({ users });
  } catch (error) {
    console.error('❌ List users error:', error);
    res.status(500).json({ message: 'Server error listing users' });
  }
});

// Check plan status endpoint
authRouter.post('/check-plan', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ User not found for plan check:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user account is active
    if (!user.isActive) {
      console.log('❌ Plan check failed: User account inactive:', user.username);
      return res.status(403).json({ 
        reason: 'plan_expired',
        message: 'Account is inactive. Contact administrator.' 
      });
    }

    // Check if user account has expired
    if (user.expiryDate && new Date() > user.expiryDate) {
      console.log('❌ Plan check failed: User account expired:', user.username);
      return res.status(403).json({ 
        reason: 'plan_expired',
        message: 'Your plan has expired. Please renew your subscription to continue using the extension.' 
      });
    }

    // Calculate plan expiry time
    let planExpiresIn = null;
    let planExpiryWarning = null;
    
    if (user.expiryDate) {
      const now = new Date();
      const expiryDate = new Date(user.expiryDate);
      planExpiresIn = Math.floor((expiryDate - now) / 1000); // seconds until expiry
      
      // Generate warning if plan expires soon
      if (planExpiresIn < 86400) { // Less than 24 hours
        const hoursLeft = Math.floor(planExpiresIn / 3600);
        if (hoursLeft <= 0) {
          planExpiryWarning = 'Your plan has expired. Please renew immediately.';
        } else if (hoursLeft < 24) {
          planExpiryWarning = `Your plan expires in ${hoursLeft} hours. Please renew to avoid service interruption.`;
        }
      }
    }

    console.log('✅ Plan check successful for user:', user.username, 'Expires in:', planExpiresIn);

    res.json({
      status: 'active',
      planExpiresIn,
      planExpiryWarning,
      user: {
        username: user.username,
        isAdmin: user.isAdmin,
        expiryDate: user.expiryDate
      }
    });
  } catch (error) {
    console.error('❌ Plan check error:', error);
    res.status(500).json({ message: 'Server error checking plan status' });
  }
});

// Validate session endpoint
authRouter.post('/validate-session', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId);
    
    if (!user) {
      console.log('❌ Session validation failed: User not found:', userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user account is active
    if (!user.isActive) {
      console.log('❌ Session validation failed: User account inactive:', user.username);
      return res.status(403).json({ 
        reason: 'plan_expired',
        message: 'Account is inactive. Contact administrator.' 
      });
    }

    // Check if user account has expired
    if (user.expiryDate && new Date() > user.expiryDate) {
      console.log('❌ Session validation failed: User account expired:', user.username);
      return res.status(403).json({ 
        reason: 'plan_expired',
        message: 'Your plan has expired. Please renew your subscription to continue using the extension.' 
      });
    }

    // Calculate plan expiry time
    let planExpiresIn = null;
    let planExpiryWarning = null;
    
    if (user.expiryDate) {
      const now = new Date();
      const expiryDate = new Date(user.expiryDate);
      planExpiresIn = Math.floor((expiryDate - now) / 1000); // seconds until expiry
      
      // Generate warning if plan expires soon
      if (planExpiresIn < 86400) { // Less than 24 hours
        const hoursLeft = Math.floor(planExpiresIn / 3600);
        if (hoursLeft <= 0) {
          planExpiryWarning = 'Your plan has expired. Please renew immediately.';
        } else if (hoursLeft < 24) {
          planExpiryWarning = `Your plan expires in ${hoursLeft} hours. Please renew to avoid service interruption.`;
        }
      }
    }

    console.log('✅ Session validation successful for user:', user.username, 'Expires in:', planExpiresIn);

    res.json({
      valid: true,
      planExpiresIn,
      planExpiryWarning,
      user: {
        username: user.username,
        isAdmin: user.isAdmin,
        expiryDate: user.expiryDate
      }
    });
  } catch (error) {
    console.error('❌ Session validation error:', error);
    res.status(500).json({ message: 'Server error validating session' });
  }
});

// Logout endpoint
authRouter.post('/logout', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { deviceId } = req.body;
    
    console.log('🚪 Logout request from user:', userId, 'Device:', deviceId);
    
    // Update user's session info
    await User.findByIdAndUpdate(userId, {
      $set: { 
        lastLogout: new Date(),
        currentSessionId: null // Clear session ID
      }
    });

    console.log('✅ Logout successful for user:', userId);

    res.json({
      message: 'Logout successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ message: 'Server error during logout' });
  }
});
