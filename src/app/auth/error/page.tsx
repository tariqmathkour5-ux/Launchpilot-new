"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";

const errorMessages: Record<string, { title: string; message: string }> = {
  default: {
    title: "Authentication Error",
    message: "An unexpected error occurred. Please try again.",
  },
  configuration: {
    title: "Server Configuration Error",
    message: "There is a problem with the server configuration. Please contact support.",
  },
  accessdenied: {
    title: "Access Denied",
    message: "You do not have permission to access this resource.",
  },
  verification: {
    title: "Verification Failed",
    message: "The verification link is invalid or has expired. Please request a new one.",
  },
  oauthsignin: {
    title: "OAuth Sign-In Error",
    message: "There was a problem signing in with your OAuth provider. Please try again.",
  },
  oauthcallback: {
    title: "OAuth Callback Error",
    message: "There was a problem processing the OAuth callback. Please try again.",
  },
  oauthcreateaccount: {
    title: "Account Creation Error",
    message: "Could not create an account with your OAuth provider. Please try a different method.",
  },
  emailcreateaccount: {
    title: "Email Account Error",
    message: "Could not create an account with this email address.",
  },
  callback: {
    title: "Callback Error",
    message: "There was a problem with the authentication callback. Please try again.",
  },
  oauthaccountnotlinked: {
    title: "Account Not Linked",
    message: "This OAuth account is not linked to any existing account. Please sign in with your email first.",
  },
  emailsignin: {
    title: "Email Sign-In Error",
    message: "There was a problem sending the sign-in email. Please try again.",
  },
  credentialssignin: {
    title: "Invalid Credentials",
    message: "The email or password you entered is incorrect.",
  },
  sessionrequired: {
    title: "Session Required",
    message: "Please sign in to access this page.",
  },
};

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error")?.toLowerCase() || "default";
  const errorInfo = errorMessages[error] || errorMessages.default;

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="card p-8 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-error-50 mb-6">
              <AlertTriangle className="h-7 w-7 text-error-600" />
            </div>

            <h1 className="text-xl font-bold text-secondary-900 mb-2">
              {errorInfo.title}
            </h1>
            <p className="text-secondary-500 text-sm mb-8">
              {errorInfo.message}
            </p>

            <div className="flex flex-col gap-3">
              <Link
                href="/auth/signin"
                className="w-full btn btn-primary py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="w-full btn btn-secondary py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
            </div>

            <p className="text-xs text-secondary-400 mt-6">
              If the problem persists, please contact support.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthErrorContent />
    </Suspense>
  );
}
