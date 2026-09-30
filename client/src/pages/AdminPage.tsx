import React, { useEffect, useState } from 'react';
import type { AdminDashboardData } from '../types';
import { api } from '../api/client';
import { ShieldCheck, Users, Briefcase, Calendar, FileText, Lock, Activity, RefreshCw } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      setLoading(true);
      const res = await api.getAdminDashboard();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-xs text-slate-500">Loading admin portal metrics...</div>;
  }

  const metrics = data?.metrics || { totalUsers: 0, activeUsers: 0, totalApplications: 0, totalInterviews: 0, totalResumes: 0 };
  const users = data?.users || [];
  const logs = data?.logs || [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            System Admin Portal <ShieldCheck className="w-5 h-5 text-amber-500" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            System telemetry, user registry, and activity audit logs.
          </p>
        </div>

        <button
          onClick={loadAdminData}
          className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl hover:bg-slate-200 flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Telemetry
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Registered Users</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{metrics.totalUsers}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Applications</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{metrics.totalApplications}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Scheduled Interviews</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{metrics.totalInterviews}</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Resumes</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{metrics.totalResumes}</h3>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee Notice */}
      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 flex items-center gap-3">
        <Lock className="w-5 h-5 text-amber-600 shrink-0" />
        <span>
          <strong>User Privacy Protection Enabled:</strong> Admins view aggregate system health and user directory, but private application details, resume contents, and cover letters are isolated and inaccessible without explicit user authorization.
        </span>
      </div>

      {/* Registered Users Table */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-500" /> User Directory
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase font-bold text-[10px]">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3 text-slate-400">#{u.id}</td>
                  <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">{u.name}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-500">{u.location || 'N/A'}</td>
                  <td className="px-4 py-3 text-slate-400">{u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="glass-panel p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500" /> Activity & Audit Trail
        </h3>

        <div className="space-y-2 max-h-72 overflow-y-auto">
          {logs.map((log) => (
            <div key={log.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs flex justify-between items-center">
              <div>
                <span className="font-bold text-brand-600 dark:text-brand-400 uppercase text-[10px] mr-2">[{log.action}]</span>
                <span className="text-slate-800 dark:text-slate-200 font-medium">{log.details}</span>
                <p className="text-[10px] text-slate-400 mt-0.5">User: {log.user_name || log.user_email || 'System'}</p>
              </div>
              <span className="text-[10px] text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
