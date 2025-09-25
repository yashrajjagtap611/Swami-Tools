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
    const serverUrl = 'http://localhost:3000';
  
  try {
    console.log('🧪 Testing server connection...');
    showStatus('Testing server connection...', 'info');
    
    // Test basic connectivity
    const healthResponse = await fetch(`${serverUrl}/api/health`);
    if (!healthResponse.ok) {
      throw new Error(`Health check failed: ${healthResponse.status}`);
    }
    const healthData = await healthResponse.json();
    console.log('✅ Health check passed:', healthData);
    
    // Test Chrome extension specific endpoint
    const testResponse = await fetch(`${serverUrl}/api/test-extension`);
    if (!testResponse.ok) {
      throw new Error(`Extension test failed: ${testResponse.status}`);
    }
    const testData = await testResponse.json();
    console.log('✅ Extension test passed:', testData);
    
    showStatus('Server connection successful!', 'success');
    return true;
    
  } catch (error) {
    console.error('❌ Server connection test failed:', error);
    showStatus(`Connection test failed: ${error.message}`, 'error');
    return false;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const serverUrl = 'http://localhost:3000';
  
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
  
  // Session validation disabled
  function startSessionValidation() {}
  
  // Stop session validation
  function stopSessionValidation() {
    if (sessionValidationInterval) {
      console.log('🛑 Stopping session validation');
      clearInterval(sessionValidationInterval);
      sessionValidationInterval = null;
    }
  }
  
  // Get device ID
  async function getDeviceId() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['deviceId'], function(result) {
        resolve(result.deviceId || null);
      });
    });
  }
  
  // Test connection on page load
  testServerConnection();
  
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
      
      console.log('Attempting to connect to:', serverUrl);
      
      const deviceId = await generateDeviceId();
      console.log('Generated device ID:', deviceId);
      
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

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

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
      console.log('Login successful:', data);
      
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
      console.error('Login error details:', error);
      
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
        showStatus('Session applied successfully!', 'success');
        
        // Track successful insertion
        await fetch(`${serverUrl}/api/cookies/insert`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ website, cookies: data.cookies })
        });
      } else {
        throw new Error(result?.error || 'Failed to apply session');
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
    
    // Update device status
    updateDeviceStatus();

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
          showLoggedInView(result.userInfo);
          // Start session validation for existing sessions
          startSessionValidation();
          // Load allowed websites list for convenience
          loadAllowedWebsites(result.token);
        } else {
          handleForcedLogout('Session expired');
        }
      } catch (error) {
        console.error('Session data parse error:', error);
        handleForcedLogout('Session data corrupted');
      }
    }
  });

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

  // Handle inserting cookies for a chosen domain
  async function handleInsertForDomain(domain) {
    try {
      const token = await getStoredToken();
      showStatus(`Opening ${domain}...`, 'info');
      const tabId = await openOrFocusTabForDomain(domain);
      await ensurePermissionForDomain(domain);
      showStatus('Fetching cookies...', 'info');
      const resp = await fetch(`${serverUrl}/api/cookies/get?website=${encodeURIComponent(domain)}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      const data = await handleApiResponse(resp);
      if (!data.success || !data.cookies || data.cookies.length === 0) {
        showStatus(data.message || `No cookies available for ${domain}`, 'error');
        return;
      }
      const result = await chrome.runtime.sendMessage({ type: 'SET_COOKIES', cookies: data.cookies, website: domain });
      if (!result || !result.success) throw new Error(result?.error || 'Failed to insert cookies');
      showStatus('Cookies inserted. Reloading...', 'success');
      if (tabId) chrome.tabs.reload(tabId);
    } catch (e) {
      showStatus(`Error: ${e.message}`, 'error');
    }
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




