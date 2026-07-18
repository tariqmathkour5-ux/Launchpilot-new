import Link from 'next/link';
import { Sparkles, Github, Twitter, Linkedin } from 'lucide-react';

export default function Footer() {
  const categories = [
    { name: 'AI Chat', href: '/categories/ai-chat' },
    { name: 'AI Image', href: '/categories/ai-image' },
    { name: 'AI Coding', href: '/categories/ai-coding' },
    { name: 'AI Writing', href: '/categories/ai-writing' },
    { name: 'AI Audio', href: '/categories/ai-audio' },
    { name: 'AI Video', href: '/categories/ai-video' },
  ];

  const resources = [
    { name: 'All Tools', href: '/tools' },
    { name: 'Categories', href: '/categories' },
    { name: 'Compare Tools', href: '/compare' },
  ];

  return (
    <footer className="bg-secondary-900 text-secondary-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-accent-500">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">LaunchPilot</span>
            </Link>
            <p className="text-sm text-secondary-400 mb-4">
              Your comprehensive guide to discovering, comparing, and implementing the best AI tools.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-secondary-400 hover:text-white transition-colors" aria-label="GitHub">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-secondary-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-secondary-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.href}>
                  <Link href={cat.href} className="text-sm hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-2">
              {resources.map((res) => (
                <li key={res.href}>
                  <Link href={res.href} className="text-sm hover:text-white transition-colors">
                    {res.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Legal</h3>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-sm hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-sm hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/affiliate-disclosure" className="text-sm hover:text-white transition-colors">Affiliate Disclosure</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-secondary-800">
          <p className="text-center text-sm text-secondary-500">
            &copy; {new Date().getFullYear()} LaunchPilot. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
