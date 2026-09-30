import React, { useEffect, useState } from 'react';
import type { Application, Interview, AnalyticsSummary } from '../types';
import { api } from '../api/client';
import {
  Briefcase, CheckCircle2, Clock, Calendar, Trophy, XCircle, AlertTriangle,
  ArrowUpRight, Sparkles, ExternalLink, PlusCircle
} from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area
} from 'recharts';

interface DashboardPageProps {
  onQuickAdd: () => void;
  setActiveTab: (tab: string) => void;
  onSelectApplication: (app: Application) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onQuickAdd,
  setActiveTab,
  onSelectApplication
}) => {
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const [analyticsRes, appsRes, interviewsRes] = await Promise.all([
          api.getAnalytics(),
          api.getApplications(),
          api.getInterviews()
        ]);
        setAnalytics(analyticsRes);
        setApplications(appsRes.applications);
        setInterviews(interviewsRes.interviews);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-8 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="h-28 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {
    total: 0, saved: 0, applied: 0, underReview: 0, shortlisted: 0, interview: 0, offer: 0, rejected: 0,
    responseRate: 0, interviewRate: 0, offerRate: 0, rejectionRate: 0, avgResponseDays: 0
  };

  // KPI Card Configs
  const kpiCards = [
    { title: 'Total Applications', count: summary.total, icon: Briefcase, color: 'from-blue-500 to-indigo-600', link: 'applications' },
    { title: 'Submitted', count: summary.applied, icon: CheckCircle2, color: 'from-sky-500 to-blue-600', link: 'applications' },
    { title: 'In Review', count: summary.underReview + summary.shortlisted, icon: Clock, color: 'from-amber-500 to-orange-600', link: 'applications' },
    { title: 'Interviews Scheduled', count: summary.interview, icon: Calendar, color: 'from-purple-500 to-indigo-600', link: 'calendar' },
    { title: 'Offers Received', count: summary.offer, icon: Trophy, color: 'from-emerald-500 to-teal-600', link: 'applications' },
    { title: 'Rejected Applications', count: summary.rejected, icon: XCircle, color: 'from-rose-500 to-red-600', link: 'applications' },
    { title: 'Upcoming Interviews', count: interviews.length, icon: Sparkles, color: 'from-fuchsia-500 to-pink-600', link: 'calendar' },
    { title: 'Upcoming Deadlines', count: applications.filter(a => a.deadline && a.status === 'Saved').length, icon: AlertTriangle, color: 'from-amber-600 to-red-500', link: 'applications' }
  ];

  const STATUS_COLORS: Record<string, string> = {
    Saved: '#94a3b8',
    Applied: '#3b82f6',
    'Under Review': '#f59e0b',
    Shortlisted: '#14b8a6',
    Interview: '#a855f7',
    Offer: '#10b981',
    Rejected: '#f43f5e',
    Withdrawn: '#64748b'
  };

  const statusPieData = (analytics?.statusBreakdown || []).filter(d => d.value > 0);
  const monthlyData = analytics?.monthlyData || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Job Search Control Center <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Real-time analytics, application status distribution, and upcoming milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onQuickAdd}
            className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-brand-500/20 flex items-center gap-2 active:scale-95 transition-all"
          >
            <PlusCircle className="w-4 h-4" /> Add Application
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => setActiveTab(card.link)}
              className="glass-card p-4 flex items-center justify-between cursor-pointer group hover:scale-[1.02]"
            >
              <div>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">{card.title}</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">{card.count}</h3>
              </div>
              <div className={`w-11 h-11 rounded-2xl bg-gradient-to-tr ${card.color} text-white flex items-center justify-center shadow-md shrink-0 group-hover:rotate-6 transition-transform`}>
                <Icon className="w-5.5 h-5.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Ratios & Metrics Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-100 dark:bg-brand-950/80 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-sm shrink-0">
            {summary.interviewRate}%
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Interview Rate</p>
            <p className="text-xs text-slate-400">Apps converting to interviews</p>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
            {summary.offerRate}%
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Offer Rate</p>
            <p className="text-xs text-slate-400">Successful offer conversions</p>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
            {summary.responseRate}%
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Response Rate</p>
            <p className="text-xs text-slate-400">Recruiter response frequency</p>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-sm shrink-0">
            ~6.5d
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Avg Response Time</p>
            <p className="text-xs text-slate-400">From application to feedback</p>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Applications by Status (Donut) */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Applications by Status</h3>
            <button onClick={() => setActiveTab('analytics')} className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline flex items-center gap-1">
              Details <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusPieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                >
                  {statusPieData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#64748b'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 text-[11px] justify-center">
            {statusPieData.map((item) => (
              <span key={item.name} className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] }} />
                {item.name} ({item.value})
              </span>
            ))}
          </div>
        </div>

        {/* Chart 2: Applications Over Time (Area Chart) */}
        <div className="glass-panel p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Applications Trajectory (Monthly)</h3>
            <span className="text-xs text-slate-400 font-medium">12-Month Window</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData.length > 0 ? monthlyData : [{ month: 'Current', count: summary.total }]}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0c8de9" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0c8de9" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="count" stroke="#0c8de9" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Widgets Grid: Upcoming Interviews & Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Interviews Widget */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" /> Scheduled Interviews ({interviews.length})
            </h3>
            <button onClick={() => setActiveTab('calendar')} className="text-xs text-purple-600 dark:text-purple-400 font-medium hover:underline flex items-center gap-1">
              View Calendar <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          {interviews.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              No upcoming interviews scheduled. Keep applying!
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.slice(0, 3).map((iv) => (
                <div key={iv.id} className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/20 text-xs flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{iv.job_title}</h4>
                    <p className="text-purple-700 dark:text-purple-300 font-semibold">{iv.company}</p>
                    <p className="text-slate-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {new Date(iv.interview_date).toLocaleString()}
                    </p>
                  </div>
                  {iv.meeting_url && (
                    <a
                      href={iv.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1 text-[11px]"
                    >
                      Join <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Recent Applications */}
        <div className="glass-panel p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-brand-500" /> Active Tracker Feed
            </h3>
            <button onClick={() => setActiveTab('applications')} className="text-xs text-brand-600 dark:text-brand-400 font-medium hover:underline">
              View All Applications
            </button>
          </div>

          <div className="space-y-2.5">
            {applications.slice(0, 4).map((app) => (
              <div
                key={app.id}
                onClick={() => onSelectApplication(app)}
                className="p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand-500 cursor-pointer transition-all flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100">{app.job_title}</h4>
                  <p className="text-slate-500 font-medium">{app.company} • {app.location}</p>
                </div>
                <span className={`status-badge ${app.status === 'Offer' ? 'status-offer' : app.status === 'Interview' ? 'status-interview' : app.status === 'Applied' ? 'status-applied' : 'status-saved'}`}>
                  {app.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
