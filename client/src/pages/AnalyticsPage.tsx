import React, { useEffect, useState } from 'react';
import type { AnalyticsSummary } from '../types';
import { api } from '../api/client';
import { BarChart3, Target, Percent, Clock, Award, MapPin } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area
} from 'recharts';

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return <div className="p-8 text-center text-xs text-slate-500">Computing analytics metrics...</div>;
  }

  const { summary, monthlyData, sourceData, companyData, locationData } = data;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          Job Search Analytics & Conversion Rates <BarChart3 className="w-5 h-5 text-brand-500" />
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Deep telemetry on application response rates, funnel conversion ratios, common sources, and trajectory.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Response Rate</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{summary.responseRate}%</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Interview Rate</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{summary.interviewRate}%</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Offer Rate</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{summary.offerRate}%</h3>
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Avg Response Time</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">~6.5 Days</h3>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Breakdown Bar Chart */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Applications by Source Channel</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#0c8de9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Companies Bar Chart */}
        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Target Companies Volume</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="company" type="category" tick={{ fontSize: 11 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#a855f7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Timeline & Location Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-5 space-y-4 lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">Monthly Application Pace</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fill="#10b981" fillOpacity={0.2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-brand-500" /> Geographic Breakdown
          </h3>
          <div className="space-y-3 pt-2">
            {locationData.map((loc, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                <span className="font-semibold text-slate-800 dark:text-slate-200">{loc.location || 'Remote'}</span>
                <span className="font-bold text-brand-600 dark:text-brand-400">
                  {loc.count} {loc.count === 1 ? 'app' : 'apps'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
