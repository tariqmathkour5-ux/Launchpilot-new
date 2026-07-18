"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [invalidToken, setInvalidToken] = useState(!token);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        if (res.status === 400) setInvalidToken(true);
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/auth/signin"), 3000);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (invalidToken) {
    return (
      <>
        <Header />
        <main className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
          <div className="w-full max-w-md">
            <div className="card p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-error-50 mb-4">
                <AlertTriangle className="h-7 w-7 text-error-600" />
              </div>
              <h1 className="text-xl font-bold text-secondary-900 mb-2">Invalid or Expired Link</h1>
              <p className="text-sm text-secondary-500 mb-6">
                This password reset link is invalid or has expired. Please request a new one.
              </p>
              <Link
                href="/auth/forgot-password"
                className="btn btn-primary py-2.5 px-6 rounded-lg inline-flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Request New Link
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-50 text-primary-600 mb-4">
                <Lock className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-secondary-900">Reset Password</h1>
              <p className="text-secondary-500 mt-2">Enter your new password below.</p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-error-50 text-error-600 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {success ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-4">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Password Reset!</h2>
                <p className="text-sm text-secondary-500 mb-6">
                  Your password has been successfully reset. Redirecting to sign in...
                </p>
                <Link
                  href="/auth/signin"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign in now
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-10 pr-10"
                      placeholder="Enter new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input pl-10 pr-10"
                      placeholder="Confirm new password"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary-400 hover:text-secondary-600"
                    >
                      {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn btn-primary py-3 rounded-lg disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}