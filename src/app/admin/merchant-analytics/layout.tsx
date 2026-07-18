"use client";

import { ReactNode } from "react";

// Merchant analytics uses token-based auth, not session auth
// This is a minimal layout that doesn't require admin permissions
export default function MerchantAnalyticsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}