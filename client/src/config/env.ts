// Environment configuration
// This file centralizes all environment variable access

export const config = {
  // API Configuration
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'ChatGPT Manager',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  
  // Session Configuration
  sessionTimeout: parseInt(import.meta.env.VITE_SESSION_TIMEOUT || '3600000'), // 1 hour
  activityCheckInterval: parseInt(import.meta.env.VITE_ACTIVITY_CHECK_INTERVAL || '60000'), // 1 minute
  
  // Environment
  nodeEnv: import.meta.env.VITE_NODE_ENV || import.meta.env.MODE || 'development',
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production',
  debug: import.meta.env.VITE_DEBUG === 'true',
} as const;

// Validate required environment variables
const requiredEnvVars = ['VITE_API_URL'] as const;

export const validateEnv = (): void => {
  const missing = requiredEnvVars.filter(envVar => !import.meta.env[envVar]);
  
  if (missing.length > 0) {
    console.warn('⚠️ Missing environment variables:', missing);
    console.warn('📝 Please check your .env file and ensure all required variables are set');
  }
  
  if (config.debug) {
    console.log('🔧 Environment Configuration:', {
      apiUrl: config.apiUrl,
      nodeEnv: config.nodeEnv,
      isDevelopment: config.isDevelopment,
      isProduction: config.isProduction
    });
  }
};

// Export individual config values for convenience
export const {
  apiUrl,
  apiTimeout,
  appName,
  appVersion,
  sessionTimeout,
  activityCheckInterval,
  nodeEnv,
  isDevelopment,
  isProduction,
  debug
} = config;
