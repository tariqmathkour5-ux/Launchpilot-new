'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Search, Menu, X, Sparkles, Tag } from 'lucide-react';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { name: 'AI Chat', href: '/categories/ai-chat' },
    { name: 'AI Image', href: '/categories/ai-image' },
    { name: 'AI Coding', href: '/categories/ai-coding' },
    { name: 'AI Writing', href: '/categories/ai-writing' },
    { name: 'AI Audio', href: '/categories/ai-audio' },
    { name: 'AI Video', href: '/categories/ai-video' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-secondary-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-secondary-900">LaunchPilot</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-6">
              {categories.slice(0, 4).map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="text-sm font-medium text-secondary-600 hover:text-primary-600 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/pricing"
                className="text-sm font-medium text-secondary-600 hover:text-primary-600 transition-colors"
              >
                Pricing
              </Link>
              <Link
                href="/deals"
                className="text-sm font-medium text-warning-600 hover:text-warning-700 transition-colors flex items-center gap-1"
              >
                <Tag className="h-3.5 w-3.5" />
                Deals
              </Link>
              <div className="relative group">
                <button className="text-sm font-medium text-secondary-600 hover:text-primary-600 transition-colors">
                  More
                </button>
                <div className="absolute top-full left-0 pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <div className="bg-white rounded-lg shadow-lg border border-secondary-200 py-2 min-w-40">
                    {categories.slice(4).map((cat) => (
                      <Link
                        key={cat.href}
                        href={cat.href}
                        className="block px-4 py-2 text-sm text-secondary-600 hover:bg-secondary-50 hover:text-primary-600"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center relative">
              <Search className="absolute left-3 h-4 w-4 text-secondary-400" />
              <input
                type="search"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
                  }
                }}
                className="w-64 rounded-lg border border-secondary-200 bg-secondary-50 py-2 pl-10 pr-4 text-sm focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
              />
            </div>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-secondary-200">
            <div className="flex flex-col gap-2">
              {categories.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-50"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/pricing"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-4 py-2 text-secondary-600 hover:bg-secondary-50"
              >
                Pricing
              </Link>
              <Link
                href="/deals"
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-4 py-2 text-warning-600 hover:bg-warning-50 flex items-center gap-2"
              >
                <Tag className="h-4 w-4" />
                Deals
              </Link>
              <div className="pt-2 border-t border-secondary-200">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-secondary-400" />
                  <input
                    type="search"
                    placeholder="Search tools..."
                    className="w-full rounded-lg border border-secondary-200 bg-secondary-50 py-2 pl-10 pr-4 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}