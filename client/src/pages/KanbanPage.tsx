import React, { useState, useEffect } from 'react';
import type { Application, ApplicationStatus } from '../types';
import { api } from '../api/client';
import { LayoutGrid, MapPin, DollarSign, Eye, Plus } from 'lucide-react';

interface KanbanPageProps {
  onSelectApplication: (app: Application) => void;
  onAddApplication: () => void;
}

const COLUMNS: { id: ApplicationStatus; title: string; color: string; bg: string }[] = [
  { id: 'Saved', title: 'Saved Jobs', color: 'border-slate-400 text-slate-700 dark:text-slate-300', bg: 'bg-slate-100/50 dark:bg-slate-900/50' },
  { id: 'Applied', title: 'Applied', color: 'border-blue-500 text-blue-600 dark:text-blue-400', bg: 'bg-blue-50/40 dark:bg-blue-950/20' },
  { id: 'Under Review', title: 'Under Review', color: 'border-amber-500 text-amber-600 dark:text-amber-400', bg: 'bg-amber-50/40 dark:bg-amber-950/20' },
  { id: 'Shortlisted', title: 'Shortlisted', color: 'border-teal-500 text-teal-600 dark:text-teal-400', bg: 'bg-teal-50/40 dark:bg-teal-950/20' },
  { id: 'Interview', title: 'Interview', color: 'border-purple-500 text-purple-600 dark:text-purple-400', bg: 'bg-purple-50/40 dark:bg-purple-950/20' },
  { id: 'Offer', title: 'Offer Received', color: 'border-emerald-500 text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50/40 dark:bg-emerald-950/20' },
  { id: 'Rejected', title: 'Rejected', color: 'border-rose-500 text-rose-600 dark:text-rose-400', bg: 'bg-rose-50/40 dark:bg-rose-950/20' }
];

export const KanbanPage: React.FC<KanbanPageProps> = ({ onSelectApplication, onAddApplication }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [draggedAppId, setDraggedAppId] = useState<number | null>(null);

  const loadApplications = async () => {
    try {
      const res = await api.getApplications();
      setApplications(res.applications);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleDragStart = (e: React.DragEvent, appId: number) => {
    setDraggedAppId(appId);
    e.dataTransfer.setData('text/plain', appId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: ApplicationStatus) => {
    e.preventDefault();
    const idStr = e.dataTransfer.getData('text/plain') || draggedAppId?.toString();
    if (!idStr) return;
    const appId = parseInt(idStr, 10);

    const app = applications.find((a) => a.id === appId);
    if (!app || app.status === targetStatus) return;

    // Optimistic UI Update
    setApplications((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status: targetStatus } : a))
    );

    try {
      await api.updateApplicationStatus(appId, targetStatus);
    } catch (err) {
      console.error('Failed to update status on drop:', err);
      loadApplications();
    } finally {
      setDraggedAppId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Kanban Application Pipeline <LayoutGrid className="w-5 h-5 text-brand-500" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Drag and drop applications between columns to automatically update application status and timeline audit.
          </p>
        </div>

        <button
          onClick={onAddApplication}
          className="px-4 py-2 bg-gradient-to-r from-brand-600 to-blue-600 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Application
        </button>
      </div>

      {/* Kanban Board Horizontal Scroll Container */}
      <div className="overflow-x-auto pb-6">
        <div className="flex gap-4 min-w-[1400px]">
          {COLUMNS.map((col) => {
            const colApps = applications.filter((a) => a.status === col.id);
            return (
              <div
                key={col.id}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.id)}
                className={`w-72 rounded-2xl border ${col.color} border-opacity-30 ${col.bg} p-3 flex flex-col max-h-[75vh] shrink-0 transition-colors`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full border-2 ${col.color}`} />
                    <h3 className="font-bold text-xs text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      {col.title}
                    </h3>
                  </div>
                  <span className="px-2 py-0.5 text-xs font-bold bg-white dark:bg-slate-900 rounded-full border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
                    {colApps.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                  {colApps.length === 0 ? (
                    <div className="p-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800/60 rounded-xl text-slate-400 text-xs font-medium">
                      Drag jobs here
                    </div>
                  ) : (
                    colApps.map((app) => (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, app.id)}
                        className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-2 group"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100 leading-snug group-hover:text-brand-600 dark:group-hover:text-brand-400">
                            {app.job_title}
                          </h4>
                          <button
                            onClick={() => onSelectApplication(app)}
                            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">{app.company}</p>

                        <div className="text-[11px] text-slate-500 space-y-1">
                          {app.location && (
                            <p className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400" /> {app.location}
                            </p>
                          )}
                          {app.salary && (
                            <p className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                              <DollarSign className="w-3 h-3" /> {app.salary}
                            </p>
                          )}
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                          <span>{app.source}</span>
                          <span>{app.application_date || 'No date'}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
