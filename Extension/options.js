/* global chrome */
(function () {
  const fileInput = document.getElementById('file');
  const importBtn = document.getElementById('import');
  const openLoginBtn = document.getElementById('open-login');
  const clearFirstEl = document.getElementById('clear-first');
  const statusEl = document.getElementById('status');
  const logEl = document.getElementById('log');

  // Backend integration elements (re-enabled)
  const apiBaseEl = document.getElementById('api-base');
  const emailEl = document.getElementById('email');
  const passwordEl = document.getElementById('password');
  const loginBtn = document.getElementById('login');
  const loginStatus = document.getElementById('login-status');
  const listBundlesBtn = document.getElementById('list-bundles');
  const bundlesPre = document.getElementById('bundles');
  const bundleIdEl = document.getElementById('bundle-id');
  const importFromBackendBtn = document.getElementById('import-from-backend');
  const oneClickBtn = document.getElementById('one-click-login');

  let parsedCookies = [];

  function log(message) {
    const time = new Date().toISOString();
    logEl.textContent += `[${time}] ${message}\n`;
  }

  function apiBase() {
    const stored = localStorage.getItem('apiBase') || '';
    const v = (apiBaseEl && apiBaseEl.value || stored).trim();
    if (apiBaseEl && !apiBaseEl.value) apiBaseEl.value = v;
    if (!v) return 'http://localhost:3000';
    return v.replace(/\/$/, '');
  }

  function showStatus(text, kind) {
    statusEl.textContent = text;
    statusEl.className = kind || '';
  }

  function toEpochSecondsOrUndefined(expiry) {
    if (expiry === null || expiry === undefined) return undefined;
    if (typeof expiry === 'number') return Math.floor(expiry);
    const asNumber = Number(expiry);
    if (!Number.isNaN(asNumber)) return Math.floor(asNumber);
    const date = new Date(expiry);
    if (!Number.isNaN(date.getTime())) return Math.floor(date.getTime() / 1000);
    return undefined;
  }

  function normalizeSameSite(sameSite) {
    if (!sameSite) return undefined;
    const s = String(sameSite).toLowerCase();
    if (s.includes('strict')) return 'strict';
    if (s.includes('lax')) return 'lax';
    return 'no_restriction';
  }

  function normalizeDomain(domain, name) {
    // __Host- cookies must be host-only and path=/
    if (name && name.startsWith('__Host-')) {
      return 'chatgpt.com';
    }
    // Accept both chatgpt.com and .chatgpt.com
    if (!domain) return 'chatgpt.com';
    const d = String(domain).replace(/^\./, '');
    return d || 'chatgpt.com';
  }

  function normalizePath(path, name) {
    if (name && name.startsWith('__Host-')) return '/';
    return path || '/';
  }

  function validateCookie(c) {
    if (!c || !c.name || typeof c.value === 'undefined') return false;
    if (c.name.startsWith('__Host-')) {
      const domain = normalizeDomain(c.domain, c.name);
      const path = normalizePath(c.path, c.name);
      if (domain !== 'chatgpt.com') return false;
      if (path !== '/') return false;
      if (!c.secure) return false;
    }
    return true;
  }

  async function setCookie(cookie) {
    const domain = normalizeDomain(cookie.domain, cookie.name);
    const path = normalizePath(cookie.path, cookie.name);
    const sameSite = normalizeSameSite(cookie.sameSite);
    const expirationDate = toEpochSecondsOrUndefined(cookie.expiry);

    const url = `https://${domain}${path}`;

    const details = {
      url,
      name: String(cookie.name),
      value: String(cookie.value),
      path,
      secure: Boolean(cookie.secure),
      httpOnly: Boolean(cookie.httpOnly),
    };

    if (sameSite) details.sameSite = sameSite;
    if (expirationDate) details.expirationDate = expirationDate;

    // chrome.cookies.set handles domain via URL; host-only vs domain cookie is inferred by leading dot.
    // For domain cookies, we can pass domain explicitly; for host-only (__Host-), omit 'domain'.
    if (!cookie.name.startsWith('__Host-')) {
      details.domain = domain;
    }

    return new Promise((resolve, reject) => {
      chrome.cookies.set(details, (result) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        if (!result) return reject(new Error('Failed to apply item'));
        resolve(result);
      });
    });
  }

  function getCookie(url, name) {
    return new Promise((resolve, reject) => {
      chrome.cookies.get({ url, name }, (cookie) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        resolve(cookie || null);
      });
    });
  }

  async function clearExistingCookies() {
    const url = 'https://chatgpt.com/';
    return new Promise((resolve, reject) => {
      chrome.cookies.getAll({ url }, async (cookies) => {
        if (chrome.runtime.lastError) {
          return reject(new Error(chrome.runtime.lastError.message));
        }
        let removed = 0;
        for (const c of cookies) {
          try {
            await new Promise((res, rej) => {
              chrome.cookies.remove({ url, name: c.name }, (details) => {
                if (chrome.runtime.lastError) return rej(new Error(chrome.runtime.lastError.message));
                removed += details ? 1 : 0;
                res();
              });
            });
          } catch (e) {
            log(`Failed to remove ${c.name}: ${e.message}`);
          }
        }
        log(`Cleared existing session data for chatgpt.com (${removed} items)`);
        resolve(removed);
      });
    });
  }

  async function importCookies(cookies) {
    let success = 0;
    let skipped = 0;
    for (const c of cookies) {
      if (!validateCookie(c)) {
        skipped += 1;
        log(`Skipped invalid item: ${c && c.name ? c.name : JSON.stringify(c)}`);
        continue;
      }
      try {
        const res = await setCookie(c);
        const checkUrl = `https://${normalizeDomain(c.domain, c.name)}${normalizePath(c.path, c.name)}`;
        const verified = await getCookie(checkUrl, c.name);
        if (verified) {
          success += 1;
          log(`Applied item: ${res.name} for ${res.domain || normalizeDomain(c.domain, c.name)}${res.path}`);
        } else {
          skipped += 1;
          log(`Verification failed for ${c.name}`);
        }
      } catch (e) {
        skipped += 1;
        log(`Error applying ${c.name}: ${e.message}`);
      }
    }
    return { success, skipped };
  }

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      importBtn.disabled = true;
      return;
    }
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!Array.isArray(data)) throw new Error('JSON must be an array of session items');
      parsedCookies = data;
      importBtn.disabled = false;
      showStatus(`Loaded ${parsedCookies.length} session items. Ready to restore.`, '');
      log(`Loaded file: ${file.name} (${parsedCookies.length} cookies)`);
    } catch (err) {
      parsedCookies = [];
      importBtn.disabled = true;
      showStatus(`Failed to read JSON: ${err.message}`, 'error');
      log(`Parse error: ${err.stack || err.message}`);
    }
  });

  // Test connection button
  if (document.getElementById('test-connection')) {
    document.getElementById('test-connection').addEventListener('click', async () => {
      try {
        const base = apiBase();
        console.log('Testing connection to:', base);
        
        loginStatus.textContent = 'Testing connection...';
        
        const startTime = Date.now();
        const response = await fetch(`${base}/api/health`);
        const endTime = Date.now();
        const responseTime = endTime - startTime;
        
        console.log('Response status:', response.status);
        console.log('Response time:', responseTime + 'ms');
        
        if (response.ok) {
          const data = await response.json();
          loginStatus.textContent = `✅ Connection successful! (${responseTime}ms) - ${data.ok ? 'Server healthy' : 'Server error'}`;
          console.log('Connection test successful:', data);
        } else {
          throw new Error(`Server responded with status ${response.status}`);
        }
        
      } catch (err) {
        console.error('Connection test failed:', err);
        
        let errorMessage = 'Connection test failed';
        
        if (err.name === 'TypeError' && err.message.includes('Failed to fetch')) {
          errorMessage = `❌ Cannot connect to server at ${apiBase()}. Please check:\n` +
                        '1. Server is running (npm run dev)\n' +
                        '2. Server port is correct (should be 3001)\n' +
                        '3. No firewall blocking connection\n' +
                        '4. MongoDB Atlas IP whitelist\n' +
                        '5. Server started successfully';
        } else if (err.name === 'TypeError' && err.message.includes('NetworkError')) {
          errorMessage = '❌ Network error. Check your internet connection.';
        } else {
          errorMessage = `❌ Error: ${err.message}`;
        }
        
        loginStatus.textContent = errorMessage;
        console.error('Connection test error details:', errorMessage);
      }
    });
  }

  // Backend: login
  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      try {
        const base = apiBase();
        localStorage.setItem('apiBase', base);
        const r = await fetch(`${base}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: (emailEl.value||'').trim(), password: passwordEl.value })
        });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'login failed');
        localStorage.setItem('jwtToken', j.token);
        // show role
        try {
          const whoRes = await fetch(`${base}/api/auth/me`, { headers: { Authorization: `Bearer ${j.token}` }});
          const who = await whoRes.json();
          if (who && who.user) loginStatus.textContent = `Logged in as ${who.user.username} (${who.user.isAdmin ? 'Admin' : 'User'})`;
          else loginStatus.textContent = 'Logged in';
        } catch { loginStatus.textContent = 'Logged in'; }
      } catch (err) {
        loginStatus.textContent = `Login error: ${err.message}`;
      }
    });
  }

  // Backend: list bundles
  if (listBundlesBtn) {
    listBundlesBtn.addEventListener('click', async () => {
      try {
        const base = apiBase();
        const token = localStorage.getItem('jwtToken') || '';
        if (!token) throw new Error('login first');
        const r = await fetch(`${base}/api/cookies`, { headers: { Authorization: `Bearer ${token}` } });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'failed');
        if (bundlesPre) bundlesPre.textContent = JSON.stringify(j, null, 2);
      } catch (err) {
        if (bundlesPre) bundlesPre.textContent = `Error: ${err.message}`;
      }
    });
  }

  // Backend: import bundle
  if (importFromBackendBtn) {
    importFromBackendBtn.addEventListener('click', async () => {
      try {
        const base = apiBase();
        const token = localStorage.getItem('jwtToken') || '';
        if (!token) throw new Error('login first');
        const id = (bundleIdEl && bundleIdEl.value || '').trim();
        if (!id) throw new Error('enter bundle id');
        showStatus('Fetching bundle...', '');
        const r = await fetch(`${base}/api/cookies/${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${token}` } });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'failed');
        if (!j || !j.data || !Array.isArray(j.data)) throw new Error('bundle missing array data');
        parsedCookies = j.data;
        showStatus(`Loaded bundle '${j.name}' with ${parsedCookies.length} cookies.`, '');
      } catch (err) {
        showStatus(`Load bundle failed: ${err.message}`, 'error');
      }
    });
  }

  // Backend: one-click login -> fetch newest bundle, import, open ChatGPT
  if (oneClickBtn) {
    oneClickBtn.addEventListener('click', async () => {
      try {
        const base = apiBase();
        const token = localStorage.getItem('jwtToken') || '';
        if (!token) throw new Error('login first');
        showStatus('Fetching session backups...', '');
        const listRes = await fetch(`${base}/api/cookies`, { headers: { Authorization: `Bearer ${token}` } });
        const list = await listRes.json();
        if (!listRes.ok) throw new Error(list.error || 'failed to list');
        if (!Array.isArray(list) || !list.length) throw new Error('no bundles');
        const latest = list[0];
        const r = await fetch(`${base}/api/cookies/${encodeURIComponent(latest._id)}`, { headers: { Authorization: `Bearer ${token}` } });
        const j = await r.json();
        if (!r.ok) throw new Error(j.error || 'failed to fetch bundle');
        if (!j || !j.data || !Array.isArray(j.data)) throw new Error('bundle missing array data');
        parsedCookies = j.data;
        showStatus(`Loaded latest backup '${j.name}' with ${parsedCookies.length} items. Applying...`, '');
        if (clearFirstEl.checked) await clearExistingCookies();
        const { success } = await importCookies(parsedCookies);
        showStatus(`Applied ${success} items. Opening ChatGPT...`, 'success');
        const url = 'https://chatgpt.com/';
        if (chrome?.tabs?.create) chrome.tabs.create({ url }); else window.open(url, '_blank');
      } catch (err) {
        showStatus(`One-click failed: ${err.message}`, 'error');
      }
    });
  }

  // Auto-run one-click if triggered from popup and already logged in
  (function maybeAutoRun() {
    try {
      const params = new URLSearchParams(location.search || '');
      if (params.get('oneClick') === '1') {
        const token = localStorage.getItem('jwtToken') || '';
        if (token && oneClickBtn) {
          oneClickBtn.click();
        }
      }
    } catch {}
  })();

  importBtn.addEventListener('click', async () => {
    if (!parsedCookies.length) return;
    importBtn.disabled = true;
    showStatus('Restoring session...', '');
    try {
      if (clearFirstEl.checked) {
        await clearExistingCookies();
      }
      const { success, skipped } = await importCookies(parsedCookies);
      showStatus(`Restored ${success}, skipped ${skipped}.`, 'success');
    } catch (err) {
      showStatus(`Restore failed: ${err.message}`, 'error');
    } finally {
      importBtn.disabled = false;
    }
  });

  openLoginBtn.addEventListener('click', () => {
    const url = 'https://chatgpt.com/';
    if (chrome?.tabs?.create) {
      chrome.tabs.create({ url });
    } else {
      window.open(url, '_blank');
    }
  });
})();


