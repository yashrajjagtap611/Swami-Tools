// ========================================
// 🎓 EDUCATIONAL WEB SECURITY EXTENSION
// ========================================
// 
// ⚠️ IMPORTANT: THIS IS A STUDENT LEARNING PROJECT
// 
// This service worker is designed EXCLUSIVELY for educational purposes:
// - Learning web security principles
// - Understanding Chrome extension development
// - Studying authentication mechanisms
// - Practicing JavaScript programming
// 
// 🚫 NOT FOR COMMERCIAL USE
// 🚫 NOT FOR PRODUCTION SYSTEMS
// 🚫 NOT FOR UNAUTHORIZED ACCESS
// 
// This is experimental student code for learning purposes only.
// Created by students learning web development and security.
// 
// ========================================

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('🎓 Educational Web Security Extension - Service Worker Loaded');
  console.log('📚 This extension is for educational learning purposes only');
  console.log('⚠️ NOT a commercial product - Student learning project');
});

// ========================================
// 📨 EDUCATIONAL MESSAGE HANDLER
// ========================================
// 
// This listener handles educational learning data messages
// ONLY for student learning and educational experiments
// 
// ⚠️ EDUCATIONAL USE ONLY - NOT FOR COMMERCIAL PURPOSES
// 
// ========================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Educational service worker received message:', request.type);
  console.log('🎓 This is for educational purposes only - Student learning project');
  
  if (request.type === 'SET_COOKIES') {
    setCookies(request.cookies, request.website, request.targetTabId)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
  
  if (request.type === 'TEST_COOKIE') {
    testCookie(request.cookie)
      .then(result => {
        sendResponse({ success: true, message: 'Cookie test completed' });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
  
  if (request.type === 'CLEAR_EXTENSION_COOKIES') {
    clearAllExtensionCookies()
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
  
  if (request.type === 'RELOAD_TAB') {
    chrome.tabs.reload(request.tabId)
      .then(() => {
        sendResponse({ success: true, message: 'Tab reloaded successfully' });
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
  
  if (request.type === 'COMMUNICATE_WITH_TAB') {
    communicateWithTab(request.tabId, request.message)
      .then(result => {
        sendResponse(result);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
      });
    return true; // Will respond asynchronously
  }
});

// ========================================
// 🎓 EDUCATIONAL COOKIE SETTING FUNCTION
// ========================================
// 
// This function sets educational learning data cookies
// ONLY for student learning and educational experiments
// 
// ⚠️ EDUCATIONAL USE ONLY - NOT FOR COMMERCIAL PURPOSES
// ⚠️ NOT FOR PRODUCTION SYSTEMS
// ⚠️ NOT FOR UNAUTHORIZED ACCESS
// 
// ========================================

async function setCookies(cookies, targetWebsite, targetTabId = null) {
  console.log('🎓 Setting educational learning data cookies for:', targetWebsite);
  console.log('📚 This is for educational purposes only - Student learning project');
  
  // Check plan status before setting cookies
  try {
    const planCheckResponse = await fetch('https://swami-tools-server.onrender.com/api/auth/check-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString()
      })
    });

    if (!planCheckResponse.ok) {
      const errorData = await planCheckResponse.json().catch(() => ({}));
      
      if (planCheckResponse.status === 403 && errorData.reason === 'plan_expired') {
        throw new Error('Plan expired. Cookies cannot be set.');
      }
    }
  } catch (error) {
    console.error('Plan check failed:', error);
    // Continue with cookie setting if plan check fails (network issues)
  }
  
  // Ensure host permission for target website at runtime
  if (targetWebsite) {
    try {
      await ensureHostPermission(targetWebsite);
    } catch (e) {
      throw new Error(`Host permission denied for ${targetWebsite}`);
    }
  }

  console.log(`🍪 Setting ${cookies.length} cookies for ${targetWebsite}${targetTabId ? ` (tab ${targetTabId})` : ''}`);
  
  let successCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (const cookie of cookies) {
    try {
      
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
      
    } catch (error) {
      errorCount++;
      const errorMsg = `${cookie.name}: ${error.message}`;
      errors.push(errorMsg);
    }
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
    
    
    // Try to set the cookie
    await chrome.cookies.set(cookieData);
    
    // Verify the cookie was set
    const testUrl = `https://${domain || 'chatgpt.com'}${path}`;
    const verifyCookie = await chrome.cookies.get({ url: testUrl, name: cookie.name });
    
    if (verifyCookie) {
      return { success: true, message: `Cookie ${cookie.name} set and verified` };
    } else {
      throw new Error(`Cookie ${cookie.name} was not set properly`);
    }
    
  } catch (error) {
    throw error;
  }
}

// Function to clear all extension-related cookies
async function clearAllExtensionCookies() {
  
  const domains = ['chatgpt.com', '.chatgpt.com', 'openai.com', '.openai.com', 'api.openai.com'];
  let totalCleared = 0;
  const errors = [];
  
  for (const domain of domains) {
    try {
      const cookies = await chrome.cookies.getAll({ domain });
      
      for (const cookie of cookies) {
        try {
          const url = `https://${cookie.domain.startsWith('.') ? cookie.domain.substring(1) : cookie.domain}${cookie.path}`;
          await chrome.cookies.remove({ url, name: cookie.name });
          totalCleared++;
        } catch (error) {
          const errorMsg = `Failed to remove ${cookie.name}: ${error.message}`;
          errors.push(errorMsg);
        }
      }
    } catch (error) {
      const errorMsg = `Failed to get cookies for ${domain}: ${error.message}`;
      errors.push(errorMsg);
    }
  }
  
  
  return {
    success: true,
    totalCleared,
    errors,
    message: `Cleared ${totalCleared} extension-related cookies`
  };
}

// Function to communicate with content script in a specific tab
async function communicateWithTab(tabId, message) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return { success: true, response: response };
  } catch (error) {
    console.log('Communication with tab failed:', error);
    return { success: false, error: error.message };
  }
}

// Fallback: if popup fails to load, open options page
chrome.action.onClicked.addListener(() => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  }
});


