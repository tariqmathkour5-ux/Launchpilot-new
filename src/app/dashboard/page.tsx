'use client';

import Link from 'next/link';
import { Heart, Library, Clock, Shield, CreditCard, LayoutDashboard, User, Settings } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const dashboardLinks = [
  { href: '/dashboard/profile', icon: User, title: 'Profile', description: 'Manage your personal information', color: 'bg-purple-50 text-purple-600' },
  { href: '/dashboard/settings', icon: Settings, title: 'Settings', description: 'Configure your preferences', color: 'bg-gray-50 text-gray-600' },
  { href: '/dashboard/subscription', icon: CreditCard, title: 'Subscription', description: 'Manage your plan and billing', color: 'bg-primary-50 text-primary-600' },
  { href: '/dashboard/favorites', icon: Heart, title: 'Favorites', description: 'Your saved tools and categories', color: 'bg-red-50 text-red-600' },
  { href: '/dashboard/collections', icon: Library, title: 'Collections', description: 'Curated tool lists you can share', color: 'bg-blue-50 text-blue-600' },
  { href: '/dashboard/history', icon: Clock, title: 'Browsing History', description: 'Recently viewed tools and pages', color: 'bg-green-50 text-green-600' },
  { href: '/dashboard/privacy', icon: Shield, title: 'Privacy Controls', description: 'Manage your data preferences', color: 'bg-orange-50 text-orange-600' },
];

export default function DashboardPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-secondary-50 py-8">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-secondary-900">My Dashboard</h1>
              <p className="text-sm text-secondary-500">Manage your personalized experience</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {dashboardLinks.map(link => (
              <Link
                key={link.href}
                href={link.href}
                className="bg-white rounded-xl border border-secondary-200 p-6 hover:shadow-md hover:border-primary-200 transition-all group"
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${link.color} mb-4`}>
                  <link.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-secondary-900 group-hover:text-primary-600 transition-colors">{link.title}</h3>
                <p className="text-sm text-secondary-500 mt-1">{link.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}