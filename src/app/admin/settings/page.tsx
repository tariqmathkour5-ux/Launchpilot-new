"use client";

import { useState } from "react";
import { Settings, Save, Globe, Mail, CreditCard, Link2, Shield, Globe2 } from "lucide-react";

const settingGroups = [
  { id: "general", name: "General", icon: Globe, description: "Site name, URL, and basic settings" },
  { id: "branding", name: "Branding", icon: Settings, description: "Logo, colors, and visual identity" },
  { id: "email", name: "Email", icon: Mail, description: "SMTP and notification settings" },
  { id: "auth", name: "Authentication", icon: Shield, description: "OAuth providers and security" },
  { id: "payments", name: "Payments", icon: CreditCard, description: "Stripe and billing settings" },
  { id: "affiliate", name: "Affiliate", icon: Link2, description: "Affiliate program settings" },
];

export default function SettingsPage() {
  const [activeGroup, setActiveGroup] = useState("general");
  const [settings, setSettings] = useState({
    siteName: "LaunchPilot",
    siteUrl: "https://launchpilot.ai",
    contactEmail: "hello@launchpilot.ai",
    defaultCommission: "10",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Settings</h1>
          <p className="text-secondary-500 mt-1">Configure your platform settings</p>
        </div>
        <button onClick={handleSave} disabled={isSaving} className="btn btn-primary">
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {settingGroups.map((group) => (
              <button
                key={group.id}
                onClick={() => setActiveGroup(group.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeGroup === group.id
                    ? "bg-primary-50 text-primary-700 border border-primary-200"
                    : "text-secondary-600 hover:bg-secondary-50"
                }`}
              >
                <group.icon className="h-5 w-5" />
                <div className="text-left">
                  <p className="font-medium">{group.name}</p>
                  <p className="text-xs text-secondary-500">{group.description}</p>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeGroup === "general" && (
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-semibold">General Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Site Name
                  </label>
                  <input
                    type="text"
                    value={settings.siteName}
                    onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Site URL
                  </label>
                  <input
                    type="url"
                    value={settings.siteUrl}
                    onChange={(e) => setSettings({ ...settings, siteUrl: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={settings.contactEmail}
                    onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                    className="input"
                  />
                </div>
              </div>
            </div>
          )}

          {activeGroup === "affiliate" && (
            <div className="card p-6 space-y-6">
              <h2 className="text-lg font-semibold">Affiliate Settings</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-2">
                    Default Commission (%)
                  </label>
                  <input
                    type="number"
                    value={settings.defaultCommission}
                    onChange={(e) => setSettings({ ...settings, defaultCommission: e.target.value })}
                    className="input w-32"
                    min={0}
                    max={100}
                  />
                  <p className="text-xs text-secondary-500 mt-1">
                    Default commission rate for new affiliate partners
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeGroup !== "general" && activeGroup !== "affiliate" && (
            <div className="card p-6">
              <div className="text-center py-12">
                <Settings className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-secondary-900">Coming Soon</h3>
                <p className="text-secondary-500 text-sm mt-1">
                  {settingGroups.find((g) => g.id === activeGroup)?.description} configuration will be available soon.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
