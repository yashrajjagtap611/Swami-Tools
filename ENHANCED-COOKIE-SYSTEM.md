# Enhanced Website-Specific Cookie System

## 🎯 Overview

This enhanced system provides granular control over cookie data with website-specific storage, automatic cleanup, and advanced access control features.

## 🆕 Key Features

### 1. **Website-Specific Cookie Storage**
- Cookies are now stored per website domain
- Each website has its own cookie bundle with versioning
- Automatic cleanup when admin updates cookies for a website

### 2. **Cookie Categorization**
- **Authentication**: Login tokens, session cookies, auth cookies
- **Session**: Session IDs, temporary session data
- **Preference**: User settings, configuration cookies
- **Tracking**: Analytics, tracking cookies (GA, etc.)
- **Functional**: General functional cookies

### 3. **Enhanced Access Control**
- **Access Levels**: `read`, `write`, `admin`
- **Category Filtering**: Users can control which cookie categories they access
- **Temporary Access**: Optional expiration dates for permissions
- **Access Statistics**: Track usage per user and website

### 4. **Cookie Versioning & History**
- Automatic versioning when cookies are updated
- History of previous versions (keeps last 5)
- Rollback capability for admins

### 5. **User Preferences**
- Auto-insert cookies option
- Notification preferences for updates
- Category-based filtering preferences

## 🔧 API Endpoints

### Website Cookie Management

#### Upload Cookies for Specific Website (Admin)
```http
POST /api/website-cookies/upload/{website}
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "cookies": [...],
  "replaceExisting": true
}
```

#### Get Cookies for Website
```http
GET /api/website-cookies/get/{website}?includeMetadata=true
Authorization: Bearer {token}
```

#### List All Websites (Admin)
```http
GET /api/website-cookies/websites
Authorization: Bearer {admin_token}
```

#### Delete Website Cookies (Admin)
```http
DELETE /api/website-cookies/website/{website}
Authorization: Bearer {admin_token}
```

#### Request Access to Website
```http
POST /api/website-cookies/request-access/{website}
Authorization: Bearer {token}
Content-Type: application/json

{
  "reason": "Need access for testing"
}
```

## 📊 Data Models

### WebsiteCookieBundle
```javascript
{
  website: String,           // Domain (e.g., "chatgpt.com")
  cookies: [{
    name: String,
    value: String,
    domain: String,
    path: String,
    secure: Boolean,
    httpOnly: Boolean,
    sameSite: String,
    expirationDate: Number,
    category: String,        // NEW: Cookie category
    isEssential: Boolean     // NEW: Essential cookie flag
  }],
  version: Number,           // NEW: Version control
  previousVersions: [...],   // NEW: Version history
  uploadedBy: ObjectId,
  uploadedAt: Date,
  lastUpdated: Date,         // NEW: Last update timestamp
  isActive: Boolean,         // NEW: Soft delete flag
  accessCount: Number,       // NEW: Usage statistics
  lastAccessed: Date,        // NEW: Last access time
  lastAccessedBy: ObjectId   // NEW: Last user who accessed
}
```

### Enhanced User Permissions
```javascript
websitePermissions: [{
  website: String,
  hasAccess: Boolean,
  accessLevel: String,       // NEW: 'read', 'write', 'admin'
  lastAccessed: Date,
  approvedBy: String,
  approvedAt: Date,          // NEW: Approval timestamp
  expiresAt: Date,          // NEW: Optional expiration
  accessCount: Number,       // NEW: Usage counter
  preferences: {             // NEW: User preferences
    autoInsertCookies: Boolean,
    notifyOnUpdates: Boolean,
    allowedCategories: [String]
  }
}]
```

## 🚀 Usage Examples

### 1. Admin Uploads Website-Specific Cookies

