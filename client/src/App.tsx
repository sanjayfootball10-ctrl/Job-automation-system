import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ApplicationsPage } from './pages/ApplicationsPage';
import { KanbanPage } from './pages/KanbanPage';
import { JobSearchPage } from './pages/JobSearchPage';
import { ResumesPage } from './pages/ResumesPage';
import { CoverLettersPage } from './pages/CoverLettersPage';
import { CalendarPage } from './pages/CalendarPage';
import { AutomationsPage } from './pages/AutomationsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';

import { ApplicationModal } from './components/applications/ApplicationModal';
import { ApplicationDetailModal } from './components/applications/ApplicationDetailModal';
import type { Application, Resume, CoverLetter, AppNotification } from './types';
import { api } from './api/client';
import { Zap } from 'lucide-react';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();
  const { socket, isConnected } = useSocket();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [globalSearch, setGlobalSearch] = useState<string>('');

  // App Data state
  const [applications, setApplications] = useState<Application[]>([]);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // Real-time toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals state
  const [showAppModal, setShowAppModal] = useState<boolean>(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);

  const loadData = async () => {
    if (!user) return;
    try {
      const [appsRes, resumesRes, coversRes, notifsRes] = await Promise.all([
        api.getApplications(),
        api.getResumes(),
        api.getCoverLetters(),
        api.getNotifications()
      ]);
      setApplications(appsRes.applications);
      setResumes(resumesRes.resumes);
      setCoverLetters(coversRes.coverLetters);
      setNotifications(notifsRes.notifications);
      setUnreadCount(notifsRes.unreadCount);
    } catch (err) {
      console.error('Failed to load application data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Real-time WebSocket Listeners
  useEffect(() => {
    if (!socket) return;

    const showToast = (msg: string) => {
      setToastMessage(msg);
      setTimeout(() => setToastMessage(null), 4000);
    };

    socket.on('application_created', () => {
      showToast(`Real-Time Alert: New application added`);
      loadData();
    });

    socket.on('application_updated', () => {
      showToast(`Real-Time Alert: Application updated`);
      loadData();
    });

    socket.on('application_status_changed', (data) => {
      showToast(`Real-Time Alert: Application status moved to ${data.newStatus}`);
      loadData();
    });

    socket.on('application_deleted', () => {
      showToast(`Real-Time Alert: Application removed`);
      loadData();
    });

    socket.on('notifications_updated', (data) => {
      showToast(`Real-Time Automation Scan: New alerts generated!`);
      if (data.notifications) setNotifications(data.notifications);
      if (data.unreadCount !== undefined) setUnreadCount(data.unreadCount);
    });

    return () => {
      socket.off('application_created');
      socket.off('application_updated');
      socket.off('application_status_changed');
      socket.off('application_deleted');
      socket.off('notifications_updated');
    };
  }, [socket]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center font-bold text-sm">
        Loading Job Application Tracker...
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const handleSaveApplication = async (data: Partial<Application>) => {
    if (editingApp) {
      await api.updateApplication(editingApp.id, data);
    } else {
      await api.createApplication(data);
    }
    loadData();
  };

  const handleMarkNotificationRead = async (id: number) => {
    await api.markNotificationRead(id);
    loadData();
  };

  const handleMarkAllNotificationsRead = async () => {
    await api.markAllNotificationsRead();
    loadData();
  };

  const handleDeleteNotification = async (id: number) => {
    await api.deleteNotification(id);
    loadData();
  };

  const handleSelectApplicationById = async (appId: number) => {
    try {
      const res = await api.getApplicationDetails(appId);
      setSelectedApp(res.application);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 relative">
      {/* Real-time Connection Indicator & Toast Banner */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl border border-emerald-400 animate-bounce">
          <Zap className="w-5 h-5 text-yellow-300" />
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        unreadNotificationsCount={unreadCount}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <Header
          onOpenMobileMenu={() => setMobileOpen(true)}
          onQuickAddApplication={() => {
            setEditingApp(null);
            setShowAppModal(true);
          }}
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkNotificationRead={handleMarkNotificationRead}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          setActiveTab={setActiveTab}
          globalSearch={globalSearch}
          setGlobalSearch={(term) => {
            setGlobalSearch(term);
            if (term && activeTab !== 'applications') {
              setActiveTab('applications');
            }
          }}
        />

        {/* Realtime Live Engine Status Bar */}
        <div className="bg-slate-900 text-slate-300 px-6 py-2 text-xs flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="font-medium">
              {isConnected ? 'Real-Time WebSocket Engine Connected' : 'Connecting to Real-Time Engine...'}
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Automated Background Scan: Active</span>
            <span>Live Job Feed: Connected</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <DashboardPage
              onQuickAdd={() => {
                setEditingApp(null);
                setShowAppModal(true);
              }}
              setActiveTab={setActiveTab}
              onSelectApplication={(app) => setSelectedApp(app)}
            />
          )}

          {activeTab === 'applications' && (
            <ApplicationsPage
              onAddApplication={() => {
                setEditingApp(null);
                setShowAppModal(true);
              }}
              onEditApplication={(app) => {
                setEditingApp(app);
                setShowAppModal(true);
              }}
              onSelectApplication={(app) => setSelectedApp(app)}
              globalSearch={globalSearch}
            />
          )}

          {activeTab === 'kanban' && (
            <KanbanPage
              onSelectApplication={(app) => setSelectedApp(app)}
              onAddApplication={() => {
                setEditingApp(null);
                setShowAppModal(true);
              }}
            />
          )}

          {activeTab === 'jobs' && (
            <JobSearchPage
              onJobSavedToTracker={() => {
                loadData();
              }}
            />
          )}

          {activeTab === 'resumes' && <ResumesPage />}

          {activeTab === 'cover-letters' && <CoverLettersPage />}

          {activeTab === 'calendar' && (
            <CalendarPage
              applications={applications}
              onSelectApplicationById={handleSelectApplicationById}
            />
          )}

          {activeTab === 'automations' && <AutomationsPage />}

          {activeTab === 'analytics' && <AnalyticsPage />}

          {activeTab === 'notifications' && (
            <NotificationsPage
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkNotificationRead={handleMarkNotificationRead}
              onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
              onDeleteNotification={handleDeleteNotification}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'profile' && <ProfilePage />}

          {activeTab === 'admin' && <AdminPage />}
        </main>
      </div>

      {/* Global Add / Edit Application Modal */}
      <ApplicationModal
        isOpen={showAppModal}
        onClose={() => setShowAppModal(false)}
        onSave={handleSaveApplication}
        initialData={editingApp}
        resumes={resumes}
        coverLetters={coverLetters}
      />

      {/* Global Application Timeline Detail Modal */}
      <ApplicationDetailModal
        isOpen={!!selectedApp}
        onClose={() => setSelectedApp(null)}
        application={selectedApp}
        onScheduleInterview={() => {
          setSelectedApp(null);
          setActiveTab('calendar');
        }}
        onStatusChange={() => {
          loadData();
        }}
      />
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <MainApp />
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
