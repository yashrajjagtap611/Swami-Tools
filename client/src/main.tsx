import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// Ensure proper viewport meta tag for mobile
const ensureViewportMeta = () => {
  let viewport = document.querySelector('meta[name="viewport"]');
  if (!viewport) {
    viewport = document.createElement('meta');
    viewport.setAttribute('name', 'viewport');
    document.head.appendChild(viewport);
  }
  viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes');
};

// Ensure theme-color meta tag for mobile browsers
const ensureThemeColorMeta = () => {
  let themeColor = document.querySelector('meta[name="theme-color"]');
  if (!themeColor) {
    themeColor = document.createElement('meta');
    themeColor.setAttribute('name', 'theme-color');
    themeColor.setAttribute('content', '#2563eb'); // Default to primary blue
    document.head.appendChild(themeColor);
  }
};

// Add mobile-specific meta tags
const addMobileMeta = () => {
  // Apple mobile web app capable
  let appleCapable = document.querySelector('meta[name="apple-mobile-web-app-capable"]');
  if (!appleCapable) {
    appleCapable = document.createElement('meta');
    appleCapable.setAttribute('name', 'apple-mobile-web-app-capable');
    appleCapable.setAttribute('content', 'yes');
    document.head.appendChild(appleCapable);
  }

  // Apple status bar style
  let appleStatusBar = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (!appleStatusBar) {
    appleStatusBar = document.createElement('meta');
    appleStatusBar.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
    appleStatusBar.setAttribute('content', 'default');
    document.head.appendChild(appleStatusBar);
  }

  // Apple mobile web app title
  let appleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (!appleTitle) {
    appleTitle = document.createElement('meta');
    appleTitle.setAttribute('name', 'apple-mobile-web-app-title');
    appleTitle.setAttribute('content', 'ChatGPT Manager');
    document.head.appendChild(appleTitle);
  }
};

// Initialize mobile optimizations
ensureViewportMeta();
ensureThemeColorMeta();
addMobileMeta();

// Add error boundary for better error handling
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '2rem',
          textAlign: 'center',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '1rem' }}>Something went wrong</h1>
          <p style={{ color: '#64748b', marginBottom: '2rem' }}>
            We're sorry, but something unexpected happened. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