```javascript
// Upload cookies specifically for chatgpt.com
const response = await fetch('/api/website-cookies/upload/chatgpt.com', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    cookies: [
      {
        name: '__Secure-next-auth.session-token',
        value: 'session_value',
        domain: '.chatgpt.com',
        secure: true,
        httpOnly: true
      }
    ],
    replaceExisting: true  // This will cleanup old cookies
  })
});
```

### 2. User Gets Website-Specific Cookies

```javascript
// Get cookies only for chatgpt.com
const response = await fetch('/api/website-cookies/get/chatgpt.com?includeMetadata=true', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});

const data = await response.json();
// Returns only cookies for chatgpt.com with metadata
```

### 3. User Requests Access

```javascript
// Request access to a new website
const response = await fetch('/api/website-cookies/request-access/example.com', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${userToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    reason: 'Need access for development testing'
  })
});
```

## 🔄 Migration from Old System

The migration script (`migrate-to-website-cookies.js`) automatically:

1. **Converts existing CookieBundle** to website-specific WebsiteCookieBundle
2. **Groups cookies by domain** and creates separate bundles
3. **Categorizes cookies** automatically based on naming patterns
4. **Updates user permissions** with new structure
5. **Preserves all existing data** while enhancing it

## 🎛️ Enhanced Extension Features

### New Popup Features (enhanced-popup.js)

1. **Website-Specific Cookie Insertion**
   - Automatically detects current website
   - Shows cookie metadata (version, count, categories)
   - Displays access statistics

2. **Access Request Dialog**
   - Users can request access to blocked websites
   - Reason field for access requests
   - Automatic admin notification

3. **Admin Website Management**
   - Upload cookies for specific websites
   - View all websites with cookie counts
   - See version and access statistics

4. **Cookie Information Display**
   - Shows cookie categories and counts
   - Version information
   - Last update timestamps
   - Access statistics

## 🔒 Security Enhancements

### 1. **Granular Permissions**
- Users only get cookies for websites they have access to
- Category-based filtering prevents unwanted cookie types
- Temporary access with expiration dates

### 2. **Audit Trail**
- All cookie access is logged with timestamps
- Version history tracks all changes
- User access statistics for monitoring

### 3. **Automatic Cleanup**
- Old cookie versions are automatically cleaned up
- Replaced cookies are properly versioned
- Soft delete prevents accidental data loss

## 📈 Benefits

### For Administrators:
- **Better Control**: Upload cookies per website, not globally
- **Automatic Cleanup**: Old cookies are replaced, not accumulated
- **Usage Tracking**: See which websites and users access cookies most
- **Version Control**: Roll back to previous cookie versions if needed

### For Users:
- **Relevant Cookies**: Only get cookies for websites you're accessing
- **Category Control**: Choose which types of cookies to use
- **Access Requests**: Easy way to request access to new websites
- **Better Performance**: Faster cookie retrieval with website-specific queries

### For System:
- **Scalability**: Better database performance with indexed queries
- **Maintainability**: Clear separation of concerns per website
- **Reliability**: Version control and backup systems
- **Monitoring**: Comprehensive usage statistics and audit trails

## 🛠️ Setup Instructions

1. **Run Migration**:
   ```bash
   cd server
   node migrate-to-website-cookies.js
   ```

2. **Update Server** (already done):
   - New routes added to server.js
   - Enhanced models created
   - Migration script available

3. **Use Enhanced Extension**:
   - Replace popup.js with enhanced-popup.js
   - New UI features for website-specific control
   - Better error handling and user feedback

4. **Test System**:
   ```bash
   node test-website-cookies.js
   ```

## 🎯 Result

Your cookie system now provides:
- ✅ **Website-specific cookie storage and control**
- ✅ **Automatic cleanup when admin updates cookies**
- ✅ **Granular user permissions and preferences**
- ✅ **Cookie categorization and filtering**
- ✅ **Version control and audit trails**
- ✅ **Enhanced security and access control**
- ✅ **Better performance and scalability**

The system maintains backward compatibility while providing powerful new features for managing cookies across multiple websites efficiently and securely.
