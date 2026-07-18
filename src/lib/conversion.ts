/**
 * Smart Conversion System - Utility Library
 * 
 * This module provides utilities for injecting affiliate buttons and managing
 * exit-intent popups to increase conversion rates.
 */

// Re-export components
export { AffiliateButton } from '@/components/AffiliateButton';
export { default as ConversionModal } from '@/components/ConversionModal';
export { useExitIntent } from '@/hooks/use-exit-intent';
export { SmartConversionProvider } from '@/components/SmartConversionProvider';

// Re-export utilities
export { injectAffiliateButtons, injectAffiliateIntoComparisonArticle } from '@/components/AffiliateButton';
export type { ToolComparisonArticle } from '@/components/AffiliateButton';

/**
 * Quick utility function to generate a countdown end time
 * @param hours - Number of hours from now (default: 24)
 * @returns Date object for the countdown end time
 */
export function getEndTimeFromNow(hours: number = 24): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

/**
 * Calculate time left for a given end time
 * @param endTime - The end date/time
 * @returns Object with hours, minutes, and seconds
 */
export function calculateTimeLeft(endTime: Date): { hours: number; minutes: number; seconds: number } {
  const now = new Date();
  const diff = endTime.getTime() - now.getTime();

  if (diff <= 0) {
    return { hours: 0, minutes: 0, seconds: 0 };
  }

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  return { hours, minutes, seconds };
}

/**
 * Format time unit for display (two-digit format)
 * @param value - Time value
 * @returns Formatted string (e.g., "05" instead of "5")
 */
export function formatTimeUnit(value: number): string {
  return value.toString().padStart(2, "0");
}