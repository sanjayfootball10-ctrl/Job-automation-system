import React, { useState } from 'react';
import {
  Menu, Sun, Moon, Bell, Plus, Search, CheckCheck,
  ExternalLink, User, Settings, LogOut, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import type { AppNotification } from '../../types';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onQuickAddApplication: () => void;
  notifications: AppNotification[];
  unreadCount: number;
  onMarkNotificationRead: (id: number) => void;
  onMarkAllNotificationsRead: () => void;
  setActiveTab: (tab: string) => void;
  globalSearch: string;
  setGlobalSearch: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  onQuickAddApplication,
  notifications,
  unreadCount,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  setActiveTab,
  globalSearch,
  setGlobalSearch
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 px-4 lg:px-8 py-3 flex items-center justify-between gap-4">
      {/* Mobile Toggle & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <div className="relative w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search applications, companies, jobs, or keywords..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder-slate-400 rounded-xl border border-transparent focus:border-brand-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
          />
          {globalSearch && (
            <button
              onClick={() => setGlobalSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Quick Add Button */}
        <button
          onClick={onQuickAddApplication}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-medium text-xs sm:text-sm shadow-sm shadow-brand-500/20 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span className="hidden sm:inline">Add Application</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
        </button>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden">
              <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">Notifications</h3>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold bg-brand-100 text-brand-700 dark:bg-brand-900/80 dark:text-brand-300 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllNotificationsRead}
                    className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                    No notifications yet!
                  </div>
                ) : (
                  notifications.slice(0, 6).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.is_read) onMarkNotificationRead(notif.id);
                        if (notif.link) {
                          setActiveTab(notif.link.replace('/', ''));
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3.5 text-xs cursor-pointer transition-colors ${
                        notif.is_read
                          ? 'opacity-70 bg-white dark:bg-slate-900'
                          : 'bg-brand-50/40 dark:bg-brand-950/30 hover:bg-brand-50/80'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{notif.title}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 line-clamp-2">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-center">
                <button
                  onClick={() => {
                    setActiveTab('notifications');
                    setShowNotifications(false);
                  }}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                >
                  View Notification Center <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-brand-500/20">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 p-1.5 space-y-0.5">
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">{user?.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                <div className="mt-1.5">
                  {user?.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-800/60 px-2.5 py-0.5 rounded-full">
                      <ShieldCheck className="w-3 h-3" /> Admin Login
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-800/60 px-2.5 py-0.5 rounded-full">
                      <User className="w-3 h-3" /> Normal User Login
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  setActiveTab('profile');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <User className="w-4 h-4 text-slate-400" /> View Profile
              </button>

              <button
                onClick={() => {
                  setActiveTab('automations');
                  setShowUserMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" /> Automation Rules
              </button>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-1 mt-1">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
