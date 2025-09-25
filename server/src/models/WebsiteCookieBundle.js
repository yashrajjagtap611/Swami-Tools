import mongoose from 'mongoose';

// Enhanced cookie bundle model with website-specific storage
const websiteCookieBundleSchema = new mongoose.Schema({
  website: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  cookies: [{ 
    name: String,
    value: String,
    domain: String,
    path: String,
    secure: Boolean,
    httpOnly: Boolean,
    sameSite: String,
    expirationDate: Number,
    // Additional metadata
    isEssential: { type: Boolean, default: false }, // Mark critical cookies
    category: { type: String, enum: ['authentication', 'session', 'preference', 'tracking', 'functional'], default: 'functional' }
  }],
  // Version control for cookie updates
  version: { type: Number, default: 1 },
  previousVersions: [{
    version: Number,
    cookies: [mongoose.Schema.Types.Mixed],
    replacedAt: Date,
    replacedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }],
  // Upload metadata
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedAt: { type: Date, required: true },
  lastUpdated: { type: Date, default: Date.now },
  // Access control
  isActive: { type: Boolean, default: true },
  allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // Specific user access
  allowedRoles: [{ type: String, enum: ['admin', 'user', 'viewer'] }], // Role-based access
  // Usage statistics
  accessCount: { type: Number, default: 0 },
  lastAccessed: { type: Date },
  lastAccessedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Compound index for efficient website-based queries
websiteCookieBundleSchema.index({ website: 1, isActive: 1 });
websiteCookieBundleSchema.index({ uploadedAt: -1 });

// Pre-save middleware to handle versioning
websiteCookieBundleSchema.pre('save', function(next) {
  if (this.isModified('cookies') && !this.isNew) {
    // Store previous version before updating
    this.previousVersions.push({
      version: this.version,
      cookies: this.cookies,
      replacedAt: new Date(),
      replacedBy: this.uploadedBy
    });
    this.version += 1;
    this.lastUpdated = new Date();
  }
  next();
});

// Static method to clean up old versions (keep only last 5)
websiteCookieBundleSchema.methods.cleanupOldVersions = function() {
  if (this.previousVersions.length > 5) {
    this.previousVersions = this.previousVersions.slice(-5);
  }
};

// Static method to get active cookies for a website
websiteCookieBundleSchema.statics.getActiveCookiesForWebsite = async function(website, userId = null) {
  const query = { 
    website: website.toLowerCase(), 
    isActive: true 
  };
  
  const bundle = await this.findOne(query)
    .populate('uploadedBy', 'username')
    .populate('lastAccessedBy', 'username');
    
  if (bundle && userId) {
    // Update access statistics
    bundle.accessCount += 1;
    bundle.lastAccessed = new Date();
    bundle.lastAccessedBy = userId;
    await bundle.save();
  }
  
  return bundle;
};

// Static method to replace cookies for a website (with cleanup)
websiteCookieBundleSchema.statics.replaceCookiesForWebsite = async function(website, newCookies, uploadedBy) {
  const existingBundle = await this.findOne({ 
    website: website.toLowerCase(), 
    isActive: true 
  });
  
  if (existingBundle) {
    // Update existing bundle
    existingBundle.cookies = newCookies;
    existingBundle.uploadedBy = uploadedBy;
    existingBundle.uploadedAt = new Date();
    await existingBundle.save();
    existingBundle.cleanupOldVersions();
    await existingBundle.save();
    return existingBundle;
  } else {
    // Create new bundle
    return await this.create({
      website: website.toLowerCase(),
      cookies: newCookies,
      uploadedBy,
      uploadedAt: new Date()
    });
  }
};

export const WebsiteCookieBundle = mongoose.model('WebsiteCookieBundle', websiteCookieBundleSchema);
