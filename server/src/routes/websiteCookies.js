import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { enhancedAuthMiddleware, cookieAuthMiddleware, planExpiryWarningMiddleware } from '../middleware/enhancedAuth.js';
import { WebsiteCookieBundle } from '../models/WebsiteCookieBundle.js';
import { User } from '../models/User.js';

export const websiteCookiesRouter = express.Router();

// Admin: Upload cookies for specific website
websiteCookiesRouter.post('/upload/:website', authMiddleware, async (req, res) => {
  try {
    const { isAdmin } = req.user;
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const website = req.params.website.toLowerCase().trim();
    const { cookies, replaceExisting = true } = req.body;

    if (!cookies || !Array.isArray(cookies)) {
      return res.status(400).json({ message: 'Invalid cookies data' });
    }

    console.log(`📤 Admin uploading ${cookies.length} cookies for ${website}`);

    // Process and categorize cookies
    const processedCookies = cookies.map(cookie => ({
      ...cookie,
      domain: cookie.domain ? cookie.domain.toLowerCase().trim() : website,
      category: categorizeCookie(cookie.name),
      isEssential: isEssentialCookie(cookie.name)
    }));

    let bundle;
    if (replaceExisting) {
      // Replace existing cookies (this will trigger cleanup of old cookies)
      bundle = await WebsiteCookieBundle.replaceCookiesForWebsite(
        website, 
        processedCookies, 
        req.user.userId
      );
      console.log(`🔄 Replaced cookies for ${website} (version ${bundle.version})`);
    } else {
      // Create new bundle without replacing
      bundle = await WebsiteCookieBundle.create({
        website,
        cookies: processedCookies,
        uploadedBy: req.user.userId,
        uploadedAt: new Date()
      });
      console.log(`✨ Created new cookie bundle for ${website}`);
    }

    // Auto-grant permissions to all active users for this website
    const users = await User.find({ isActive: true });
    console.log(`👥 Granting ${website} access to ${users.length} users`);
    
    for (const user of users) {
      let updated = false;
      const existingPermission = user.websitePermissions.find(p => p.website === website);
      
      if (!existingPermission) {
        user.websitePermissions.push({
          website,
          hasAccess: true,
          accessLevel: user.isAdmin ? 'admin' : 'read',
          approvedBy: 'auto-admin',
          approvedAt: new Date(),
          preferences: {
            allowedCategories: ['authentication', 'session', 'preference', 'functional']
          }
        });
        updated = true;
        console.log(`✅ Granted ${website} access to ${user.username}`);
      } else if (!existingPermission.hasAccess) {
        existingPermission.hasAccess = true;
        existingPermission.approvedBy = 'auto-admin';
        existingPermission.approvedAt = new Date();
        updated = true;
        console.log(`✅ Updated ${website} access for ${user.username}`);
      }
      
      if (updated) {
        await user.save();
      }
    }

    res.json({ 
      success: true,
      message: `Cookies uploaded successfully for ${website}`, 
      bundleId: bundle._id,
      website,
      cookieCount: processedCookies.length,
      version: bundle.version,
      usersGrantedAccess: users.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get cookies for specific website (with enhanced auth and plan expiry checks)
websiteCookiesRouter.get('/get/:website', cookieAuthMiddleware, planExpiryWarningMiddleware, async (req, res) => {
  try {
    const website = req.params.website.toLowerCase().trim();
    const { includeMetadata = false } = req.query;
    
    console.log(`🍪 Cookie request for ${website} by user ${req.user.userId}`);
    
    // Check user permissions
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found',
        cookies: [] 
      });
    }

    console.log(`👤 User: ${user.username}, Admin: ${user.isAdmin}`);

    // Admin users have access to all websites
    if (!user.isAdmin) {
      const permission = user.websitePermissions.find(p => p.website === website);
      console.log(`🔐 Permission check for ${website}:`, permission);
      
      if (!permission || !permission.hasAccess) {
        return res.status(403).json({ 
          success: false,
          message: `Access denied to ${website}. Please request access from an administrator.`,
          cookies: [] 
        });
      }
      
      // Check if permission has expired
      if (permission.expiresAt && permission.expiresAt < new Date()) {
        return res.status(403).json({ 
          success: false,
          message: `Access to ${website} has expired. Please request renewed access.`,
          cookies: [] 
        });
      }
      
      // Update access statistics
      permission.lastAccessed = new Date();
      permission.accessCount = (permission.accessCount || 0) + 1;
      await user.save();
      console.log('✅ Access granted, updated statistics');
    } else {
      console.log('✅ Admin access granted');
    }

    // Get cookies for the website
    const bundle = await WebsiteCookieBundle.getActiveCookiesForWebsite(website, req.user.userId);
    
    if (!bundle) {
      console.log(`❌ No cookie bundle found for ${website}`);
      return res.json({ 
        success: false,
        message: `No cookies available for ${website}. Please upload cookies first.`,
        cookies: [] 
      });
    }

    console.log(`📦 Found bundle for ${website} with ${bundle.cookies?.length || 0} cookies (version ${bundle.version})`);

    // Filter cookies based on user preferences (if not admin)
    let cookies = bundle.cookies || [];
    if (!user.isAdmin) {
      const permission = user.websitePermissions.find(p => p.website === website);
      const allowedCategories = permission?.preferences?.allowedCategories || [];
      
      if (allowedCategories.length > 0) {
        cookies = cookies.filter(cookie => 
          allowedCategories.includes(cookie.category) || cookie.isEssential
        );
        console.log(`🔍 Filtered cookies by categories: ${cookies.length} remaining`);
      }
    }

    const response = {
      success: cookies.length > 0,
      website,
      cookies,
      message: cookies.length > 0 
        ? `Found ${cookies.length} cookies for ${website}` 
        : `No accessible cookies for ${website}`
    };

    // Include metadata if requested
    if (includeMetadata === 'true') {
      response.metadata = {
        bundleId: bundle._id,
        version: bundle.version,
        uploadedAt: bundle.uploadedAt,
        uploadedBy: bundle.uploadedBy?.username,
        accessCount: bundle.accessCount,
        lastUpdated: bundle.lastUpdated
      };
    }

    console.log(`✅ Returning ${cookies.length} cookies for ${website}`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error fetching cookies:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching cookies',
      cookies: [] 
    });
  }
});

// List all websites with cookies (admin only)
websiteCookiesRouter.get('/websites', authMiddleware, async (req, res) => {
  try {
    const { isAdmin } = req.user;
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const bundles = await WebsiteCookieBundle.find({ isActive: true })
      .populate('uploadedBy', 'username')
      .populate('lastAccessedBy', 'username')
      .sort({ lastUpdated: -1 });

    const websites = bundles.map(bundle => ({
      website: bundle.website,
      cookieCount: bundle.cookies?.length || 0,
      version: bundle.version,
      uploadedAt: bundle.uploadedAt,
      uploadedBy: bundle.uploadedBy?.username,
      lastUpdated: bundle.lastUpdated,
      accessCount: bundle.accessCount,
      lastAccessed: bundle.lastAccessed,
      lastAccessedBy: bundle.lastAccessedBy?.username
    }));

    res.json({ 
      success: true,
      websites,
      totalWebsites: websites.length
    });

  } catch (error) {
    console.error('List websites error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete cookies for specific website (admin only)
websiteCookiesRouter.delete('/website/:website', authMiddleware, async (req, res) => {
  try {
    const { isAdmin } = req.user;
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const website = req.params.website.toLowerCase().trim();
    
    const result = await WebsiteCookieBundle.findOneAndUpdate(
      { website, isActive: true },
      { isActive: false, lastUpdated: new Date() },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: `No active cookies found for ${website}` });
    }

    console.log(`🗑️ Deactivated cookies for ${website}`);
    res.json({ 
      success: true,
      message: `Cookies for ${website} have been deactivated`,
      website
    });

  } catch (error) {
    console.error('Delete website cookies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User: Request access to a website (with enhanced auth and plan expiry checks)
websiteCookiesRouter.post('/request-access/:website', enhancedAuthMiddleware, planExpiryWarningMiddleware, async (req, res) => {
  try {
    const website = req.params.website.toLowerCase().trim();
    const { reason } = req.body;

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already has access
    const existingPermission = user.websitePermissions.find(p => p.website === website);
    if (existingPermission && existingPermission.hasAccess) {
      return res.status(400).json({ message: 'You already have access to this website' });
    }

    // Check if request already exists
    const existingRequest = user.accessRequests.find(r => 
      r.website === website && r.status === 'pending'
    );
    if (existingRequest) {
      return res.status(400).json({ message: 'Access request already pending for this website' });
    }

    // Add access request
    user.accessRequests.push({
      website,
      reason: reason || 'Cookie access needed',
      requestedAt: new Date(),
      status: 'pending'
    });

    await user.save();

    console.log(`📝 Access request created for ${website} by ${user.username}`);
    res.json({ 
      success: true,
      message: `Access request submitted for ${website}`,
      website
    });

  } catch (error) {
    console.error('Request access error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper functions
function categorizeCookie(cookieName) {
  const name = cookieName.toLowerCase();
  
  if (name.includes('auth') || name.includes('session') || name.includes('login') || name.includes('token')) {
    return 'authentication';
  }
  if (name.includes('sess') || name.includes('sid')) {
    return 'session';
  }
  if (name.includes('pref') || name.includes('setting') || name.includes('config')) {
    return 'preference';
  }
  if (name.includes('track') || name.includes('analytics') || name.includes('ga_') || name.includes('_ga')) {
    return 'tracking';
  }
  
  return 'functional';
}

function isEssentialCookie(cookieName) {
  const essentialPatterns = [
    '__secure-',
    '__host-',
    'csrf',
    'xsrf',
    'session',
    'auth'
  ];
  
  const name = cookieName.toLowerCase();
  return essentialPatterns.some(pattern => name.includes(pattern));
}
