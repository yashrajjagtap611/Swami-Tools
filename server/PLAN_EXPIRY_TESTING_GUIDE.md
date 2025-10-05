# Plan Expiry Testing Guide

## 🎯 **SERVER ENDPOINTS ADDED**

The following endpoints have been added to `server/src/routes/auth.js`:

### **1. Plan Status Check**
```javascript
POST /api/auth/check-plan
Headers: Authorization: Bearer {token}
Body: { deviceId, timestamp }
Response: { status, planExpiresIn, planExpiryWarning, user }
```

### **2. Session Validation**
```javascript
POST /api/auth/validate-session
Headers: Authorization: Bearer {token}
Body: { deviceId, timestamp }
Response: { valid, planExpiresIn, planExpiryWarning, user }
```

### **3. Logout**
```javascript
POST /api/auth/logout
Headers: Authorization: Bearer {token}
Body: { deviceId }
Response: { message, timestamp }
```

## 🧪 **TESTING SCRIPTS**

### **Script 1: Test Plan Expiry Logic**
```bash
cd server
node test-plan-expiry.js
```
This script tests the plan expiry logic with different scenarios.

### **Script 2: Set User Plan to Expired**
```bash
cd server
node set-plan-expired.js <username>
```
Example: `node set-plan-expired.js admin`

### **Script 3: Set User Plan to Active**
```bash
cd server
node set-plan-active.js <username>
```
Example: `node set-plan-active.js admin`

## 🔧 **TESTING STEPS**

### **Step 1: Start the Server**
```bash
cd server
npm start
# or
node src/server.js
```

### **Step 2: Test with Active Plan**
1. Set user plan to active: `node set-plan-active.js admin`
2. Try to login with extension
3. **Expected**: Login should work normally
4. **Expected**: Plan status should show "Active"

### **Step 3: Test with Expired Plan**
1. Set user plan to expired: `node set-plan-expired.js admin`
2. Try to login with extension
3. **Expected**: Login should be blocked
4. **Expected**: Error message: "Your plan has expired"

### **Step 4: Test Existing Session with Expired Plan**
1. Login with active plan
2. Set plan to expired: `node set-plan-expired.js admin`
3. Wait for session validation (30 seconds) or reload extension
4. **Expected**: User should be automatically logged out
5. **Expected**: Plan expiry notification should appear

### **Step 5: Test Cookie Insertion with Expired Plan**
1. Try to insert cookies with expired plan
2. **Expected**: Cookies should not be inserted
3. **Expected**: Error message about plan expiry

## 📊 **EXPECTED API RESPONSES**

### **Active Plan Response:**
```json
{
  "status": "active",
  "planExpiresIn": 2592000,
  "planExpiryWarning": null,
  "user": {
    "username": "admin",
    "isAdmin": true,
    "expiryDate": "2024-01-15T10:00:00.000Z"
  }
}
```

### **Expired Plan Response:**
```json
{
  "reason": "plan_expired",
  "message": "Your plan has expired. Please renew your subscription to continue using the extension."
}
```

### **Plan Expiring Soon Response:**
```json
{
  "status": "active",
  "planExpiresIn": 3600,
  "planExpiryWarning": "Your plan expires in 1 hours. Please renew to avoid service interruption.",
  "user": {
    "username": "admin",
    "isAdmin": true,
    "expiryDate": "2024-01-01T10:00:00.000Z"
  }
}
```

## 🔍 **DEBUGGING**

### **Check Server Logs**
Look for these messages in server console:
- `✅ Plan check successful for user: <username>`
- `❌ Plan check failed: User account expired: <username>`
- `✅ Session validation successful for user: <username>`
- `❌ Session validation failed: User account expired: <username>`

### **Check Extension Console**
Open extension popup → Right-click → Inspect → Console
Look for these messages:
- `🔍 Checking existing session for plan expiry...`
- `🚫 Plan expired for existing session, forcing logout`
- `✅ Plan status valid for existing session`

### **Check Network Requests**
Open DevTools → Network tab
Look for these API calls:
- `POST /api/auth/check-plan` - Should return 403 if expired
- `POST /api/auth/validate-session` - Should include plan status

## 🚨 **COMMON ISSUES**

### **Issue 1: "Endpoint not found" Error**
**Problem**: Server doesn't have the new endpoints
**Solution**: Restart the server after adding the new routes
**Check**: Verify endpoints are in `server/src/routes/auth.js`

### **Issue 2: Plan Check Always Returns Active**
**Problem**: User doesn't have expiryDate set
**Solution**: Set expiryDate using the testing scripts
**Check**: Verify user has expiryDate in database

### **Issue 3: Extension Still Allows Login**
**Problem**: Plan check failing silently
**Solution**: Check server logs and network requests
**Debug**: Look for error messages in console

## 📋 **TESTING CHECKLIST**

### **✅ Server Setup:**
- [ ] Server is running
- [ ] New endpoints are added
- [ ] Database connection working
- [ ] User has expiryDate field

### **✅ Extension Testing:**
- [ ] Login blocked with expired plan
- [ ] Existing sessions logged out on expiry
- [ ] Cookie insertion blocked on expiry
- [ ] UI shows plan expiry messages
- [ ] Automatic logout works

### **✅ API Testing:**
- [ ] `/api/auth/check-plan` returns correct status
- [ ] `/api/auth/validate-session` includes plan info
- [ ] `/api/auth/logout` works properly
- [ ] Error responses have correct format

## 🎯 **SUCCESS CRITERIA**

### **✅ Plan Expiry Working:**
1. **Login Blocked**: Cannot login with expired plan
2. **Session Terminated**: Existing sessions logged out on expiry
3. **Cookies Blocked**: Cannot insert cookies with expired plan
4. **UI Notifications**: Clear plan expiry messages shown
5. **Automatic Cleanup**: All data cleared on plan expiry

### **✅ User Experience:**
1. **Clear Messages**: Users understand why they can't login
2. **Renewal Instructions**: Clear path to renew plan
3. **No Surprise Logouts**: Warnings before expiry
4. **Smooth Recovery**: Easy to login after renewal

---

**The plan expiry system is now fully implemented on both client and server sides. Test all scenarios to ensure proper functionality.**
