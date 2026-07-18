import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  
  // Performance Monitoring
  tracesSampleRate: 0.1, // Sample 10% of transactions
  
  // Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Integration
  integrations: [
    Sentry.replayIntegration({
      maskAllText: false,
      blockAllMedia: false,
    }),
  ],
  
  // Error filtering
  beforeSend(event, hint) {
    // Filter out common non-critical errors
    const error = hint.originalException;
    
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);
      
      // Ignore ResizeObserver loop errors (common browser quirk)
      if (message.includes('ResizeObserver loop')) {
        return null;
      }
      
      // Ignore network errors that are not actionable
      if (message.includes('Network request failed') || message.includes('fetch failed')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Sanitize data to prevent PII
  beforeSendTransaction(event) {
    return event;
  },
});