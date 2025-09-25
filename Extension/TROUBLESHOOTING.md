# Cookie Insertion Troubleshooting Guide

## Single Device Login Feature

### How It Works
- Only one active session per user account is allowed
- Logging in on a new device automatically logs out the previous session
- Extension-related cookies are automatically cleared on forced logout
- Session validation occurs every 30 seconds

### Common Single Device Login Issues

#### "Logged out from another device" Message
- **Cause**: Someone logged in with your credentials on another device/browser
- **Solution**: This is expected behavior for security
- **Action**: Log in again if this was you, or check account security if unexpected

#### Session Validation Errors
- **Cause**: Network connectivity issues or server problems
- **Solution**: Check internet connection and server status
- **Fallback**: Extension will retry validation automatically

#### Device ID Issues
- **Cause**: Extension storage corruption
- **Solution**: Clear extension data and log in again
- **Steps**: Chrome Extensions → ChatGPT Cookie Importer → Remove → Reinstall

## Issues Identified and Fixed

### 1. Domain Mismatch (FIXED)
- **Problem**: Service worker was trying to set cookies for `chat.openai.com` but your cookies are from `chatgpt.com`
- **Solution**: Updated service worker to detect domain and use correct URL
- **Files Modified**: `service_worker.js`

### 2. Host Permissions (FIXED)
- **Problem**: Manifest only had permissions for `openai.com` domains
- **Solution**: Added permissions for `chatgpt.com` domains
- **Files Modified**: `manifest.json`

### 3. Cookie Domain Handling (FIXED)
- **Problem**: Service worker was overriding cookie domains
- **Solution**: Now properly handles original domain from cookies
- **Files Modified**: `service_worker.js`

## How to Test

### Step 1: Reload the Extension
1. Go to `chrome://extensions/`
2. Find "ChatGPT Cookie Importer"
3. Click the reload button (🔄)
4. Make sure the extension is enabled

### Step 2: Check Console Logs
1. Open the extension popup
2. Right-click and select "Inspect"
3. Go to Console tab
4. Try inserting cookies and watch for logs

### Step 3: Verify Cookies
1. After inserting cookies, click "Verify Cookies" button
2. Check if cookies are actually present in the browser

### Step 4: Check Browser Cookies
1. Go to `chrome://settings/cookies`
2. Search for "chatgpt.com"
3. Verify cookies are present

## Common Issues

### Cookies Not Appearing
- Check if the extension has proper permissions
- Verify the server is running (`http://localhost:3000`)
- Check browser console for errors

### Permission Errors
- Make sure the extension is reloaded after manifest changes
- Check if cookies permission is granted
- Verify host permissions include `chatgpt.com`

### Server Connection Issues
- Ensure MongoDB is running
- Check if server is on correct port
- Verify CORS settings

## Debug Steps

1. **Check Extension Logs**:
   - Open popup → Right-click → Inspect → Console
   - Look for cookie insertion logs

2. **Test Individual Cookies**:
   - Use "Test Current Cookies" button
   - Check if single cookie insertion works

3. **Verify Server Response**:
   - Check Network tab in DevTools
   - Verify cookies are being fetched correctly

4. **Check Cookie Format**:
   - Ensure cookies have required fields: name, value, domain
   - Verify domain format (with/without leading dot)

## Expected Behavior

After successful cookie insertion:
- Status should show "Cookies inserted successfully!"
- "Verify Cookies" should show the number of cookies found
- Cookies should be visible in `chrome://settings/cookies`
- ChatGPT should recognize the session

## Still Having Issues?

1. Check the browser console for specific error messages
2. Verify the extension permissions in `chrome://extensions/`
3. Test with a simple cookie first
4. Ensure the server is running and accessible
