# ChatGPT Client-Server Extension Updates

## Overview
Updated the client-side, server, and extension to manage user access, login expiry, and website access permissions with comprehensive session management.

## Key Features Added

### 1. Session Management
- **Token Expiry Tracking**: Automatic session expiry checking with configurable timeout
- **Activity Monitoring**: Tracks user activity and auto-logout on inactivity
- **Session Refresh**: Ability to extend sessions before expiry
- **Session Warnings**: Visual warnings when session is about to expire

### 2. Website Access Permissions
- **Permission-Based Access**: Users can only access websites they have permission for
- **Access Request System**: Users can request access to new websites
- **Admin Approval Workflow**: Admins can approve/deny access requests
- **Website-Specific Cookie Filtering**: Cookies are filtered based on website permissions

### 3. User Management Enhancements
- **User Status Control**: Admins can activate/deactivate user accounts
- **Session Timeout Configuration**: Users can set their own session timeout (5-480 minutes)
- **Enhanced User Profiles**: Extended user model with additional security fields

## Files Modified

### Client-Side (`/client/src/`)

#### Types (`types/index.ts`)
- Added `tokenExpiry`, `isActive`, `sessionTimeout` to User interface
- Added `SessionInfo` interface for session management
- Enhanced `AuthResponse` with expiry information

#### Services (`services/api.ts`)
- **Session Management**: Added comprehensive session checking and refresh
- **Activity Tracking**: Automatic activity updates on API calls
- **Website Access Control**: Added access checking before cookie operations
- **Admin APIs**: Added endpoints for managing users and access requests

#### Components
- **SessionManager** (`components/SessionManager.tsx`): Handles session expiry warnings and refresh
- **WebsitePermissions** (`components/WebsitePermissions.tsx`): Manages website access permissions

#### Pages
- **Settings** (`pages/Settings.tsx`): Enhanced with session timeout and website permissions
- **AdminPanel** (`pages/AdminPanel.tsx`): New admin interface for managing access requests

#### App (`App.tsx`)
- Integrated SessionManager for application-wide session management

### Server-Side (`/server/src/`)

#### Models (`models/User.js`)
- Added `isActive`, `sessionTimeout`, `accessRequests` fields
- Enhanced `websitePermissions` with approval tracking

#### Middleware (`middleware/auth.js`)
- **Enhanced Auth Middleware**: Checks user active status
- **Website Access Middleware**: Validates website permissions
- **Better Error Handling**: Specific error codes for different scenarios

#### Routes
- **Auth Routes** (`routes/auth.js`): Added token refresh and session management
- **User Routes** (`routes/users.js`): Added access management and admin endpoints
- **Cookie Routes** (`routes/cookies.js`): Added website access validation

### Extension (`/Extension/`)

#### Popup (`popup.js`)
- **Session Management**: Automatic session expiry checking and warnings
- **Website-Specific Operations**: Cookie insertion based on current website
- **Access Control**: Checks website permissions before operations
- **Enhanced Error Handling**: Better user feedback for access denied scenarios

#### Service Worker (`service_worker.js`)
- **Website-Specific Cookie Setting**: Improved cookie insertion for specific websites
- **Better Error Reporting**: Detailed error messages and success tracking

#### Popup HTML (`popup.html`)
- **Enhanced Styling**: Added CSS for session warnings and access denied messages

## Security Enhancements

### 1. Session Security
- Configurable session timeouts (5-480 minutes)
- Automatic logout on inactivity
- Secure session token storage and validation
- Session refresh mechanism to prevent unnecessary logouts

### 2. Access Control
- Website-specific permissions system
- Admin approval workflow for new website access
- Automatic access validation before cookie operations
- User activity tracking and audit trail

### 3. User Management
- User account activation/deactivation
- Enhanced user profiles with security metadata
- Admin-only endpoints with proper authorization
- Comprehensive access request management

## API Endpoints Added

### User Management
- `GET /api/users/check-access/:website` - Check website access
- `POST /api/users/request-access` - Request website access
- `PUT /api/users/session-timeout` - Update session timeout
- `GET /api/users/access-requests` - Get all access requests (admin)
- `PUT /api/users/access-requests/:id` - Review access request (admin)
- `GET /api/users/admin/users` - Get all users (admin)
- `PUT /api/users/admin/users/:id/status` - Update user status (admin)

### Authentication
- `POST /api/auth/refresh` - Refresh authentication token

### Enhanced Cookie Management
- Website-specific cookie filtering
- Access permission validation
- Improved error handling and tracking

## Usage Instructions

### For Users
1. **Session Management**: Sessions automatically expire based on configured timeout
2. **Website Access**: Request access to new websites through Settings page
3. **Session Extension**: Extend sessions when warned about expiry
4. **Cookie Operations**: Only works on websites with granted permissions

### For Admins
1. **User Management**: View and manage all users through Admin Panel
2. **Access Requests**: Approve/deny website access requests
3. **User Status**: Activate/deactivate user accounts
4. **Cookie Management**: Upload and manage cookie bundles

### Configuration
- **Session Timeout**: Configurable per user (5-480 minutes)
- **Website Permissions**: Granular control over website access
- **Admin Controls**: Comprehensive user and access management

## Security Considerations
- All sensitive operations require authentication
- Website access is validated on both client and server
- Session tokens have configurable expiry times
- User activity is tracked for security auditing
- Admin operations are properly authorized and logged