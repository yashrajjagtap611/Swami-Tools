import mongoose from 'mongoose';

const loginHistorySchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  ipAddress: String,
  browser: String
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  expiryDate: { type: Date },
  loginCount: { type: Number, default: 0 },
  lastLogin: { type: Date },
  // sessionTimeout removed (no auto-logout based on inactivity)
  loginHistory: [loginHistorySchema],
  websitePermissions: [{
    website: { type: String, lowercase: true, trim: true },
    hasAccess: { type: Boolean, default: false },
    accessLevel: { type: String, enum: ['read', 'write', 'admin'], default: 'read' },
    lastAccessed: Date,
    requestedAt: Date,
    approvedBy: String,
    approvedAt: Date,
    expiresAt: Date, // Optional expiration for temporary access
    accessCount: { type: Number, default: 0 },
    // Access preferences
    preferences: {
      autoInsertCookies: { type: Boolean, default: false },
      notifyOnUpdates: { type: Boolean, default: true },
      allowedCategories: [{ type: String, enum: ['authentication', 'session', 'preference', 'tracking', 'functional'] }]
    }
  }],
  cookieInsertions: [{
    website: String,
    timestamp: Date,
    success: Boolean
  }],
  accessRequests: [{
    website: String,
    reason: String,
    requestedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ['pending', 'approved', 'denied'], default: 'pending' },
    reviewedBy: String,
    reviewedAt: Date
  }],
  // Single-session enforcement fields
  phoneCountryCode: { type: String, trim: true },
  phoneNumber: { type: String, trim: true },
  tokenVersion: { type: Number, default: 0 },
  currentSessionId: { type: String }
}, { 
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.passwordHash;
      return ret;
    }
  }
});

export const User = mongoose.model('User', userSchema);



