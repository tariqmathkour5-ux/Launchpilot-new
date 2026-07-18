"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Building2 } from "lucide-react";

const sizeOptions = [
  { value: "STARTUP", label: "Startup (1-10)" },
  { value: "SMALL", label: "Small (11-50)" },
  { value: "MEDIUM", label: "Medium (51-200)" },
  { value: "LARGE", label: "Large (201-1000)" },
  { value: "ENTERPRISE", label: "Enterprise (1000+)" },
];

export default function NewCompanyPage() {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    slug: "",
    website: "",
    description: "",
    industry: "",
    size: "",
    founded: "",
    headquarters: "",
    email: "",
    phone: "",
  });

  const handleNameChange = (name: string) => {
    setForm({
      ...form,
      name,
      slug: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      setError("Name and slug are required.");
      return;
    }
    setIsSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          founded: form.founded ? parseInt(form.founded) : null,
          size: form.size || null,
        }),
      });

      if (res.ok) {
        router.push("/admin/companies");
      } else {
        const data = await res.json();
        setError(data.error || "Failed to create company.");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <Link
          href="/admin/companies"
          className="inline-flex items-center text-sm text-secondary-500 hover:text-primary-600 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to companies
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-secondary-100 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-secondary-600" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900">Add New Company</h1>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSaving}
            className="btn btn-primary"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Creating..." : "Create Company"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-error-50 text-error-600 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Basic Info */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-secondary-900">Basic Information</h2>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Name <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                className="input"
                placeholder="Company Name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                Slug <span className="text-error-500">*</span>
              </label>
              <input
                type="text"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                className="input"
                placeholder="company-slug"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Website</label>
              <input
                type="url"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="input"
                placeholder="https://company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input"
                rows={4}
                placeholder="Brief description of the company"
              />
            </div>
          </div>

          {/* Details */}
          <div className="card p-6 space-y-4">
            <h2 className="text-lg font-semibold text-secondary-900">Company Details</h2>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Industry</label>
              <input
                type="text"
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="input"
                placeholder="e.g., AI, SaaS, Healthcare"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Company Size</label>
              <select
                value={form.size}
                onChange={(e) => setForm({ ...form, size: e.target.value })}
                className="input"
              >
                <option value="">Select size</option>
                {sizeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Year Founded</label>
              <input
                type="number"
                value={form.founded}
                onChange={(e) => setForm({ ...form, founded: e.target.value })}
                className="input"
                placeholder="e.g., 2020"
                min={1800}
                max={2100}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Headquarters</label>
              <input
                type="text"
                value={form.headquarters}
                onChange={(e) => setForm({ ...form, headquarters: e.target.value })}
                className="input"
                placeholder="e.g., San Francisco, CA"
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="card p-6 space-y-4">
          <h2 className="text-lg font-semibold text-secondary-900">Contact Information</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="contact@company.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
