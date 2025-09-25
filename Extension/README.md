# ChatGPT Cookie Importer (Chrome Extension)

Import cookies from a JSON file (e.g., `chatgpt.com-cookies.json`) into `https://chatgpt.com` using Chrome's cookies API.

## Important
- Only use cookies you own. Cookies are sensitive credentials.
- Some cookies are short-lived (e.g., Cloudflare). Importing them may not persist a session.

## Requirements
- Google Chrome (or any Chromium-based browser that supports Manifest V3).

## Install (Load Unpacked)
1. Download or copy this folder to your computer.
2. Open Chrome → Menu → More tools → Extensions.
3. Enable "Developer mode" (top-right).
4. Click "Load unpacked" and select this folder.

## Usage
1. Open the extension options page: Extensions → ChatGPT Cookie Importer → Details → Extension options.
2. Click "Select chatgpt.com-cookies.json" and choose your JSON file.
3. (Optional) Enable "Clear existing chatgpt.com cookies before import" to start clean.
4. Click "Import Cookies". The importer verifies each cookie after setting it.
5. Click "Open ChatGPT" to navigate to the site. Refresh if needed.

## JSON Format
- Expected input is an array of cookie objects, each with fields like:
  - name, value, domain (e.g., `chatgpt.com` or `.chatgpt.com`), path, expiry (epoch seconds), sameSite (lax/strict/no_restriction), secure, httpOnly
- Example: see `chatgpt.com-cookies.json` in this folder.

## Behavior and Rules
- `__Host-` cookies: enforced as host-only for `chatgpt.com`, path `/`, and `secure=true`.
- `sameSite`: normalized to `lax`, `strict`, or `no_restriction`.
- `expiry`: supports numbers (epoch seconds), string numbers, ISO dates, or `null` (session cookie).
- Domain normalization: leading dot is removed; defaults to `chatgpt.com` when missing.

## Troubleshooting
- If import fails with permission errors, ensure the extension is loaded and that `chatgpt.com` is allowed in host permissions (declared in `manifest.json`).
- If cookies still do not apply, try visiting `https://chatgpt.com` once to initialize storage, then import again.
- Some httpOnly cookies are server-managed and/or quickly invalidated; a fresh login may be required.

## Uninstall
- Remove the extension from chrome://extensions.

## License
- MIT
