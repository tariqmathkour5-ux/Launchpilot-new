"use client";

import { useEffect, useState } from "react";
import { Bell, CheckCircle, AlertCircle, Info, AlertTriangle, Trash2 } from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

const typeIcons: Record<string, React.ElementType> = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const typeColors: Record<string, string> = {
  info: "bg-accent-100 text-accent-700",
  success: "bg-success-100 text-success-700",
  warning: "bg-warning-100 text-warning-700",
  error: "bg-error-100 text-error-700",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/admin/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: "PATCH" });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/admin/notifications/mark-all-read", { method: "POST" });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/admin/notifications/${id}`, { method: "DELETE" });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Notifications</h1>
          <p className="text-secondary-500 mt-1">
            {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="btn btn-secondary">
            <CheckCircle className="h-4 w-4 mr-2" />
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card p-12 text-center">
          <Bell className="h-12 w-12 text-secondary-300 mx-auto mb-4" />
          <p className="text-secondary-500">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = typeIcons[notification.type] || Bell;
            const colorClass = typeColors[notification.type] || "bg-secondary-100";

            return (
              <div
                key={notification.id}
                className={`card p-4 flex items-start gap-4 ${
                  !notification.read ? "border-l-4 border-l-primary-500" : ""
                }`}
              >
                <div className={`p-2 rounded-lg ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-secondary-900">{notification.title}</p>
                    {!notification.read && (
                      <span className="w-2 h-2 bg-primary-500 rounded-full" />
                    )}
                  </div>
                  <p className="text-sm text-secondary-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-secondary-400 mt-2">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="p-2 text-secondary-400 hover:text-secondary-600 transition-colors"
                      title="Mark as read"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="p-2 text-secondary-400 hover:text-error-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
