import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: process.env.NODE_ENV === 'production',
  
  // Performance Monitoring
  tracesSampleRate: 0.1,
  
  // Error filtering
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    if (error && typeof error === 'object' && 'message' in error) {
      const message = String(error.message);
      
      // Ignore Prisma query errors that are expected in some cases
      if (message.includes('Record to delete does not exist')) {
        return null;
      }
      
      // Ignore common NextAuth errors
      if (message.includes('Session') && message.includes('not found')) {
        return null;
      }
    }
    
    return event;
  },
  
  // Add custom tags for better organization
  beforeSendTransaction(event) {
    if (event.request) {
      // Tag transactions by route
      event.tags = event.tags || {};
      event.tags.route = event.request.url || 'unknown';
    }
    return event;
  },
  
  // Server-specific integrations
  integrations: [
    Sentry.prismaIntegration(),
  ],
});

// Instrumentation for monitoring universal-import-engine and OG image routes
export const registerInstrumentations = async () => {
  // This will be called during server startup
  const startTime = Date.now();
  
  // Monitor execution time of critical server operations
  const originalFetch = global.fetch;
  global.fetch = async (input, init) => {
    const fetchStart = Date.now();
    
    try {
      const response = await originalFetch(input, init);
      const duration = Date.now() - fetchStart;
      
      // Log slow API responses (> 500ms)
      if (duration > 500) {
        console.warn(`[Performance] Slow fetch detected: ${input} took ${duration}ms`);
      }
      
      return response;
    } catch (error) {
      const duration = Date.now() - fetchStart;
      console.error(`[Performance] Failed fetch to ${input} after ${duration}ms:`, error);
      throw error;
    }
  };
  
  console.log(`[Instrumentation] Server instrumentation registered in ${Date.now() - startTime}ms`);
};