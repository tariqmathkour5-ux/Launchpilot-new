'use client';

import { useEffect, useRef, useCallback } from 'react';
import { trackEvent } from '@/lib/analytics';

interface PerformanceMetrics {
  lcp?: number;
  cls?: number;
  fid?: number;
  ttfb?: number;
  inp?: number;
}

interface UsePerformanceMetricsOptions {
  pageType: 'tool_detail' | 'tool_list' | 'blog' | 'homepage' | 'other';
  toolSlug?: string;
  enabled?: boolean;
}

/**
 * Hook to track Core Web Vitals and other performance metrics
 * Specifically monitors LCP and CLS for dynamic tool detail pages
 */
export function usePerformanceMetrics({
  pageType,
  toolSlug,
  enabled = true,
}: UsePerformanceMetricsOptions) {
  const metricsRef = useRef<PerformanceMetrics>({});
  const hasTrackedRef = useRef(false);

  const trackMetric = useCallback(
    (name: string, value: number, rating: 'good' | 'needs-improvement' | 'poor') => {
      // Only track once per page load
      if (hasTrackedRef.current) return;
      
      trackEvent('performance_metric', {
        metric_name: name,
        metric_value: value,
        metric_rating: rating,
        page_type: pageType,
        tool_slug: toolSlug,
        timestamp: new Date().toISOString(),
      });
    },
    [pageType, toolSlug]
  );

  useEffect(() => {
    if (!enabled || typeof window === 'undefined' || hasTrackedRef.current) {
      return;
    }

    // Track Largest Contentful Paint (LCP)
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
        renderTime?: number;
        loadTime?: number;
      };

      if (lastEntry) {
        const lcp = lastEntry.renderTime || lastEntry.loadTime || lastEntry.startTime;
        metricsRef.current.lcp = lcp;

        // LCP thresholds: Good <= 2500ms, Poor > 4000ms
        const rating = lcp <= 2500 ? 'good' : lcp <= 4000 ? 'needs-improvement' : 'poor';
        trackMetric('lcp', lcp, rating);
      }
    });

    try {
      observer.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch {
      // Fallback for browsers that don't support LCP
      console.warn('[Performance] LCP not supported');
    }

    // Track Cumulative Layout Shift (CLS)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShiftEntry = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value?: number;
        };
        
        // Only count layout shifts without recent user input
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value || 0;
          metricsRef.current.cls = clsValue;
        }
      }

      // Report CLS when page is hidden
      const reportCLS = () => {
        if (metricsRef.current.cls !== undefined) {
          const cls = metricsRef.current.cls;
          // CLS thresholds: Good <= 0.1, Poor > 0.25
          const rating = cls <= 0.1 ? 'good' : cls <= 0.25 ? 'needs-improvement' : 'poor';
          trackMetric('cls', cls, rating);
        }
      };

      // Report on page hide
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'hidden') {
          reportCLS();
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    });

    try {
      clsObserver.observe({ type: 'layout-shift', buffered: true });
    } catch {
      // Fallback for browsers that don't support CLS
      console.warn('[Performance] CLS not supported');
    }

    // Track First Input Delay (FID) / Interaction to Next Paint (INP)
    const interactionObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const interactionEntry = entry as PerformanceEntry & {
          processingStart?: number;
          duration?: number;
        };

        if (interactionEntry.processingStart !== undefined) {
          const fid = interactionEntry.processingStart - entry.startTime;
          if (fid > 0) {
            metricsRef.current.fid = fid;
            const rating = fid <= 100 ? 'good' : fid <= 300 ? 'needs-improvement' : 'poor';
            trackMetric('fid', fid, rating);
          }
        }

        // INP (Interaction to Next Paint) - newer metric
        if (interactionEntry.duration !== undefined) {
          const inp = interactionEntry.duration;
          metricsRef.current.inp = inp;
          const rating = inp <= 200 ? 'good' : inp <= 500 ? 'needs-improvement' : 'poor';
          trackMetric('inp', inp, rating);
        }
      }
    });

    try {
      interactionObserver.observe({ type: 'first-input', buffered: true });
      // Also observe for event-timing entries (for INP)
      interactionObserver.observe({ type: 'event', buffered: true });
    } catch {
      console.warn('[Performance] FID/INP not supported');
    }

    // Mark as tracked after a reasonable delay
    const timeout = setTimeout(() => {
      hasTrackedRef.current = true;
    }, 5000);

    return () => {
      observer.disconnect();
      clsObserver.disconnect();
      interactionObserver.disconnect();
      clearTimeout(timeout);
    };
  }, [enabled, trackMetric]);

  return {
    metrics: metricsRef.current,
    hasTracked: hasTrackedRef.current,
  };
}