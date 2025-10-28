// Helper function to handle API responses
async function handleApiResponse(response) {
  try {
    // First check if the response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Server did not return JSON');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }

    return data;
  } catch (error) {
    if (error.name === 'SyntaxError') {
      console.error('JSON Parse Error:', error);
      throw new Error('Invalid JSON response from server');
    }
    throw error;
  }
}

  // Test server connectivity
  async function testServerConnection() {
    const serverUrl = getServerUrl();
  
  try {
    showStatus('Testing server connection...', 'info');
    
    // Test basic connectivity
    const healthResponse = await fetch(`${serverUrl}/api/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    const healthData = await healthResponse.json();
    // Test Chrome extension specific endpoint
    const testResponse = await fetch(`${serverUrl}/api/test-extension`);
    if (!testResponse.ok) {
      throw new Error(`Extension test failed: ${testResponse.status}`);
    }
    const testData = await testResponse.json();
    
    showStatus('Server connection successful!', 'success');
    return true;
    
  } catch (error) {
    showStatus(`Connection test failed: ${error.message}`, 'error');
    return false;
  }
}

// Helper function to get server URL
function getServerUrl() {
  return localStorage.getItem('apiBase') || 'https://swami-tools-server.onrender.com';
}

document.addEventListener('DOMContentLoaded', function() {
  const serverUrl = getServerUrl();
  
  // Cache DOM elements
  const loginForm = document.getElementById('login-form');
  const afterLogin = document.getElementById('after-login');
  const userView = document.getElementById('user-view');
  const adminView = document.getElementById('admin-view');
  const createUserForm = document.getElementById('create-user-form');
  const loginStatus = document.getElementById('login-status');
  const userInfo = document.getElementById('user-info');
  
  // Session validation variables
  let sessionValidationInterval = null;
  
  // Generate unique device ID for this browser extension
  function generateDeviceId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['deviceId'], function(result) {
        if (result.deviceId) {
          resolve(result.deviceId);
        } else {
          const deviceId = 'ext_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
          chrome.storage.local.set({ deviceId }, () => {
            resolve(deviceId);
          });
        }
      });
    });
  }
  
  // Clear all extension-related cookies
  async function clearExtensionCookies() {
    try {
      console.log('🧹 Clearing extension-related cookies...');
      
      const domains = ['chatgpt.com', '.chatgpt.com', 'openai.com', '.openai.com', 'api.openai.com'];
      let totalCleared = 0;
      
      for (const domain of domains) {
        try {
          const cookies = await chrome.cookies.getAll({ domain });
          console.log(`Found ${cookies.length} cookies for domain: ${domain}`);
          
          for (const cookie of cookies) {
            try {
              const url = `https://${cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain}${cookie.path}`;
              await chrome.cookies.remove({ url, name: cookie.name });
              totalCleared++;
              console.log(`Removed cookie: ${cookie.name} from ${cookie.domain}`);
            } catch (err) {
              console.error(`Failed to remove cookie ${cookie.name}:`, err);
            }
          }
        } catch (err) {
          console.error(`Failed to get cookies for domain ${domain}:`, err);
        }
      }
      
      console.log(`🧹 Total cookies cleared: ${totalCleared}`);
      return totalCleared;
    } catch (error) {
      console.error('Error clearing extension cookies:', error);
      return 0;
    }
  }
  
  // Handle forced logout (when logged out from another device)
  async function handleForcedLogout(reason) {
    console.log('🚪 Forced logout:', reason);
    
    // Stop session validation
    stopSessionValidation();
    
    // Clear extension cookies
    await clearExtensionCookies();
    
    // Clear local storage
    chrome.storage.local.remove(['token', 'userInfo', 'sessionData', 'deviceId'], () => {
      // Reset UI
      loginForm.style.display = 'block';
      afterLogin.style.display = 'none';
      userView.style.display = 'none';
      adminView.style.display = 'none';
      createUserForm.style.display = 'none';
      
      showStatus(reason || 'You have been logged out from another device', 'error');
    });
  }
  
  // Enhanced session validation with plan expiry checking
  function startSessionValidation() {
    if (sessionValidationInterval) {
      clearInterval(sessionValidationInterval);
    }
    
    console.log('🔄 Starting session validation with plan expiry checks');
    sessionValidationInterval = setInterval(async () => {
      try {
        await validateSessionAndPlan();
      } catch (error) {
        console.error('Session validation error:', error);
      }
    }, 30000); // Check every 30 seconds
  }
  
  // Stop session validation
  function stopSessionValidation() {
    if (sessionValidationInterval) {
      console.log('🛑 Stopping session validation');
      clearInterval(sessionValidationInterval);
      sessionValidationInterval = null;
    }
  }
  
  // Validate session and check plan status
  async function validateSessionAndPlan() {
    try {
      const token = await getStoredToken();
      if (!token) return;
      
      const response = await fetch(`${serverUrl}/api/auth/validate-session`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId: await getDeviceId(),
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // Handle plan expiry
        if (response.status === 403 && errorData.reason === 'plan_expired') {
          console.log('🚫 Plan expired during session validation');
          await handlePlanExpiry('Your plan has expired. Please renew your subscription to continue using the extension.');
          return;
        }
        
        // Handle other session issues
        if (response.status === 401 || response.status === 403) {
          console.log('🚫 Session invalid during validation');
          await handleForcedLogout('Session expired or invalid. Please log in again.');
          return;
        }
      }
      
      const data = await response.json();
      
      // Update plan status display
      updatePlanStatus();
      
      // Check for plan expiry warnings
      if (data.planExpiryWarning) {
        showPlanExpiryWarning(data.planExpiryWarning);
      }
      
      // Check if plan is about to expire
      if (data.planExpiresIn && data.planExpiresIn < 86400) { // Less than 24 hours
        const hoursLeft = Math.floor(data.planExpiresIn / 3600);
        showPlanExpiryWarning(`Your plan expires in ${hoursLeft} hours. Please renew to avoid service interruption.`);
      }
      
    } catch (error) {
      console.error('Session validation failed:', error);
      // Don't logout on network errors, just log the error
    }
  }
  
  // Handle plan expiry - clear cookies and logout
  async function handlePlanExpiry(message) {
    console.log('🚫 Handling plan expiry:', message);
    
    // Stop session validation
    stopSessionValidation();
    
    // Clear all extension cookies to prevent unauthorized access
    await clearExtensionCookies();
    
    // Clear local storage
    chrome.storage.local.remove(['token', 'userInfo', 'sessionData', 'deviceId'], () => {
      // Reset UI
      loginForm.style.display = 'block';
      afterLogin.style.display = 'none';
      userView.style.display = 'none';
      adminView.style.display = 'none';
      createUserForm.style.display = 'none';
      
      // Show plan expiry message
      showStatus(message, 'error');
      
      // Show plan expiry notification
      showPlanExpiryNotification(message);
    });
  }
  
  // Show plan expiry notification
  function showPlanExpiryNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'plan-expiry-notification';
    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">⚠️</div>
        <div class="notification-text">
          <h4>Plan Expired</h4>
          <p>${message}</p>
          <p>All cookies have been cleared for security.</p>
        </div>
        <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;
    
    // Add CSS for notification
    const style = document.createElement('style');
    style.textContent = `
      .plan-expiry-notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff3cd;
        border: 2px solid #ffc107;
        border-radius: 8px;
        padding: 0;
        margin: 0;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      }
      .notification-content {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 16px;
      }
      .notification-icon {
        font-size: 24px;
        flex-shrink: 0;
      }
      .notification-text {
        flex: 1;
      }
      .notification-text h4 {
        margin: 0 0 8px 0;
        color: #856404;
        font-size: 16px;
      }
      .notification-text p {
        margin: 0 0 8px 0;
        color: #856404;
        font-size: 14px;
        line-height: 1.4;
      }
      .notification-close {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #856404;
        padding: 4px;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .notification-close:hover {
        background: rgba(0,0,0,0.1);
      }
    `;
    
    if (!document.getElementById('plan-expiry-styles')) {
      style.id = 'plan-expiry-styles';
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Auto-remove after 15 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 15000);
  }
  
  // Get device ID
  async function getDeviceId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['deviceId'], function(result) {
        resolve(result.deviceId || null);
      });
    });
  }
  
  // Check consent status and show consent notice if needed
  checkConsentStatus();
  
  // Test connection on page load
  testServerConnection();
  
  // Check for existing expired plan sessions
  checkForExpiredPlanSessions();
  
  // Check for expired plan sessions on extension load
  async function checkForExpiredPlanSessions() {
    try {
      const result = await new Promise((resolve) => {
        chrome.storage.local.get(['token', 'userInfo', 'sessionData'], resolve);
      });
      
      if (result.token && result.userInfo) {
        console.log('🔍 Checking existing session for plan expiry...');
        
        const planCheckResponse = await fetch(`${serverUrl}/api/auth/check-plan`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${result.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            deviceId: await getDeviceId(),
            timestamp: new Date().toISOString()
          })
        });

        if (!planCheckResponse.ok) {
          const errorData = await planCheckResponse.json().catch(() => ({}));
          
          if (planCheckResponse.status === 403 && errorData.reason === 'plan_expired') {
            console.log('🚫 Plan expired for existing session, forcing logout');
            await handlePlanExpiry('Your plan has expired. Please renew your subscription to continue using the extension.');
            return;
          }
        }
        
        console.log('✅ Plan status valid for existing session');
      }
    } catch (error) {
      console.error('Error checking expired plan sessions:', error);
    }
  }
  
  // Login handler
  document.getElementById('login-btn').addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    if (!username || !password) {
      showStatus('Please enter both username and password', 'error');
      return;
    }

    try {
      showStatus('Connecting to server...', 'info');
      
      const deviceId = await generateDeviceId();
      
      const response = await fetch(`${serverUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password,
          deviceId: deviceId,
          deviceType: 'extension',
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            extensionVersion: chrome.runtime.getManifest().version,
            timestamp: new Date().toISOString()
          }
        })
      });


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        
        // Handle specific error messages
        if (errorData.message && (errorData.message.includes('expired') || errorData.message.includes('inactive'))) {
          throw new Error(errorData.message);
        }
        
        // Handle device limit or forced logout
        if (errorData.message && errorData.message.includes('logged out from another device')) {
          showStatus('Previous session has been terminated. Logging in...', 'info');
        }
        
        if (response.status !== 200) {
          throw new Error(`Server error (${response.status}): ${errorData.message || 'Login failed'}`);
        }
      }

      const data = await response.json();
      
      // Check plan status immediately after login
      showStatus('Checking plan status...', 'info');
      
      try {
        const planCheckResponse = await fetch(`${serverUrl}/api/auth/check-plan`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${data.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            deviceId: deviceId,
            timestamp: new Date().toISOString()
          })
        });

        if (!planCheckResponse.ok) {
          const errorData = await planCheckResponse.json().catch(() => ({}));
          
          if (planCheckResponse.status === 403 && errorData.reason === 'plan_expired') {
            showStatus('Your plan has expired. Please renew your subscription to continue using the extension.', 'error');
            return; // Don't proceed with login
          }
          
          throw new Error(errorData.message || 'Plan check failed');
        }

        const planData = await planCheckResponse.json();
        
        // Check if plan is about to expire
        if (planData.planExpiresIn && planData.planExpiresIn < 3600) { // Less than 1 hour
          const minutesLeft = Math.floor(planData.planExpiresIn / 60);
          showPlanExpiryWarning(`Your plan expires in ${minutesLeft} minutes. Please renew to avoid service interruption.`);
        }
        
      } catch (planError) {
        console.error('Plan check failed during login:', planError);
        // Continue with login if plan check fails (network issues)
        showStatus('Plan status check failed, proceeding with login...', 'info');
      }
      
      // Store session info with device ID
      chrome.storage.local.set({
        token: data.token,
        userInfo: data.user,
        deviceId: deviceId,
        sessionData: JSON.stringify({
          token: data.token,
          expiresAt: data.expiresAt,
          user: data.user,
          deviceId: deviceId,
          loginTime: new Date().toISOString()
        })
      }, () => {
        showLoggedInView(data.user);
        // Populate allowed websites immediately after login
        try { loadAllowedWebsites(data.token); } catch (e) {}
      });
      
      showStatus('Signed in successfully!', 'success');
      
      // Start session validation
      startSessionValidation();
      
    } catch (error) {
      
      let errorMessage = 'Login failed';
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        errorMessage = `Cannot connect to server at ${serverUrl}. Please check:\n` +
                      '1. Server is running\n' +
                      '2. Server port is correct\n' +
                      '3. No firewall blocking connection';
      } else if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
        errorMessage = 'Network error. Check your internet connection.';
      } else if (error.message.includes('Server error')) {
        errorMessage = error.message;
      } else {
        errorMessage = `Error: ${error.message}`;
      }
      
      showStatus(errorMessage, 'error');
      loginStatus.textContent = errorMessage;
      loginStatus.className = 'status error';
    }
  });

  // Apply session handler (for users)
  document.getElementById('insert-cookies').addEventListener('click', async () => {
    try {
      const token = await getStoredToken();
      if (!token) {
        showStatus('Not signed in. Please sign in first.', 'error');
        return;
      }

      // Check plan status before proceeding
      showStatus('Checking plan status...', 'info');
      const planCheckResponse = await fetch(`${serverUrl}/api/auth/check-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId: await getDeviceId(),
          timestamp: new Date().toISOString()
        })
      });

      if (!planCheckResponse.ok) {
        const errorData = await planCheckResponse.json().catch(() => ({}));
        
        if (planCheckResponse.status === 403 && errorData.reason === 'plan_expired') {
          await handlePlanExpiry('Your plan has expired. Please renew your subscription to continue using the extension.');
          return;
        }
        
        throw new Error(errorData.message || 'Plan check failed');
      }

      const planData = await planCheckResponse.json();
      
      // Check if plan is about to expire
      if (planData.planExpiresIn && planData.planExpiresIn < 3600) { // Less than 1 hour
        const minutesLeft = Math.floor(planData.planExpiresIn / 60);
        showPlanExpiryWarning(`Your plan expires in ${minutesLeft} minutes. Please renew to avoid service interruption.`);
      }

      // Get current tab to determine website
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      const currentTab = tabs[0];
      
      if (!currentTab) {
        showStatus('No active tab found. Please make sure you have an active browser tab.', 'error');
        return;
      }
      
      if (!currentTab.url) {
        showStatus('Cannot access current tab URL. Please refresh the page and try again.', 'error');
        return;
      }

      // Validate URL format
      let url, website;
      try {
        url = new URL(currentTab.url);
        website = url.hostname.toLowerCase().trim();
        
        if (!website || website === '') {
          throw new Error('Invalid hostname');
        }
        
        // Skip chrome:// and other internal URLs
        if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
          showStatus('Cannot apply session on browser internal pages. Please navigate to a regular website.', 'error');
          return;
        }
        
        // Skip localhost and IP addresses for better UX message
        if (website === 'localhost' || website.match(/^\d+\.\d+\.\d+\.\d+$/)) {
          showStatus(`Detected local development site (${website}). Make sure your server allows this domain.`, 'info');
        }
        
      } catch (error) {
        showStatus(`Invalid URL format: ${currentTab.url}. Please navigate to a valid website.`, 'error');
        return;
      }
      
      // Check website access first
      showStatus('Checking website access...', 'info');
      
      const accessResponse = await fetch(`${serverUrl}/api/users/check-access/${encodeURIComponent(website)}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const accessData = await accessResponse.json();
      if (!accessData.hasAccess) {
        showStatus(accessData.message || 'Access denied to this website', 'error');
        return;
      }

      showStatus('Fetching session data...', 'info');
      
      const response = await fetch(`${serverUrl}/api/cookies/get?website=${encodeURIComponent(website)}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Check for plan expiry warning headers
      const expiryWarning = response.headers.get('X-Plan-Expiry-Warning');
      if (expiryWarning) {
        console.log('⚠️ Plan expiry warning:', expiryWarning);
        showPlanExpiryWarning(expiryWarning);
      }

      const data = await handleApiResponse(response);
      console.log('🔐 Server response:', data);
      console.log(`📊 Website: ${website}, Success: ${data.success}, Items: ${data.cookies?.length || 0}`);
      
      // Handle plan expiration specifically
      if (response.status === 403 && data.reason === 'plan_expired') {
        showStatus('Your plan has expired. Please renew your subscription.', 'error');
        console.log('🚫 Plan expired, forcing logout');
        chrome.storage.local.remove(['token', 'userInfo', 'sessionData', 'deviceId']);
        setTimeout(() => window.location.reload(), 3000);
        return;
      }
      
      // Handle website access expiration
      if (response.status === 403 && data.reason === 'website_access_expired') {
        showStatus(`Your access to ${website} has expired. Please request renewed access.`, 'error');
        return;
      }
      
      if (!data.success) {
        console.log('❌ Session fetch failed:', data.message);
        showStatus(data.message || 'Failed to fetch session data', 'error');
        return;
      }
      
      if (!data.cookies || data.cookies.length === 0) {
        console.log('📭 No session data found for website:', website);
        showStatus(`No session data available for ${website}. Please check if a backup is uploaded and you have access.`, 'warning');
        return;
      }
      
      console.log('🔐 Session item domains found:', data.cookies.map(c => c.domain).filter(Boolean));
      
      showStatus(`Applying ${data.cookies.length} session items for ${website}...`, 'info');
      
      const result = await chrome.runtime.sendMessage({ 
        type: 'SET_COOKIES', 
        cookies: data.cookies,
        website: website
      });
      console.log('Session apply result:', result);
      
      if (result && result.success) {
        showStatus('Learning data applied successfully! Reloading page...', 'success');
        
        // Track successful insertion
        await fetch(`${serverUrl}/api/cookies/insert`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ website, cookies: data.cookies })
        });
        
        // Auto-reload the current tab after successful insertion
        try {
          const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tabs[0] && tabs[0].id) {
            // Use service worker for more reliable tab reload
            const reloadResult = await chrome.runtime.sendMessage({ 
              type: 'RELOAD_TAB', 
              tabId: tabs[0].id 
            });
            
            if (reloadResult && reloadResult.success) {
              showStatus('Page reloaded automatically!', 'success');
            } else {
              // Fallback to direct tab reload
              await chrome.tabs.reload(tabs[0].id);
              showStatus('Page reloaded automatically!', 'success');
            }
          }
        } catch (reloadError) {
          console.log('Auto-reload failed, user can manually refresh:', reloadError);
          showStatus('Learning data applied! Please refresh the page manually.', 'info');
        }
      } else {
        throw new Error(result?.error || 'Failed to apply learning data');
      }
    } catch (error) {
      console.error('Error applying session:', error);
      
      // Handle session expiry
      if (error.message.includes('Token expired') || error.message.includes('Session expired')) {
        showStatus('Session expired. Please sign in again.', 'error');
        chrome.storage.local.remove(['token', 'userInfo']);
        setTimeout(() => window.location.reload(), 2000);
        return;
      }
      
      showStatus(`Error: ${error.message}`, 'error');
    }
  });

  // Admin: Session Backups
  document.getElementById('upload-cookies').addEventListener('click', () => {
    document.getElementById('cookie-file').click();
  });

  document.getElementById('cookie-file').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const cookies = JSON.parse(e.target.result);
          const token = await getStoredToken();
          
          const response = await fetch(`${serverUrl}/api/cookies/upload`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ cookies })
          });

          if (!response.ok) throw new Error('Failed to upload session backup');
          showStatus('Session backup uploaded successfully', 'success');
        } catch (error) {
          showStatus(`Error parsing backup: ${error.message}`, 'error');
        }
      };
      reader.readAsText(file);
    } catch (error) {
      showStatus(error.message, 'error');
    }
  });

  document.getElementById('view-cookies').addEventListener('click', async () => {
    try {
      const token = await getStoredToken();
      const response = await fetch(`${serverUrl}/api/cookies`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch session backups');
      
      const bundles = await response.json();
      if (!bundles.length) {
        showStatus('No session backups available', 'info');
        return;
      }

      const cookieInfo = document.createElement('div');
      cookieInfo.className = 'cookie-info';
      cookieInfo.textContent = `Latest backup: ${bundles[0].cookies.length} items (${new Date(bundles[0].uploadedAt).toLocaleString()})`;
      document.body.appendChild(cookieInfo);
      setTimeout(() => cookieInfo.remove(), 5000);
    } catch (error) {
      showStatus(error.message, 'error');
    }
  });

  // Admin: User Management
  document.getElementById('view-users').addEventListener('click', async () => {
    try {
      const token = await getStoredToken();
      const response = await fetch(`${serverUrl}/api/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      
      const users = await response.json();
      
      const userList = document.createElement('div');
      userList.className = 'user-list';
      
      users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'user-item';
        userItem.innerHTML = `
          <span>${user.username} ${user.isAdmin ? '(Admin)' : ''}</span>
          <span>${new Date(user.createdAt).toLocaleDateString()}</span>
        `;
        userList.appendChild(userItem);
      });

      document.body.appendChild(userList);
      setTimeout(() => userList.remove(), 5000);
    } catch (error) {
      showStatus(error.message, 'error');
    }
  });

  document.getElementById('create-user').addEventListener('click', () => {
    adminView.style.display = 'none';
    createUserForm.style.display = 'block';
  });

  // Admin: Test Session Data
  document.getElementById('test-cookies').addEventListener('click', async () => {
    try {
      const token = await getStoredToken();
      const response = await fetch(`${serverUrl}/api/cookies/get`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch session data');
      
      const responseData = await response.json();
      if (!responseData.success || !responseData.cookies || !responseData.cookies.length) {
        showStatus('No session data available to test', 'error');
        return;
      }

      const cookies = responseData.cookies;
      showStatus(`Testing ${cookies.length} session items individually...`, 'info');
      
      let successCount = 0;
      let failCount = 0;
      const errors = [];
      
      // Test each cookie individually
      for (let i = 0; i < cookies.length; i++) {
        try {
          const result = await chrome.runtime.sendMessage({ 
            type: 'TEST_COOKIE', 
            cookie: cookies[i]
          });
          
          if (result && result.success) {
            successCount++;
            console.log(`Item ${i + 1}/${cookies.length}: ${cookies[i].name} - SUCCESS`);
          } else {
            failCount++;
            const error = result?.error || 'Unknown error';
            errors.push(`${cookies[i].name}: ${error}`);
            console.error(`Item ${i + 1}/${cookies.length}: ${cookies[i].name} - FAILED: ${error}`);
          }
        } catch (error) {
          failCount++;
          errors.push(`${cookies[i].name}: ${error.message}`);
          console.error(`Item ${i + 1}/${cookies.length}: ${cookies[i].name} - ERROR: ${error.message}`);
        }
      }
      
      // Show results
      if (failCount === 0) {
        showStatus(`All ${successCount} items tested successfully!`, 'success');
      } else {
        const message = `${successCount} items succeeded, ${failCount} failed`;
        showStatus(message, 'error');
        
        // Show detailed errors
        const errorInfo = document.createElement('div');
        errorInfo.className = 'cookie-info';
        errorInfo.innerHTML = `
          <h4>Session Data Test Results:</h4>
          <p><strong>Success:</strong> ${successCount}</p>
          <p><strong>Failed:</strong> ${failCount}</p>
          <h5>Failed Items:</h5>
          <ul>
            ${errors.map(e => `<li>${e}</li>`).join('')}
          </ul>
        `;
        
        document.body.appendChild(errorInfo);
        setTimeout(() => errorInfo.remove(), 10000);
      }
    } catch (error) {
      showStatus(`Session data test failed: ${error.message}`, 'error');
    }
  });

  // Test Sensitive Session Items handler
  document.getElementById('test-problematic').addEventListener('click', async () => {
    try {
      const token = await getStoredToken();
      const response = await fetch(`${serverUrl}/api/cookies/get`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch session data');
      
      const responseData = await response.json();
      if (!responseData.success || !responseData.cookies || !responseData.cookies.length) {
        showStatus('No session data available to test', 'error');
        return;
      }

      const cookies = responseData.cookies;

      // Filter for problematic cookies
      const problematicCookies = cookies.filter(cookie => 
        cookie.name.startsWith('__Host-') || 
        cookie.name.startsWith('__Secure-') ||
        cookie.name.includes('csrf') ||
        cookie.name.includes('auth') ||
        cookie.name.includes('session') ||
        cookie.name.includes('token')
      );

      if (problematicCookies.length === 0) {
        showStatus('No sensitive session items found', 'info');
        return;
      }

      showStatus(`Testing ${problematicCookies.length} sensitive items...`, 'info');
      
      let successCount = 0;
      let failCount = 0;
      const errors = [];
      
      // Test each problematic cookie individually
      for (let i = 0; i < problematicCookies.length; i++) {
        const cookie = problematicCookies[i];
        try {
          console.log(`Testing problematic cookie: ${cookie.name} (${cookie.name.startsWith('__Host-') ? '__Host-' : cookie.name.startsWith('__Secure-') ? '__Secure-' : 'other'})`);
          
          const result = await chrome.runtime.sendMessage({ 
            type: 'TEST_COOKIE', 
            cookie: cookie
          });
          
          if (result && result.success) {
            successCount++;
          console.log(`Sensitive item ${i + 1}/${problematicCookies.length}: ${cookie.name} - SUCCESS`);
          } else {
            failCount++;
            const error = result?.error || 'Unknown error';
            errors.push(`${cookie.name}: ${error}`);
            console.error(`Sensitive item ${i + 1}/${problematicCookies.length}: ${cookie.name} - FAILED: ${error}`);
          }
        } catch (error) {
          failCount++;
          errors.push(`${cookie.name}: ${error.message}`);
          console.error(`Sensitive item ${i + 1}/${problematicCookies.length}: ${cookie.name} - ERROR: ${error.message}`);
        }
      }
      
      // Show results
      if (failCount === 0) {
        showStatus(`All ${successCount} sensitive items tested successfully!`, 'success');
      } else {
        const message = `${successCount} sensitive items succeeded, ${failCount} failed`;
        showStatus(message, 'error');
        
        // Show detailed errors
        const errorInfo = document.createElement('div');
        errorInfo.className = 'cookie-info';
        errorInfo.innerHTML = `
          <h4>Sensitive Item Test Results:</h4>
          <p><strong>Success:</strong> ${successCount}</p>
          <p><strong>Failed:</strong> ${failCount}</p>
          <h5>Failed Items:</h5>
          <ul>
            ${errors.map(e => `<li>${e}</li>`).join('')}
          </ul>
        `;
        
        document.body.appendChild(errorInfo);
        setTimeout(() => errorInfo.remove(), 15000);
      }
    } catch (error) {
      showStatus(`Sensitive item test failed: ${error.message}`, 'error');
    }
  });

  // Verify Stored Session handler
  document.getElementById('verify-cookies').addEventListener('click', async () => {
    try {
      showStatus('Verifying stored session...', 'info');
      
      // Get cookies from multiple domains
      const chatgptCookies = await chrome.cookies.getAll({ domain: 'chatgpt.com' });
      const chatgptSecureCookies = await chrome.cookies.getAll({ domain: '.chatgpt.com' });
      const openaiCookies = await chrome.cookies.getAll({ domain: 'openai.com' });
      const openaiSecureCookies = await chrome.cookies.getAll({ domain: '.openai.com' });
      const apiOpenaiCookies = await chrome.cookies.getAll({ domain: 'api.openai.com' });
      
      const allCookies = [
        ...chatgptCookies, 
        ...chatgptSecureCookies, 
        ...openaiCookies, 
        ...openaiSecureCookies,
        ...apiOpenaiCookies
      ];
      
      if (allCookies.length === 0) {
        showStatus('No stored session data found for chatgpt.com or openai.com', 'error');
        return;
      }
      
      // Group cookies by domain for better display
      const cookiesByDomain = {
        'chatgpt.com': [...chatgptCookies, ...chatgptSecureCookies],
        'openai.com': [...openaiCookies, ...openaiSecureCookies],
        'api.openai.com': apiOpenaiCookies
      };
      
      const cookieInfo = document.createElement('div');
      cookieInfo.className = 'cookie-info';
      
      let infoHTML = `<h4>Found ${allCookies.length} total stored items:</h4>`;
      
      Object.entries(cookiesByDomain).forEach(([domain, cookies]) => {
        if (cookies.length > 0) {
          infoHTML += `
            <h5>${domain} (${cookies.length} items):</h5>
            <ul>
              ${cookies.slice(0, 3).map(c => `<li>${c.name}: ${c.value.substring(0, 20)}...</li>`).join('')}
              ${cookies.length > 3 ? `<li>... and ${cookies.length - 3} more</li>` : ''}
            </ul>
          `;
        }
      });
      
      cookieInfo.innerHTML = infoHTML;
      
      document.body.appendChild(cookieInfo);
      setTimeout(() => cookieInfo.remove(), 10000);
      
      showStatus(`Found ${allCookies.length} stored items across all domains`, 'success');
    } catch (error) {
      console.error('Error verifying cookies:', error);
      showStatus(`Error verifying stored session: ${error.message}`, 'error');
    }
  });

  // Admin: Create User handler
  document.getElementById('save-user').addEventListener('click', async () => {
    const username = document.getElementById('new-username').value;
    const password = document.getElementById('new-password').value;

    try {
      const token = await getStoredToken();
      const response = await fetch(`${serverUrl}/api/auth/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (response.ok) {
        showStatus('User created successfully!', 'success');
        document.getElementById('new-username').value = '';
        document.getElementById('new-password').value = '';
      } else {
        throw new Error(data.message || 'Failed to create user');
      }
    } catch (error) {
      showStatus(error.message, 'error');
    }
  });

  // Back button handler
  document.getElementById('back-to-admin').addEventListener('click', () => {
    createUserForm.style.display = 'none';
    adminView.style.display = 'block';
  });

  // Enhanced logout handler with server notification and cookie clearing
  document.querySelectorAll('#logout').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        const token = await getStoredToken();
        const deviceId = await getDeviceId();
        
        // Stop session validation first
        stopSessionValidation();
        
        // Notify server about logout
        if (token && deviceId) {
          try {
            await fetch(`${serverUrl}/api/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ deviceId })
            });
            console.log('Server notified of logout');
          } catch (error) {
            console.log('Failed to notify server of logout:', error);
          }
        }
        
        // Clear extension cookies
        const clearedCount = await clearExtensionCookies();
        console.log(`Cleared ${clearedCount} cookies during logout`);
        
      } catch (error) {
        console.log('Logout process error:', error);
      }
      
      // Clear local storage
      chrome.storage.local.remove(['token', 'userInfo', 'sessionData', 'deviceId'], () => {
        loginForm.style.display = 'block';
        afterLogin.style.display = 'none';
        userView.style.display = 'none';
        adminView.style.display = 'none';
        createUserForm.style.display = 'none';
        showStatus('Signed out successfully', 'success');
      });
    });
  });

  // Helper functions
  function showLoggedInView(userInfo) {
    loginForm.style.display = 'none';
    afterLogin.style.display = 'block';
    document.getElementById('user-info').textContent = `Welcome, ${userInfo.username}!`;
    
    // Update device status and plan status
    updateDeviceStatus();
    updatePlanStatus();

    if (userInfo.isAdmin) {
      adminView.style.display = 'block';
      userView.style.display = 'none';
    } else {
      userView.style.display = 'block';
      adminView.style.display = 'none';
    }
  }
  
  // Update device status display
  async function updateDeviceStatus() {
    try {
      const deviceId = await getDeviceId();
      const statusElement = document.getElementById('device-status');
      if (statusElement && deviceId) {
        const shortDeviceId = deviceId.substring(deviceId.length - 8);
        statusElement.textContent = `📱 Device: ${shortDeviceId} (Active Session)`;
      }
    } catch (error) {
      console.error('Error updating device status:', error);
    }
  }

  // Update plan status display
  async function updatePlanStatus() {
    try {
      const token = await getStoredToken();
      if (!token) return;

      const response = await fetch(`${serverUrl}/api/auth/check-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId: await getDeviceId(),
          timestamp: new Date().toISOString()
        })
      });

      const planStatusElement = document.getElementById('plan-status');
      if (!planStatusElement) return;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 403 && errorData.reason === 'plan_expired') {
          planStatusElement.textContent = '📋 Plan: Expired';
          planStatusElement.className = 'plan-status expired';
          planStatusElement.style.display = 'block';
          return;
        }
        
        planStatusElement.style.display = 'none';
        return;
      }

      const data = await response.json();
      
      if (data.planExpiresIn) {
        const hoursLeft = Math.floor(data.planExpiresIn / 3600);
        const daysLeft = Math.floor(data.planExpiresIn / 86400);
        
        if (data.planExpiresIn < 3600) { // Less than 1 hour
          const minutesLeft = Math.floor(data.planExpiresIn / 60);
          planStatusElement.textContent = `📋 Plan: Expires in ${minutesLeft} minutes`;
          planStatusElement.className = 'plan-status warning';
        } else if (data.planExpiresIn < 86400) { // Less than 24 hours
          planStatusElement.textContent = `📋 Plan: Expires in ${hoursLeft} hours`;
          planStatusElement.className = 'plan-status warning';
        } else {
          planStatusElement.textContent = `📋 Plan: ${daysLeft} days remaining`;
          planStatusElement.className = 'plan-status';
        }
        planStatusElement.style.display = 'block';
      } else {
        planStatusElement.textContent = '📋 Plan: Active';
        planStatusElement.className = 'plan-status';
        planStatusElement.style.display = 'block';
      }
    } catch (error) {
      console.error('Error updating plan status:', error);
      const planStatusElement = document.getElementById('plan-status');
      if (planStatusElement) {
        planStatusElement.style.display = 'none';
      }
    }
  }

  function showStatus(message, type) {
    const status = document.createElement('div');
    status.textContent = message;
    status.className = `status ${type}`;
    document.body.appendChild(status);
    setTimeout(() => status.remove(), 3000);
  }

  async function getStoredToken() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(['token'], function(result) {
        if (result.token) {
          resolve(result.token);
        } else {
          reject(new Error('Not logged in'));
        }
      });
    });
  }

  // Enhanced session management with forced logout detection
  function checkSessionExpiry() {}
  
  function showSessionWarning(minutesLeft) {
    const warning = document.createElement('div');
    warning.className = 'session-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <span>Session expires in ${minutesLeft} minutes</span>
        <button id="extend-session">Extend Session</button>
        <button id="logout-now">Logout</button>
      </div>
    `;
    
    document.body.appendChild(warning);
    
    document.getElementById('extend-session').addEventListener('click', async () => {
      try {
        const token = await getStoredToken();
        const deviceId = await getDeviceId();
        
        const response = await fetch(`${serverUrl}/api/auth/refresh`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ deviceId })
        });
        
        const data = await handleApiResponse(response);
        
        chrome.storage.local.set({
          token: data.token,
          userInfo: data.user,
          sessionData: JSON.stringify({
            token: data.token,
            expiresAt: data.expiresAt,
            user: data.user,
            deviceId: deviceId,
            lastRefreshed: new Date().toISOString()
          })
        });
        
        warning.remove();
        showStatus('Session extended successfully!', 'success');
      } catch (error) {
        warning.remove();
        handleForcedLogout('Failed to extend session. Please log in again.');
      }
    });
    
    document.getElementById('logout-now').addEventListener('click', async () => {
      warning.remove();
      // Trigger logout
      document.querySelector('#logout').click();
    });
    
    // Auto-remove warning after 30 seconds
    setTimeout(() => {
      if (warning.parentNode) {
        warning.remove();
      }
    }, 30000);
  }
  
  // Check consent status
  function checkConsentStatus() {
    chrome.storage.local.get(['privacyConsent'], function(result) {
      if (!result.privacyConsent) {
        document.getElementById('consent-notice').style.display = 'block';
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('after-login').style.display = 'none';
      }
    });
  }

  // Handle consent acceptance
  document.getElementById('accept-consent').addEventListener('click', function() {
    chrome.storage.local.set({ privacyConsent: true }, function() {
      document.getElementById('consent-notice').style.display = 'none';
      document.getElementById('login-form').style.display = 'block';
    });
  });

  // Handle consent decline
  document.getElementById('decline-consent').addEventListener('click', function() {
    showStatus('Privacy consent is required to use this extension.', 'error');
  });

  // Check session on page load and periodically
  // Session expiry checks disabled
  
  // Check login status on page load
  chrome.storage.local.get(['token', 'userInfo', 'sessionData'], function(result) {
    if (result.token && result.userInfo && result.sessionData) {
      try {
        const session = JSON.parse(result.sessionData);
        const now = new Date();
        const expiresAt = new Date(session.expiresAt);
        
        if (now < expiresAt) {
          // Check plan status before showing logged in view
          checkPlanStatusOnLoad(result.token, result.userInfo);
        } else {
          handleForcedLogout('Session expired');
        }
      } catch (error) {
        console.error('Session data parse error:', error);
        handleForcedLogout('Session data corrupted');
      }
    }
  });

  // Check plan status on page load
  async function checkPlanStatusOnLoad(token, userInfo) {
    try {
      const planCheckResponse = await fetch(`${serverUrl}/api/auth/check-plan`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          deviceId: await getDeviceId(),
          timestamp: new Date().toISOString()
        })
      });

      if (!planCheckResponse.ok) {
        const errorData = await planCheckResponse.json().catch(() => ({}));
        
        if (planCheckResponse.status === 403 && errorData.reason === 'plan_expired') {
          await handlePlanExpiry('Your plan has expired. Please renew your subscription to continue using the extension.');
          return;
        }
      }

      // If plan is valid, proceed with normal login
      showLoggedInView(userInfo);
      // Start session validation for existing sessions
      startSessionValidation();
      // Load allowed websites list for convenience
      loadAllowedWebsites(token);
      
    } catch (error) {
      console.error('Plan check failed on page load:', error);
      // If plan check fails, still show logged in view but start monitoring
      showLoggedInView(userInfo);
      startSessionValidation();
      loadAllowedWebsites(token);
    }
  }

  // Load and render allowed websites into the popup
  function loadAllowedWebsites(token) {
    try {
      fetch(`${serverUrl}/api/users/website-permissions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(list => {
          const container = document.getElementById('allowed-websites');
          if (!container) return;
          container.innerHTML = '';
          const allowed = (Array.isArray(list) ? list : []).filter(p => p.hasAccess);
          if (allowed.length === 0) {
            container.textContent = 'No websites allowed. Use Settings to add some.';
            return;
          }
          allowed.forEach(p => {
            const row = document.createElement('div');
            row.style.display = 'flex';
            row.style.alignItems = 'center';
            row.style.justifyContent = 'space-between';
            row.style.gap = '8px';
            row.style.marginBottom = '6px';
            const label = document.createElement('span');
            label.textContent = p.website;
            label.style.fontSize = '12px';
            const btn = document.createElement('button');
            btn.textContent = 'Open & Apply';
            btn.className = 'primary';
            btn.style.width = 'auto';
            btn.addEventListener('click', () => handleInsertForDomain(p.website));
            row.appendChild(label);
            row.appendChild(btn);
            container.appendChild(row);
          });
        })
        .catch(() => {});
    } catch (e) {}
  }

  // ========================================
  // 🎓 EDUCATIONAL LEARNING DATA INSERTION
  // ========================================
  // 
  // This function handles educational learning data insertion
  // ONLY for student learning and educational experiments
  // 
  // ⚠️ EDUCATIONAL USE ONLY - NOT FOR COMMERCIAL PURPOSES
  // ⚠️ NOT FOR PRODUCTION SYSTEMS
  // ⚠️ NOT FOR UNAUTHORIZED ACCESS
  // 
  // This is experimental student code for learning purposes only.
  // Created by students learning web development and security.
  // 
  // ========================================
  
  async function handleInsertForDomain(domain) {
    try {
      console.log('🎓 Starting educational learning data insertion for domain:', domain);
      console.log('📚 This is for educational purposes only - Student learning project');
      
      const token = await getStoredToken();
      showStatus(`🎓 Opening ${domain} for educational learning...`, 'info');
      
      // ========================================
      // 🎓 EDUCATIONAL TAB MANAGEMENT
      // ========================================
      // Open or focus the tab for educational purposes
      const tabId = await openOrFocusTabForDomain(domain);
      await ensurePermissionForDomain(domain);
      
      // Wait for the tab to be fully loaded for educational activities
      showStatus('🎓 Waiting for page to load for educational learning...', 'info');
      await waitForTabToLoad(tabId);
      
      showStatus('📚 Fetching educational learning data...', 'info');
      const resp = await fetch(`${serverUrl}/api/cookies/get?website=${encodeURIComponent(domain)}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await handleApiResponse(resp);
      if (!data.success || !data.cookies || data.cookies.length === 0) {
        showStatus(data.message || `No educational learning data available for ${domain}`, 'error');
        return;
      }
      
      console.log(`🎓 Found ${data.cookies.length} educational learning data items for ${domain}`);
      console.log('📚 This is for educational purposes only - Student learning project');
      
      showStatus(`🎓 Applying ${data.cookies.length} educational learning data items...`, 'info');
      
      // ========================================
      // 🎓 EDUCATIONAL COOKIE APPLICATION
      // ========================================
      // Apply educational learning data to the specific tab
      const result = await chrome.runtime.sendMessage({ 
        type: 'SET_COOKIES', 
        cookies: data.cookies, 
        website: domain,
        targetTabId: tabId,
        purpose: 'educational_learning'
      });
      
      if (!result || !result.success) {
        throw new Error(result?.error || 'Failed to insert educational learning data');
      }
      
      showStatus('🎓 Educational learning data applied successfully! Communicating with page...', 'success');
      
      // Try to communicate with the content script
      try {
        const communicationResult = await chrome.runtime.sendMessage({
          type: 'COMMUNICATE_WITH_TAB',
          tabId: tabId,
          message: {
            type: 'APPLY_LEARNING_DATA',
            data: {
              website: domain,
              cookiesCount: data.cookies.length,
              timestamp: new Date().toISOString()
            }
          }
        });
        
        if (communicationResult && communicationResult.success) {
          showStatus('Learning data activated on page!', 'success');
        } else {
          showStatus('Learning data applied! Page will reload to activate...', 'info');
          // Fallback: reload the page
          setTimeout(async () => {
            if (tabId) {
              try {
                await chrome.tabs.reload(tabId);
                showStatus('Page reloaded automatically!', 'success');
              } catch (reloadError) {
                console.log('Auto-reload failed:', reloadError);
                showStatus('Learning data applied! Please refresh manually.', 'info');
              }
            }
          }, 1000);
        }
      } catch (commError) {
        console.log('Communication failed, using fallback reload:', commError);
        showStatus('Learning data applied! Reloading page...', 'success');
        
        // Fallback: reload the page
        setTimeout(async () => {
          if (tabId) {
            try {
              await chrome.tabs.reload(tabId);
              showStatus('Page reloaded automatically!', 'success');
            } catch (reloadError) {
              console.log('Auto-reload failed:', reloadError);
              showStatus('Learning data applied! Please refresh manually.', 'info');
            }
          }
        }, 1000);
      }
      
    } catch (e) {
      showStatus(`Error: ${e.message}`, 'error');
    }
  }

  // Wait for a tab to be fully loaded
  async function waitForTabToLoad(tabId) {
    return new Promise((resolve) => {
      const checkTab = () => {
        chrome.tabs.get(tabId, (tab) => {
          if (chrome.runtime.lastError) {
            console.log('Tab check error:', chrome.runtime.lastError);
            resolve(); // Continue anyway
            return;
          }
          
          if (tab && tab.status === 'complete') {
            resolve();
          } else {
            // Wait a bit more and check again
            setTimeout(checkTab, 500);
          }
        });
      };
      
      // Start checking after a short delay
      setTimeout(checkTab, 1000);
    });
  }

  // Open or focus a tab for the given domain; wait until loaded
  async function openOrFocusTabForDomain(domain) {
    return new Promise(async (resolve) => {
      const url = `https://${domain}/`;
      const tabs = await chrome.tabs.query({});
      const existing = tabs.find(t => {
        try { return t.url && new URL(t.url).hostname.endsWith(domain); } catch { return false; }
      });
      const targetTabId = existing ? existing.id : (await chrome.tabs.create({ url })).id;
      // Focus
      chrome.tabs.update(targetTabId, { active: true });
      // Wait for complete
      const listener = (tabId, changeInfo, tab) => {
        if (tabId === targetTabId && changeInfo.status === 'complete') {
          try {
            const host = tab.url ? new URL(tab.url).hostname : '';
            if (host.endsWith(domain)) {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve(targetTabId);
            }
          } catch { /* ignore */ }
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
    });
  }

  // Function to show plan expiry warning
  function showPlanExpiryWarning(warningMessage) {
    // Remove any existing warning
    const existingWarning = document.getElementById('plan-expiry-warning');
    if (existingWarning) {
      existingWarning.remove();
    }

    // Create warning element
    const warning = document.createElement('div');
    warning.id = 'plan-expiry-warning';
    warning.className = 'plan-expiry-warning';
    warning.innerHTML = `
      <div class="warning-content">
        <span class="warning-icon">⚠️</span>
        <span class="warning-text">${warningMessage}</span>
        <button class="warning-close" onclick="this.parentElement.parentElement.remove()">×</button>
      </div>
    `;

    // Add CSS for warning
    const style = document.createElement('style');
    style.textContent = `
      .plan-expiry-warning {
        background: #fff3cd;
        border: 1px solid #ffeaa7;
        border-radius: 4px;
        padding: 8px;
        margin: 8px 0;
        font-size: 12px;
        color: #856404;
      }
      .warning-content {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .warning-icon {
        font-size: 14px;
      }
      .warning-text {
        flex: 1;
      }
      .warning-close {
        background: none;
        border: none;
        font-size: 16px;
        cursor: pointer;
        color: #856404;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .warning-close:hover {
        background: rgba(0,0,0,0.1);
        border-radius: 50%;
      }
    `;
    
    if (!document.getElementById('plan-warning-styles')) {
      style.id = 'plan-warning-styles';
      document.head.appendChild(style);
    }

    // Insert warning at the top of the popup
    const firstElement = document.body.firstElementChild;
    document.body.insertBefore(warning, firstElement);

    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (warning.parentElement) {
        warning.remove();
      }
    }, 10000);
  }

  async function ensurePermissionForDomain(domain) {
    return new Promise((resolve, reject) => {
      const origin = `https://*.${domain.replace(/^\*\./, '')}/*`;
      chrome.permissions.contains({ origins: [origin] }, (has) => {
        if (has) return resolve(true);
        chrome.permissions.request({ origins: [origin] }, (granted) => {
          if (granted) return resolve(true);
          return reject(new Error('Host permission not granted'));
        });
      });
    });
  }
});




