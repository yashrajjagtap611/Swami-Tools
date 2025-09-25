import jwt from 'jsonwebtoken';

import { User } from '../models/User.js';

export const authMiddleware = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ensure we have the required user data
    if (!decoded.userId) {
      return res.status(401).json({ message: 'Invalid token format.' });
    }
    
    // Check if user is still active and session is valid
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({ message: 'User account is inactive.' });
    }

    // Enforce single-session: token must carry latest tokenVersion and sessionId
    if (typeof decoded.tokenVersion === 'number') {
      if (decoded.tokenVersion !== user.tokenVersion) {
        return res.status(401).json({ message: 'Session invalidated. Logged in elsewhere.' });
      }
    }
    if (decoded.sessionId && user.currentSessionId && decoded.sessionId !== user.currentSessionId) {
      return res.status(401).json({ message: 'Session invalidated. Logged in elsewhere.' });
    }
    
    // Set user info in request
    req.user = {
      userId: decoded.userId,
      isAdmin: decoded.isAdmin || false,
      username: user.username,
      sessionTimeout: user.sessionTimeout
    };
    
    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired.', code: 'TOKEN_EXPIRED' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token.' });
    }
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Middleware to check website access permissions
export const checkWebsiteAccess = (website) => {
  return async (req, res, next) => {
    try {
      const user = await User.findById(req.user.userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Admin users have access to all websites
      if (user.isAdmin) {
        return next();
      }
      
      // Check if user has permission for this website
      const permission = user.websitePermissions.find(p => p.website === website);
      if (!permission || !permission.hasAccess) {
        return res.status(403).json({ 
          message: 'Access denied to this website. Please request access from an administrator.',
          website 
        });
      }
      
      // Update last accessed time
      permission.lastAccessed = new Date();
      await user.save();
      
      next();
    } catch (error) {
      console.error('Website access check error:', error);
      res.status(500).json({ message: 'Server error checking website access' });
    }
  };
};