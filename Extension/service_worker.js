// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('ChatGPT Cookie Importer Extension installed');
});

// Handle messages from popup/options pages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Message received:', request.type);
  
  if (request.type === 'SET_COOKIES') {
    setCookies(request.cookies, request.website)
      .then(result => {
        console.log('Cookies set result:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Error setting cookies:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
  
  if (request.type === 'TEST_COOKIE') {
    testCookie(request.cookie)
      .then(result => {
        console.log('Cookie test result:', result);
        sendResponse({ success: true, message: 'Cookie test completed' });
      })
      .catch(error => {
        console.error('Error testing cookie:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
  
  if (request.type === 'CLEAR_EXTENSION_COOKIES') {
    clearAllExtensionCookies()
      .then(result => {
        console.log('Extension cookies cleared:', result);
        sendResponse(result);
      })
      .catch(error => {
        console.error('Error clearing extension cookies:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
});

// Function to set cookies
async function setCookies(cookies, targetWebsite) {
  console.log('Starting to set cookies:', cookies.length, 'cookies', targetWebsite ? `for ${targetWebsite}` : '');
  
  // Ensure host permission for target website at runtime
  if (targetWebsite) {
    try {
      await ensureHostPermission(targetWebsite);
    } catch (e) {
      console.error('Permission request failed for', targetWebsite, e);
      throw new Error(`Host permission denied for ${targetWebsite}`);
    }
  }

  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const cookie of cookies) {
    try {
      console.log('Processing cookie:', cookie.name);
      
      // Determine the correct URL based on target website or cookie domain
      let url = targetWebsite ? `https://${targetWebsite}` : 'https://chatgpt.com';
      if (!targetWebsite) {
        if (cookie.domain && cookie.domain.includes('openai.com')) {
          url = 'https://openai.com';
        } else if (cookie.domain && cookie.domain.includes('chatgpt.com')) {
          url = 'https://chatgpt.com';
        }
      }
      
      // Ensure permission for cookie domain if different
      if (!targetWebsite && cookie.domain) {
        const domainForPerm = (cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain);
        try {
          await ensureHostPermission(domainForPerm);
        } catch (e) {
          console.warn('Skipping cookie due to missing permission for', domainForPerm, e);
          errorCount++;
          errors.push(`${cookie.name}: permission denied for ${domainForPerm}`);
          continue;
        }
      }
      
      // Handle domain properly for different cookie types
      let domain = cookie.domain;
      let path = cookie.path || '/';
      
      // Special handling for __Host- prefixed cookies
      if (cookie.name.startsWith('__Host-')) {
        domain = undefined;
        path = '/';
      } else if (domain && domain.startsWith('.')) {
        domain = domain.substring(1);
      }

      // If a specific target website was requested, force cookie to that host
      if (targetWebsite) {
        if (cookie.name.startsWith('__Host-')) {
          domain = undefined; // must be hostOnly
        } else {
          domain = targetWebsite;
        }
      }

      // Handle expiry date
      let expirationDate;
      if (cookie.expiry && cookie.expiry !== null) {
        if (typeof cookie.expiry === 'number') {
          expirationDate = cookie.expiry;
        } else {
          try {
            expirationDate = new Date(cookie.expiry).getTime() / 1000;
          } catch (e) {
            expirationDate = (Date.now() / 1000) + 86400 * 365;
          }
        }
      }

      const cookieData = {
        url: url,
        name: cookie.name,
        value: cookie.value,
        domain: domain,
        path: path,
        secure: cookie.secure !== false,
        httpOnly: cookie.httpOnly !== false,
        sameSite: cookie.sameSite || 'Lax'
      };
      
      if (expirationDate) {
        cookieData.expirationDate = expirationDate;
      }
      
      console.log('Setting cookie:', cookieData);
      
      // Use callback form to capture lastError reliably
      await new Promise((resolve, reject) => {
        try {
          chrome.cookies.set(cookieData, (result) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (!result) {
              reject(new Error('Unknown cookies.set failure'));
            } else {
              resolve(result);
            }
          });
        } catch (e) {
          reject(e);
        }
      });
      successCount++;
      console.log(`Successfully set cookie: ${cookie.name}`);
      
    } catch (error) {
      errorCount++;
      const errorMsg = `${cookie.name}: ${error.message}`;
      errors.push(errorMsg);
      console.error(`Error setting cookie ${cookie.name}:`, error);
    }
  }
  
  console.log(`Finished setting cookies. Success: ${successCount}, Errors: ${errorCount}`);
  
  if (errorCount > 0) {
    console.error('Cookie errors:', errors);
  }
  
  return { 
    successCount, 
    errorCount, 
    errors,
    success: errorCount === 0,
    message: errorCount === 0 ? 
      `All ${successCount} cookies set successfully` : 
      `${successCount} cookies succeeded, ${errorCount} failed`
  };
}

// Ensure host permission for a domain at runtime (MV3)
async function ensureHostPermission(domain) {
  return new Promise((resolve, reject) => {
    const origin = `https://*.${domain.replace(/^\*\./, '')}/*`;
    chrome.permissions.contains({ origins: [origin] }, (has) => {
      if (has) return resolve(true);
      chrome.permissions.request({ origins: [origin] }, (granted) => {
        if (granted) return resolve(true);
        return reject(new Error('Permission not granted'));
      });
    });
  });
}

// Function to test a single cookie
async function testCookie(cookie) {
  console.log('Testing cookie:', cookie.name);
  
  try {
    // Determine the correct URL based on the cookie domain
    let url = 'https://chatgpt.com';
    if (cookie.domain && cookie.domain.includes('openai.com')) {
      url = 'https://openai.com';
    }
    
    // Handle domain properly for different cookie types
    let domain = cookie.domain;
    let path = cookie.path || '/';
    
    // Special handling for __Host- prefixed cookies
    if (cookie.name.startsWith('__Host-')) {
      domain = undefined;
      path = '/';
    } else if (domain && domain.startsWith('.')) {
      domain = domain.substring(1);
    }

    // Handle expiry date
    let expirationDate;
    if (cookie.expiry && cookie.expiry !== null) {
      if (typeof cookie.expiry === 'number') {
        expirationDate = cookie.expiry;
      } else {
        try {
          expirationDate = new Date(cookie.expiry).getTime() / 1000;
        } catch (e) {
          expirationDate = (Date.now() / 1000) + 86400 * 365;
        }
      }
    }

    const cookieData = {
      url: url,
      name: cookie.name,
      value: cookie.value,
      domain: domain,
      path: path,
      secure: cookie.secure !== false,
      httpOnly: cookie.httpOnly !== false,
      sameSite: cookie.sameSite || 'Lax'
    };
    
    if (expirationDate) {
      cookieData.expirationDate = expirationDate;
    }
    
    console.log('Testing cookie with data:', cookieData);
    
    // Try to set the cookie
    await chrome.cookies.set(cookieData);
    
    // Verify the cookie was set
    const testUrl = `https://${domain || 'chatgpt.com'}${path}`;
    const verifyCookie = await chrome.cookies.get({ url: testUrl, name: cookie.name });
    
    if (verifyCookie) {
      console.log(`Cookie ${cookie.name} test successful`);
      return { success: true, message: `Cookie ${cookie.name} set and verified` };
    } else {
      throw new Error(`Cookie ${cookie.name} was not set properly`);
    }
    
  } catch (error) {
    console.error(`Error testing cookie ${cookie.name}:`, error);
    throw error;
  }
}

// Function to clear all extension-related cookies
async function clearAllExtensionCookies() {
  console.log('🧹 Starting to clear all extension-related cookies...');
  
  const domains = ['chatgpt.com', '.chatgpt.com', 'openai.com', '.openai.com', 'api.openai.com'];
  let totalCleared = 0;
  const errors = [];
  
  for (const domain of domains) {
    try {
      console.log(`Checking cookies for domain: ${domain}`);
      const cookies = await chrome.cookies.getAll({ domain });
      console.log(`Found ${cookies.length} cookies for ${domain}`);
      
      for (const cookie of cookies) {
        try {
          const url = `https://${cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain}${cookie.path}`;
          await chrome.cookies.remove({ url, name: cookie.name });
          totalCleared++;
          console.log(`✅ Removed cookie: ${cookie.name} from ${cookie.domain}`);
        } catch (error) {
          const errorMsg = `Failed to remove ${cookie.name}: ${error.message}`;
          errors.push(errorMsg);
          console.error(`❌ ${errorMsg}`);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to get cookies for ${domain}: ${error.message}`;
      errors.push(errorMsg);
      console.error(`❌ ${errorMsg}`);
    }
  }
  
  console.log(`🧹 Total cookies cleared: ${totalCleared}`);
  
  return {
    success: true,
    totalCleared,
    errors,
    message: `Cleared ${totalCleared} extension-related cookies`
  };
}

// Fallback: if popup fails to load, open options page
chrome.action.onClicked.addListener(() => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  }
});


