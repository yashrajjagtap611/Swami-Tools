import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { enhancedAuthMiddleware, cookieAuthMiddleware, planExpiryWarningMiddleware } from '../middleware/enhancedAuth.js';
import { CookieBundle } from '../models/CookieBundle.js';
import { User } from '../models/User.js';

export const cookiesRouter = express.Router();

// Admin: Upload cookies
cookiesRouter.post('/upload', authMiddleware, async (req, res) => {
  try {
    const { isAdmin } = req.user;
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const { cookies } = req.body;
    if (!cookies || !Array.isArray(cookies)) {
      return res.status(400).json({ message: 'Invalid cookies data' });
    }

    console.log(`📤 Admin uploading ${cookies.length} cookies`);

    // Extract unique domains from cookies and normalize them
    const domains = new Set();
    cookies.forEach(cookie => {
      if (cookie.domain) {
        let domain = cookie.domain.toLowerCase().trim();
        
        // Handle full URLs in domain field (like 'https://chatgpt.com/')
        if (domain.startsWith('http://') || domain.startsWith('https://')) {
          try {
            const url = new URL(domain);
            domain = url.hostname;
          } catch (e) {
            // If URL parsing fails, try to extract domain manually
            domain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
          }
        }
        
        // Remove trailing slash if present
        domain = domain.replace(/\/$/, '');
        
        // Remove leading dot from domain
        if (domain.startsWith('.')) {
          domain = domain.substring(1);
        }
        
        if (domain && domain !== '') {
          domains.add(domain);
        }
      }
    });

    console.log('🌐 Extracted domains from cookies:', Array.from(domains));

    const bundle = await CookieBundle.create({
      cookies,
      uploadedBy: req.user.userId,
      uploadedAt: new Date()
    });

    // Auto-grant permissions to all users for the domains in uploaded cookies
    if (domains.size > 0) {
      const users = await User.find({ isActive: true });
      console.log(`👥 Granting permissions to ${users.length} users for ${domains.size} domains`);
      
      for (const user of users) {
        let updated = false;
        
        for (const domain of domains) {
          // Check if permission already exists
          const existingPermission = user.websitePermissions.find(p => p.website === domain);
          
          if (!existingPermission) {
            user.websitePermissions.push({
              website: domain,
              hasAccess: true,
              approvedBy: 'auto-admin',
              lastAccessed: new Date()
            });
            updated = true;
            console.log(`✅ Granted ${domain} access to ${user.username}`);
          } else if (!existingPermission.hasAccess) {
            existingPermission.hasAccess = true;
            existingPermission.approvedBy = 'auto-admin';
            updated = true;
            console.log(`✅ Updated ${domain} access for ${user.username}`);
          }
        }
        
        if (updated) {
          await user.save();
        }
      }
    }

    res.json({ 
      message: `Cookies uploaded successfully. Auto-granted access to ${domains.size} domains for all users.`, 
      bundleId: bundle._id,
      domains: Array.from(domains)
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active cookies for users (with enhanced auth and plan expiry checks)
cookiesRouter.get('/get', cookieAuthMiddleware, planExpiryWarningMiddleware, async (req, res) => {
  try {
    const { website } = req.query;
    console.log(`🍪 Cookie request - Website: ${website}, User: ${req.user.userId}`);
    
    // Normalize website parameter
    const normalizedWebsite = website ? decodeURIComponent(website).toLowerCase().trim() : null;
    
    // If website is specified, check access permissions
    if (normalizedWebsite) {
      const user = await User.findById(req.user.userId);
      if (!user) {
        console.log('❌ User not found');
        return res.status(404).json({ 
          success: false,
          message: 'User not found',
          cookies: [] 
        });
      }

      console.log(`👤 User: ${user.username}, Admin: ${user.isAdmin}`);

      // Admin users have access to all websites
      if (!user.isAdmin) {
        const permission = user.websitePermissions.find(p => p.website === normalizedWebsite);
        console.log(`🔐 Permission check for ${normalizedWebsite}:`, permission);
        
        if (!permission || !permission.hasAccess) {
          console.log('❌ Access denied');
          return res.status(403).json({ 
            success: false,
            message: 'Access denied to this website. Please request access from an administrator.',
            cookies: [] 
          });
        }
        
        // Update last accessed time
        permission.lastAccessed = new Date();
        await user.save();
        console.log('✅ Access granted, updated last accessed time');
      } else {
        console.log('✅ Admin access granted');
      }
    }

    const bundle = await CookieBundle.findOne().sort({ uploadedAt: -1 });
    if (!bundle) {
      console.log('❌ No cookie bundles found in database');
      return res.json({ 
        success: false,
        message: 'No cookie bundles available. Please upload cookies first.',
        cookies: [] 
      });
    }

    console.log(`📦 Found bundle with ${bundle.cookies?.length || 0} cookies`);

    // Filter cookies by website if specified
    let cookies = bundle.cookies || [];
    if (normalizedWebsite) {
      const originalCount = cookies.length;
      cookies = cookies.filter(cookie => {
        if (!cookie.domain) return false;
        
        let cookieDomain = cookie.domain.toLowerCase().trim();
        
        // Handle full URLs in domain field (like 'https://chatgpt.com/')
        if (cookieDomain.startsWith('http://') || cookieDomain.startsWith('https://')) {
          try {
            const url = new URL(cookieDomain);
            cookieDomain = url.hostname;
          } catch (e) {
            // If URL parsing fails, try to extract domain manually
            cookieDomain = cookieDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
          }
        }
        
        // Remove trailing slash if present
        cookieDomain = cookieDomain.replace(/\/$/, '');
        
        console.log(`🔍 Comparing cookie domain '${cookieDomain}' with requested '${normalizedWebsite}'`);
        
        // Exact match
        if (cookieDomain === normalizedWebsite) {
          console.log('✅ Exact match found');
          return true;
        }
        
        // Subdomain match (cookie domain starts with .)
        if (cookieDomain.startsWith('.') && normalizedWebsite.endsWith(cookieDomain.substring(1))) {
          console.log('✅ Subdomain match found');
          return true;
        }
        
        // Parent domain match (cookie is for parent domain)
        if (cookieDomain.startsWith('.') && cookieDomain.substring(1) === normalizedWebsite) {
          console.log('✅ Parent domain match found');
          return true;
        }
        
        // Subdomain of requested site
        if (normalizedWebsite.endsWith('.' + cookieDomain)) {
          console.log('✅ Subdomain of requested site match found');
          return true;
        }
        
        console.log('❌ No match');
        return false;
      });
      
      console.log(`🔍 Filtered cookies: ${originalCount} → ${cookies.length} for website ${normalizedWebsite}`);
      
      // Fallback mappings for well-known sites (chatgpt.com often uses openai.com cookies)
      if (cookies.length === 0) {
        if (normalizedWebsite === 'chatgpt.com' || normalizedWebsite.endsWith('.chatgpt.com')) {
          const before = cookies.length;
          cookies = bundle.cookies.filter(c => {
            const d = (c.domain || '').toLowerCase();
            return d.includes('openai.com') || d.includes('chatgpt.com');
          });
          console.log(`🔁 Applied ChatGPT/OpenAI fallback: ${before} → ${cookies.length}`);
        }
        if (cookies.length === 0) {
          console.log('📋 Available cookie domains:', bundle.cookies.map(c => c.domain).filter(Boolean));
        }
      }
    }

    const message = cookies.length > 0 
      ? `Found ${cookies.length} cookies for ${normalizedWebsite || 'all websites'}` 
      : `No cookies available for ${normalizedWebsite || 'this website'}`;

    console.log(`✅ Returning ${cookies.length} cookies`);

    res.json({ 
      success: cookies.length > 0,
      cookies,
      message 
    });
  } catch (error) {
    console.error('❌ Error fetching cookies:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error while fetching cookies',
      cookies: [] 
    });
  }
});

// Insert cookies with website access check (with enhanced auth and plan expiry checks)
cookiesRouter.post('/insert', cookieAuthMiddleware, planExpiryWarningMiddleware, async (req, res) => {
  try {
    const { website, cookies } = req.body;
    if (!website || !cookies) {
      return res.status(400).json({ message: 'Website and cookies are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check website access permission
    if (!user.isAdmin) {
      const permission = user.websitePermissions.find(p => p.website === website);
      if (!permission || !permission.hasAccess) {
        return res.status(403).json({ 
          message: 'Access denied to this website. Please request access from an administrator.' 
        });
      }
      
      // Update last accessed time
      permission.lastAccessed = new Date();
    }

    // Track cookie insertion
    user.cookieInsertions.push({
      website,
      timestamp: new Date(),
      success: true
    });
    await user.save();

    res.json({ message: 'Cookies inserted successfully' });
  } catch (error) {
    console.error('Insert cookies error:', error);
    
    // Track failed insertion
    try {
      const user = await User.findById(req.user.userId);
      if (user) {
        user.cookieInsertions.push({
          website: req.body.website,
          timestamp: new Date(),
          success: false
        });
        await user.save();
      }
    } catch (trackError) {
      console.error('Error tracking failed insertion:', trackError);
    }
    
    res.status(500).json({ message: 'Server error inserting cookies' });
  }
});

// List bundles (admin only)
cookiesRouter.get('/', authMiddleware, async (req, res) => {
  try {
    const { isAdmin } = req.user;
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const bundles = await CookieBundle.find()
      .sort({ uploadedAt: -1 })
      .select('cookies uploadedAt');
      
    res.json(bundles);
  } catch (error) {
    console.error('List bundles error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get specific bundle (admin only)
cookiesRouter.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { isAdmin } = req.user;
    if (!isAdmin) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const bundle = await CookieBundle.findById(req.params.id);
    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    res.json(bundle);
  } catch (error) {
    console.error('Get bundle error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Upload cookies for specific website
cookiesRouter.post('/website-upload', authMiddleware, async (req, res) => {
  try {
    const { website, cookies } = req.body;
    if (!website || !cookies || !Array.isArray(cookies)) {
      return res.status(400).json({ message: 'Website and cookies are required' });
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user has permission for this website
    const permission = user.websitePermissions.find(p => p.website === website);
    if (!permission && !user.isAdmin) {
      return res.status(403).json({ message: 'No permission for this website' });
    }

    // Create or update cookie bundle for this website
    const bundle = await CookieBundle.create({
      cookies: cookies.map(cookie => ({ ...cookie, domain: website })),
      uploadedBy: req.user.userId,
      uploadedAt: new Date(),
      website
    });

    res.json({ message: 'Cookies uploaded successfully for ' + website, bundleId: bundle._id });
  } catch (error) {
    console.error('Website cookie upload error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



