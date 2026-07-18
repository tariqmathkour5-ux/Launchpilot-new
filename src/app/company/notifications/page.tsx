'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader2, MessageSquare, Wrench, Megaphone, Shield, Info } from 'lucide-react';

interface Notification {
  id: string; type: string; title: string; message: string;
  data: unknown; read: boolean; readAt: string | null; createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  COMPANY: { icon: Shield, color: 'text-blue-600', bg: 'bg-blue-50' },
  REVIEW: { icon: MessageSquare, color: 'text-amber-600', bg: 'bg-amber-50' },
  TOOL: { icon: Wrench, color: 'text-primary-600', bg: 'bg-primary-50' },
  CAMPAIGN: { icon: Megaphone, color: 'text-green-600', bg: 'bg-green-50' },
  SYSTEM: { icon: Info, color: 'text-secondary-600', bg: 'bg-secondary-100' },
  USER: { icon: Info, color: 'text-secondary-600', bg: 'bg-secondary-100' },
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const d = await res.json();
        setNotifications(d.notifications ?? []);
      }
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true }),
      });
      setNotifications(ns => ns.map(n => ({ ...n, read: true })));
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  const companyNotifications = notifications.filter(n =>
    ['COMPANY', 'REVIEW', 'TOOL', 'CAMPAIGN'].includes(n.type)
  );

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Notifications</h1>
          <p className="text-sm text-secondary-500 mt-0.5">
            {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={markingAll}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-secondary-600 border border-secondary-200 rounded-lg hover:bg-secondary-50 transition-colors disabled:opacity-50"
          >
            {markingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCheck className="h-4 w-4" />}
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-primary-500" />
        </div>
      ) : companyNotifications.length === 0 ? (
        <div className="bg-white rounded-xl border border-secondary-200 p-14 text-center">
          <Bell className="h-10 w-10 text-secondary-300 mx-auto mb-3" />
          <p className="text-secondary-500 font-medium">No notifications yet</p>
          <p className="text-sm text-secondary-400 mt-1">
            You'll receive updates about reviews, campaigns, verification, and tool approvals here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {companyNotifications.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
            const NIcon = cfg.icon;
            return (
              <div
                key={n.id}
                onClick={() => !n.read && markRead(n.id)}
                className={`bg-white rounded-xl border transition-all ${n.read ? 'border-secondary-200 opacity-70' : 'border-secondary-200 hover:border-primary-200 cursor-pointer shadow-sm'}`}
              >
                <div className="flex gap-4 p-4">
                  <div className={`flex-shrink-0 flex h-9 w-9 items-center justify-center rounded-lg ${cfg.bg}`}>
                    <NIcon className={`h-4 w-4 ${cfg.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold ${n.read ? 'text-secondary-600' : 'text-secondary-900'}`}>
                        {n.title}
                      </p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-secondary-400 whitespace-nowrap">{timeAgo(n.createdAt)}</span>
                        {!n.read && <span className="h-2 w-2 rounded-full bg-primary-500 flex-shrink-0" />}
                      </div>
                    </div>
                    <p className={`text-sm mt-0.5 leading-relaxed ${n.read ? 'text-secondary-400' : 'text-secondary-600'}`}>
                      {n.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
