import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

// Enhanced authentication middleware with plan expiration checks
export const enhancedAuthMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const JWT_SECRET = process.env.JWT_SECRET || 'default-secret';
    
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
      }
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Get fresh user data from database to check current status
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(403).json({ 
        message: 'Account is deactivated. Please contact administrator.',
        reason: 'account_deactivated'
      });
    }

    // Check if user plan has expired (critical check)
    if (user.expiryDate && user.expiryDate < new Date()) {
      console.log(`🚫 User ${user.username} plan expired on ${user.expiryDate}, blocking access`);
      
      // Force logout by invalidating token version
      user.tokenVersion = (user.tokenVersion || 0) + 1;
      await user.save();
      
      return res.status(403).json({ 
        message: 'Your plan has expired. Please renew your subscription to continue using the service.',
        reason: 'plan_expired',
        expiredOn: user.expiryDate,
        forceLogout: true
      });
    }

    // Check for website-specific permission expiration (if accessing website resources)
    const website = req.params.website || req.query.website;
    if (website && !user.isAdmin) {
      const permission = user.websitePermissions.find(p => p.website === website.toLowerCase());
      
      if (permission && permission.expiresAt && permission.expiresAt < new Date()) {
        console.log(`🚫 User ${user.username} website permission for ${website} expired on ${permission.expiresAt}`);
        return res.status(403).json({ 
          message: `Your access to ${website} has expired. Please request renewed access.`,
          reason: 'website_access_expired',
          website: website,
          expiredOn: permission.expiresAt
        });
      }
    }

    // Attach user info to request
    req.user = {
      userId: user._id,
      username: user.username,
      isAdmin: user.isAdmin,
      isActive: user.isActive,
      expiryDate: user.expiryDate,
      tokenVersion: user.tokenVersion
    };

    next();
  } catch (error) {
    console.error('Enhanced auth middleware error:', error);
    res.status(500).json({ message: 'Authentication error' });
  }
};

// Middleware specifically for cookie operations with additional checks
export const cookieAuthMiddleware = async (req, res, next) => {
  // First run the enhanced auth
  enhancedAuthMiddleware(req, res, async (error) => {
    if (error) return;
    
    try {
      // Additional checks for cookie operations
      const user = await User.findById(req.user.userId);
      
      // Check if user has any active website permissions
      const activePermissions = user.websitePermissions.filter(p => 
        p.hasAccess && (!p.expiresAt || p.expiresAt > new Date())
      );
      
      if (!user.isAdmin && activePermissions.length === 0) {
        return res.status(403).json({ 
          message: 'No active website permissions. Please request access to websites.',
          reason: 'no_active_permissions'
        });
      }

      // Update last activity for monitoring
      user.lastLogin = new Date();
      await user.save();
      
      next();
    } catch (error) {
      console.error('Cookie auth middleware error:', error);
      res.status(500).json({ message: 'Cookie authentication error' });
    }
  });
};

// Middleware to check if user plan is about to expire (warning)
export const planExpiryWarningMiddleware = async (req, res, next) => {
  try {
    if (req.user && req.user.expiryDate && !req.user.isAdmin) {
      const daysUntilExpiry = Math.ceil((req.user.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        // Add warning header
        res.set('X-Plan-Expiry-Warning', `Your plan expires in ${daysUntilExpiry} days`);
        res.set('X-Plan-Expiry-Date', req.user.expiryDate.toISOString());
      }
    }
    next();
  } catch (error) {
    console.error('Plan expiry warning middleware error:', error);
    next(); // Don't block the request for warning errors
  }
};
