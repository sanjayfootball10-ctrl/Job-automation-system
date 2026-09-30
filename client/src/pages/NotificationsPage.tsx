import React, { useState } from 'react';
import type { AppNotification } from '../types';
import { Bell, CheckCheck, Trash2, ExternalLink, Settings } from 'lucide-react';

interface NotificationsPageProps {
  notifications: AppNotification[];
  unreadCount: number;
  onMarkNotificationRead: (id: number) => void;
  onMarkAllNotificationsRead: () => void;
  onDeleteNotification: (id: number) => void;
  setActiveTab: (tab: string) => void;
}

export const NotificationsPage: React.FC<NotificationsPageProps> = ({
  notifications,
  unreadCount,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onDeleteNotification,
  setActiveTab
}) => {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [interviewAlerts, setInterviewAlerts] = useState(true);
  const [deadlineAlerts, setDeadlineAlerts] = useState(true);

  const filtered = notifications.filter((n) => (filter === 'unread' ? !n.is_read : true));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Notification Center <Bell className="w-5 h-5 text-brand-500" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Automated alerts for upcoming interviews, pending application reminders, and recruiter updates.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllNotificationsRead}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
          >
            <CheckCheck className="w-4 h-4" /> Mark All as Read
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Notifications List */}
        <div className="lg:col-span-2 space-y-4">
          {/* Tabs */}
          <div className="flex items-center justify-between glass-panel p-2">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filter === 'all' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setFilter('unread')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  filter === 'unread' ? 'bg-brand-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Unread ({unreadCount})
              </button>
            </div>
          </div>

          {/* List Items */}
          {filtered.length === 0 ? (
            <div className="p-12 text-center glass-panel space-y-2">
              <Bell className="w-8 h-8 mx-auto text-slate-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No notifications</h3>
              <p className="text-xs text-slate-500">You are all caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-4 ${
                    n.is_read
                      ? 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 opacity-75'
                      : 'bg-brand-50/50 dark:bg-brand-950/30 border-brand-200/80 dark:border-brand-800/80 shadow-xs'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {!n.is_read && <span className="w-2 h-2 rounded-full bg-brand-500" />}
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{n.title}</h4>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
                    <p className="text-[10px] text-slate-400 pt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {n.link && (
                      <button
                        onClick={() => {
                          if (!n.is_read) onMarkNotificationRead(n.id);
                          setActiveTab(n.link!.replace('/', ''));
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                      >
                        View <ExternalLink className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteNotification(n.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preferences Side Panel */}
        <div className="glass-panel p-5 space-y-4 h-fit">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-4 h-4 text-brand-500" /> Notification Preferences
          </h3>

          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Email Notifications</span>
              <input
                type="checkbox"
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="rounded text-brand-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
              <span className="font-semibold text-slate-800 dark:text-slate-200">24h Interview Alerts</span>
              <input
                type="checkbox"
                checked={interviewAlerts}
                onChange={(e) => setInterviewAlerts(e.target.checked)}
                className="rounded text-brand-600"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
              <span className="font-semibold text-slate-800 dark:text-slate-200">Deadline Warnings</span>
              <input
                type="checkbox"
                checked={deadlineAlerts}
                onChange={(e) => setDeadlineAlerts(e.target.checked)}
                className="rounded text-brand-600"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
