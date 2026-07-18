'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import {
  LayoutDashboard, Building2, Users, BarChart3, Megaphone,
  MessageSquare, Image, Shield, ChevronLeft, ChevronRight,
  LogOut, Sparkles, UserCheck, Bell, Settings
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/company/dashboard', icon: LayoutDashboard },
  { name: 'Profile', href: '/company/profile', icon: Building2 },
  { name: 'Team', href: '/company/team', icon: Users },
  { name: 'Analytics', href: '/company/analytics', icon: BarChart3 },
  { name: 'Campaigns', href: '/company/campaigns', icon: Megaphone },
  { name: 'Leads', href: '/company/leads', icon: UserCheck },
  { name: 'Reviews', href: '/company/reviews', icon: MessageSquare },
  { name: 'Media', href: '/company/media', icon: Image },
  { name: 'Verification', href: '/company/verification', icon: Shield },
  { name: 'Notifications', href: '/company/notifications', icon: Bell },
];

export default function CompanySidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`fixed left-0 top-0 h-full bg-secondary-900 text-white flex flex-col z-50 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-secondary-700 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex-shrink-0">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          {!collapsed && (
            <div>
              <span className="text-lg font-bold">Company</span>
              <p className="text-xs text-secondary-400">Portal</p>
            </div>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-secondary-800 transition-colors"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-2">
        <ul className="space-y-1">
          {navItems.map(item => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                    isActive ? 'bg-primary-600 text-white' : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
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
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-secondary-700 space-y-2">
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2 px-3 py-2 text-xs text-secondary-400 hover:text-white hover:bg-secondary-800 rounded-lg transition-colors">
            <Settings className="h-4 w-4" />
            Admin Panel
          </Link>
        )}
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className={`flex items-center gap-2 w-full px-3 py-2 text-secondary-300 hover:text-white hover:bg-secondary-800 rounded-lg transition-colors ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut className="h-5 w-5" />
          {!collapsed && <span className="text-sm">Sign out</span>}
        </button>
      </div>
    </aside>
  );
}
