"use client";

import { ReactNode } from "react";
import ConversionModal from "./ConversionModal";

interface SmartConversionProviderProps {
  children: ReactNode;
  toolName?: string;
  toolSlug?: string;
  discount?: string;
  endTime?: Date;
  enabled?: boolean;
}

/**
 * Smart Conversion Provider
 * Wraps your app/pages with exit-intent modal functionality
 * 
 * Usage:
 * ```tsx
 * <SmartConversionProvider toolName="ChatGPT" toolSlug="chatgpt" discount="30% OFF">
 *   <YourPageContent />
 * </SmartConversionProvider>
 * ```
 */
export function SmartConversionProvider({
  children,
  toolName,
  toolSlug,
  discount,
  endTime,
  enabled = true,
}: SmartConversionProviderProps) {
  return (
    <>
      {children}
      <ConversionModal
        toolName={toolName}
        toolSlug={toolSlug}
        discount={discount}
        endTime={endTime}
        enabled={enabled}
      />
    </>
  );
}

export default SmartConversionProvider;