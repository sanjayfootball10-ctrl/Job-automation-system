import React from 'react';
import {
  LayoutDashboard, Briefcase, Search, LayoutGrid, FileText, Mail,
  Calendar as CalendarIcon, Cpu, BarChart3, Bell, User as UserIcon, ShieldAlert,
  ChevronRight, LogOut, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unreadNotificationsCount?: number;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  unreadNotificationsCount = 0,
  mobileOpen = false,
  setMobileOpen
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'applications', label: 'Applications', icon: Briefcase },
    { id: 'kanban', label: 'Kanban Board', icon: LayoutGrid },
    { id: 'jobs', label: 'Job Search', icon: Search },
    { id: 'resumes', label: 'Resumes', icon: FileText },
    { id: 'cover-letters', label: 'Cover Letters', icon: Mail },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'automations', label: 'Automations', icon: Cpu, badge: 'Smart' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'notifications', label: 'Notifications', icon: Bell, count: unreadNotificationsCount },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  if (user?.role === 'admin') {
    navItems.push({ id: 'admin', label: 'Admin Portal', icon: ShieldAlert, badge: 'Admin' });
  }

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Logo Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Briefcase className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="font-bold text-slate-900 dark:text-white text-base tracking-tight flex items-center gap-1.5">
                JobTracker <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Application Automation</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4.5 h-4.5 transition-colors ${
                      isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] uppercase tracking-wider font-bold rounded bg-brand-100 text-brand-700 dark:bg-brand-900/80 dark:text-brand-300">
                      {item.badge}
                    </span>
                  )}
                  {item.count !== undefined && item.count > 0 && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500 text-white animate-pulse">
                      {item.count}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-brand-500 opacity-80" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* User Footer Profile & Logout */}
        <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 shadow-xs">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.name}</p>
                <p className="text-[10px] font-bold text-brand-600 dark:text-brand-400 truncate">
                  {user?.role === 'admin' ? '🛡️ Admin Login' : '👤 Normal User Login'}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
