import React, { useState, useEffect } from 'react';
import type { Application, ApplicationStatus } from '../types';
import { api } from '../api/client';
import {
  Briefcase, Search, Plus, LayoutGrid, Table, Edit3, Trash2,
  ExternalLink, Eye, MapPin, DollarSign, Calendar
} from 'lucide-react';

interface ApplicationsPageProps {
  onAddApplication: () => void;
  onEditApplication: (app: Application) => void;
  onSelectApplication: (app: Application) => void;
  globalSearch: string;
}

export const ApplicationsPage: React.FC<ApplicationsPageProps> = ({
  onAddApplication,
  onEditApplication,
  onSelectApplication,
  globalSearch
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Filters state
  const [search, setSearch] = useState(globalSearch || '');
  const [statusFilter, setStatusFilter] = useState('all');
  const [jobTypeFilter, setJobTypeFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    setSearch(globalSearch);
  }, [globalSearch]);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const res = await api.getApplications({
        search,
        status: statusFilter,
        job_type: jobTypeFilter,
        source: sourceFilter,
        sort
      });
      setApplications(res.applications);
    } catch (err) {
      console.error('Failed to load applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [search, statusFilter, jobTypeFilter, sourceFilter, sort]);

  const handleStatusUpdate = async (appId: number, newStatus: string) => {
    try {
      await api.updateApplicationStatus(appId, newStatus);
      loadApplications();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  const handleDelete = async (appId: number, title: string) => {
    if (!window.confirm(`Are you sure you want to delete the application for "${title}"?`)) return;
    try {
      await api.deleteApplication(appId);
      loadApplications();
    } catch (err) {
      console.error('Failed to delete application:', err);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Saved': return 'status-saved';
      case 'Applied': return 'status-applied';
      case 'Under Review': return 'status-review';
      case 'Shortlisted': return 'status-shortlisted';
      case 'Interview': return 'status-interview';
      case 'Offer': return 'status-offer';
      case 'Rejected': return 'status-rejected';
      case 'Withdrawn': return 'status-withdrawn';
      default: return 'status-saved';
    }
  };

  const statuses: ApplicationStatus[] = [
    'Saved', 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Offer', 'Rejected', 'Withdrawn'
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Job Applications Tracker <Briefcase className="w-5 h-5 text-brand-500" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage, filter, update, and search all your active job applications in one place.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-200/60 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Table className="w-4 h-4" /> Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Grid
            </button>
          </div>

          <button
            onClick={onAddApplication}
            className="px-4 py-2 bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> Add Application
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="glass-panel p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by job title, company, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs bg-transparent border-none focus:outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Job Type Filter */}
          <select
            value={jobTypeFilter}
            onChange={(e) => setJobTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
            <option value="Remote">Remote</option>
          </select>

          {/* Source Filter */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Sources</option>
            <option value="LinkedIn">LinkedIn</option>
            <option value="Indeed">Indeed</option>
            <option value="Naukri">Naukri</option>
            <option value="Company Website">Company Website</option>
            <option value="Referral">Referral</option>
          </select>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="company">Company Name</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="p-12 text-center glass-panel space-y-3">
          <Briefcase className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No applications found</h3>
          <p className="text-xs text-slate-500">Try adjusting your filters or click below to track your first job.</p>
          <button
            onClick={onAddApplication}
            className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl shadow-xs"
          >
            Add New Application
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-800/70 uppercase text-[11px] tracking-wider text-slate-500 font-bold border-b border-slate-200/80 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Company & Job Title</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Type & Location</th>
                  <th className="px-4 py-3.5">Salary</th>
                  <th className="px-4 py-3.5">Applied Date</th>
                  <th className="px-4 py-3.5">Source</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">{app.job_title}</div>
                      <div className="text-slate-500 flex items-center gap-1 mt-0.5">
                        {app.company}
                        {app.company_website && (
                          <a href={app.company_website} target="_blank" rel="noreferrer" className="text-brand-500 hover:underline">
                            <ExternalLink className="w-3 h-3 inline" />
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                        className={`status-badge cursor-pointer ${getStatusBadgeClass(app.status)} focus:outline-none`}
                      >
                        {statuses.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                      <div>{app.job_type}</div>
                      <div className="text-slate-400 text-[11px]">{app.location || 'Remote/N/A'}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-semibold">
                      {app.salary || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      {app.application_date || '—'}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400">
                      {app.source}
                    </td>
                    <td className="px-4 py-3.5 text-right space-x-1">
                      <button
                        onClick={() => onSelectApplication(app)}
                        title="View Details & Timeline"
                        className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEditApplication(app)}
                        title="Edit Application"
                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(app.id, app.job_title)}
                        title="Delete Application"
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {applications.map((app) => (
            <div key={app.id} className="glass-card p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base leading-snug">{app.job_title}</h3>
                    <p className="text-xs font-semibold text-brand-600 dark:text-brand-400">{app.company}</p>
                  </div>
                  <span className={`status-badge ${getStatusBadgeClass(app.status)}`}>
                    {app.status}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {app.location || 'N/A'} • {app.job_type}
                  </p>
                  {app.salary && (
                    <p className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> {app.salary}
                    </p>
                  )}
                  {app.application_date && (
                    <p className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 shrink-0" /> Applied: {app.application_date}
                    </p>
                  )}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">Source: {app.source}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onSelectApplication(app)}
                    className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onEditApplication(app)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(app.id, app.job_title)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
