'use client';

import { usePerformanceMetrics } from '@/hooks/use-performance-metrics';

interface ToolPerformanceTrackerProps {
  toolSlug: string;
}

/**
 * Client component to track performance metrics on tool detail pages
 * This should be included in the tool detail page layout
 */
export function ToolPerformanceTracker({ toolSlug }: ToolPerformanceTrackerProps) {
  usePerformanceMetrics({
    pageType: 'tool_detail',
    toolSlug,
    enabled: true,
  });

  return null; // This component doesn't render anything
}