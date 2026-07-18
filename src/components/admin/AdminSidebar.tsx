"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";
import {
  LayoutDashboard,
  Wrench,
  FolderTree,
  Users,
  Shield,
  MessageSquare,
  Link2,
  Megaphone,
  Ticket,
  Mail,
  Bell,
  Image,
  Search,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Building2,
  Activity,
  CreditCard,
  Globe,
} from "lucide-react";
import { signOut } from "next-auth/react";

const navGroups = [
  {
    title: "Main",
    items: [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Global Search", href: "/admin/search", icon: Search },
    ],
  },
  {
    title: "Content",
    items: [
      { name: "AI Tools", href: "/admin/tools", icon: Wrench },
      { name: "Categories", href: "/admin/categories", icon: FolderTree },
      { name: "Companies", href: "/admin/companies", icon: Building2 },
      { name: "Verifications", href: "/admin/companies/verifications", icon: Shield },
      { name: "Reviews", href: "/admin/reviews", icon: MessageSquare },
      { name: "Blog", href: "/admin/blog", icon: FileText },
    ],
  },
  {
    title: "Users & Access",
    items: [
      { name: "Users", href: "/admin/users", icon: Users },
      { name: "Roles", href: "/admin/roles", icon: Shield },
    ],
  },
  {
    title: "Marketing",
    items: [
      { name: "Affiliates", href: "/admin/affiliates", icon: Link2 },
      { name: "Advertisements", href: "/admin/ads", icon: Megaphone },
      { name: "Coupons", href: "/admin/coupons", icon: Ticket },
      { name: "Newsletter", href: "/admin/newsletter", icon: Mail },
      { name: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
    ],
  },
  {
    title: "Analytics",
    items: [
      { name: "Executive Dashboard", href: "/admin/analytics?tab=executive", icon: LayoutDashboard },
      { name: "Traffic Analytics", href: "/admin/analytics?tab=traffic", icon: BarChart3 },
      { name: "Search Analytics", href: "/admin/analytics?tab=search", icon: Search },
      { name: "Tool Analytics", href: "/admin/analytics?tab=tools", icon: Wrench },
      { name: "Affiliate Analytics", href: "/admin/analytics?tab=affiliate", icon: Link2 },
      { name: "Revenue Dashboard", href: "/admin/analytics?tab=revenue", icon: BarChart3 },
      { name: "Recommendations", href: "/admin/recommendations", icon: Sparkles },
    ],
  },
  {
    title: "System",
    items: [
      { name: "Media Library", href: "/admin/media", icon: Image },
      { name: "Notifications", href: "/admin/notifications", icon: Bell },
      { name: "Activity Logs", href: "/admin/logs", icon: Activity },
      { name: "SEO", href: "/admin/seo", icon: Search },
      { name: "SEO Pages", href: "/admin/seo-pages", icon: Globe },
      { name: "Growth Report", href: "/admin/growth-report", icon: BarChart3 },
      { name: "Settings", href: "/admin/settings", icon: Settings },
    ],
  },
];

export default function AdminSidebar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-secondary-900 text-white flex flex-col z-50 transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Header */}
      <div className="p-4 border-b border-secondary-700 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-lg font-bold">LaunchPilot</span>
              <p className="text-xs text-secondary-400">Admin Dashboard</p>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-secondary-800 transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-4">
            {!collapsed && (
              <h3 className="px-3 py-2 text-xs font-semibold text-secondary-500 uppercase tracking-wider">
                {group.title}
              </h3>
            )}
            <ul className="space-y-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary-600 text-white"
                          : "text-secondary-300 hover:bg-secondary-800 hover:text-white"
                      }`}
                      title={collapsed ? item.name : undefined}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!collapsed && <span>{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-secondary-700">
        {session?.user && (
          <div className={`flex items-center gap-3 mb-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="h-8 w-8 rounded-full bg-primary-600 flex items-center justify-center text-sm font-medium flex-shrink-0">
              {session.user.name?.charAt(0) || "U"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{session.user.name}</p>
                <p className="text-xs text-secondary-400">
                  {session.user.role || "User"}
                </p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className={`flex items-center gap-2 w-full px-3 py-2 text-secondary-300 hover:text-white hover:bg-secondary-800 rounded-lg transition-colors ${
            collapsed ? "justify-center" : ""
          }`}
          title="Sign out"
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
