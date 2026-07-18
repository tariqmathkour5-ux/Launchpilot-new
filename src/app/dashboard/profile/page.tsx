"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  User, Mail, Camera, Loader2, CheckCircle2, AlertTriangle,
  Shield, Trash2, Save
} from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [iban, setIban] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (session?.user) {
      setName(session.user.name || "");
      setImage(session.user.image || null);
      loadProfile();
    }
  }, [session]);

  async function loadProfile() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/profile");
      if (res.ok) {
        const data = await res.json();
        setBio(data.bio || "");
        setName(data.name || session?.user?.name || "");
        setIban(data.iban || "");
        setImage(data.image || session?.user?.image || null);
      }
    } catch { /* ignore */ } finally {
      setIsLoading(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, bio, iban }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to update profile");
        setIsSaving(false);
        return;
      }

      setSuccess("Profile updated successfully");
      await updateSession();
    } catch {
      setError("Something went wrong");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    setIsSaving(true);
    try {
      const res = await fetch("/api/auth/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setImage(data.url);
      setSuccess("Avatar updated successfully");
      await updateSession();
    } catch {
      setError("Failed to upload image");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: deleteConfirmText }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to delete account");
        setIsDeleting(false);
        return;
      }

      window.location.href = "/";
    } catch {
      setError("Something went wrong");
      setIsDeleting(false);
    }
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-secondary-50 py-8">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <User className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">Profile</h1>
              <p className="text-sm text-secondary-500">Manage your personal information</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-error-50 text-error-600 text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 text-green-700 text-sm flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Avatar Section */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6 mb-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-secondary-100 overflow-hidden flex items-center justify-center">
                  {image ? (
                    <img src={image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="h-8 w-8 text-secondary-400" />
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-7 h-7 bg-primary-500 text-white rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-secondary-900">
                  {session?.user?.name || "User"}
                </p>
                <p className="text-sm text-secondary-500">{session?.user?.email}</p>
                <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 font-medium capitalize">
                  {session?.user?.role?.toLowerCase() || "user"}
                </span>
              </div>
            </div>
          </div>

          {/* Edit Profile Form */}
          <div className="bg-white rounded-xl border border-secondary-200 p-6 mb-6">
            <h2 className="text-base font-semibold text-secondary-900 mb-4">Edit Profile</h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input pl-10"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-secondary-400" />
                  <input
                    type="email"
                    value={session?.user?.email || ""}
                    className="input pl-10 bg-secondary-50 text-secondary-500 cursor-not-allowed"
                    disabled
                  />
                </div>
                <p className="text-xs text-secondary-400 mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">IBAN</label>
                <input
                  type="text"
                  value={iban}
                  onChange={(e) => setIban(e.target.value)}
                  className="input"
                  placeholder="Enter your IBAN (e.g., GB29NWBK60161331926819)"
                />
                <p className="text-xs text-secondary-400 mt-1">Used for payouts and refunds. Format: Country Code + 2 digits + up to 31 alphanumeric characters.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-2">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="input min-h-[100px] resize-y"
                  placeholder="Tell us a little about yourself..."
                  maxLength={500}
                />
                <p className="text-xs text-secondary-400 mt-1">{bio.length}/500</p>
              </div>

              <button
                type="submit"
                disabled={isSaving}
                className="btn btn-primary px-6 py-2.5 rounded-lg flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-xl border border-red-200">
            <div className="p-5 border-b border-red-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" />
                <h2 className="text-base font-semibold text-secondary-900">Danger Zone</h2>
              </div>
              <p className="text-xs text-secondary-500 mt-1">
                Irreversible actions for your account.
              </p>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-50 text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-secondary-900">Delete Account</p>
                    <p className="text-xs text-secondary-500">
                      Permanently delete your account and all associated data.
                    </p>
                  </div>
                </div>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="text-sm px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium"
                  >
                    Delete
                  </button>
                ) : null}
              </div>

              {showDeleteConfirm && (
                <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-sm font-medium text-red-900 mb-2">
                    Are you absolutely sure?
                  </p>
                  <p className="text-xs text-red-700 mb-3">
                    This will permanently delete your account, subscriptions, favorites,
                    collections, and all personal data. This action cannot be undone.
                  </p>
                  <p className="text-xs text-red-700 mb-3 font-medium">
                    Type "delete my account" to confirm.
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    className="input mb-3"
                    placeholder='Type "delete my account"'
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== "delete my account" || isDeleting}
                      className="text-sm px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Permanently Delete
                    </button>
                    <button
                      onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmText(""); }}
                      className="text-sm px-4 py-2 border border-secondary-200 text-secondary-600 rounded-lg hover:bg-secondary-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}