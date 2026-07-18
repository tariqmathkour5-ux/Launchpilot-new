import { registerInstrumentations } from './sentry.server.config';

/**
 * Next.js Instrumentation Hook
 * This runs once on server startup to set up monitoring
 */
export async function register() {
  // Register Sentry and other instrumentations
  if (process.env.NODE_ENV === 'production') {
    await registerInstrumentations();
  }
  
  // Performance monitoring for critical paths
  console.log('[Instrumentation] Server instrumentation initialized');
  
  // Monitor universal-import-engine execution time in production
  if (process.env.NODE_ENV === 'production') {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      const message = args[0];
      // Auto-tag universal-import-engine and OG route logs with timestamps
      if (typeof message === 'string' && 
          (message.includes('universal-import-engine') || 
           message.includes('ImportEngine') ||
           message.includes('/api/og/'))) {
        originalConsoleLog(`[Performance] [${new Date().toISOString()}]`, ...args);
      } else {
        originalConsoleLog(...args);
      }
    };
  }
}

/**
 * Observability instrumentation interface
 * Compatible with OpenTelemetry patterns
 */
export const observabilityInstrumentation = {
  name: 'launchpilot-observability',
  version: '1.0.0',
};