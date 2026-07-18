"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Mail, ArrowLeft, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Something went wrong");
        setIsLoading(false);
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-50 text-primary-600 mb-4">
                <Mail className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-secondary-900">Forgot Password?</h1>
              <p className="text-secondary-500 mt-2">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 rounded-lg bg-error-50 text-error-600 text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {sent ? (
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-50 mb-4">
                  <CheckCircle2 className="h-7 w-7 text-green-600" />
                </div>
                <h2 className="text-lg font-semibold text-secondary-900 mb-2">Check Your Email</h2>
                <p className="text-sm text-secondary-500 mb-6">
                  We've sent a password reset link to <strong className="text-secondary-700">{email}</strong>.
                  Please check your inbox and follow the instructions.
                </p>
                <p className="text-xs text-secondary-400 mb-6">
                  Didn't receive the email? Check your spam folder or{" "}
                  <button
                    onClick={() => { setSent(false); setEmail(""); }}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    try again
                  </button>
                </p>
                <Link
                  href="/auth/signin"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Sign In
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="you@example.com"
                      required
                    />
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
                    "Send Reset Link"
                  )}
                </button>

                <p className="text-center text-sm text-secondary-500">
                  <Link href="/auth/signin" className="text-primary-600 hover:text-primary-700 font-medium flex items-center justify-center gap-1">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Sign In
                  </Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}