import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import type { Application, ApplicationHistory, Interview } from '../../types';
import { api } from '../../api/client';
import {
  MapPin, DollarSign, Calendar, Mail, User,
  FileText, Clock, ExternalLink, CheckCircle2, PlusCircle
} from 'lucide-react';

interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: Application | null;
  onScheduleInterview: (app: Application) => void;
  onStatusChange: (appId: number, newStatus: string) => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  isOpen,
  onClose,
  application,
  onScheduleInterview
}) => {
  const [history, setHistory] = useState<ApplicationHistory[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (application && isOpen) {
      setLoading(true);
      api
        .getApplicationDetails(application.id)
        .then((res) => {
          setHistory(res.history || []);
          setInterviews(res.interviews || []);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [application, isOpen]);

  if (!application) return null;

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={application.job_title}
      subtitle={`at ${application.company}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Header Summary Banner */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/80 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className={`status-badge text-sm py-1 px-3.5 font-bold ${getStatusBadgeClass(application.status)}`}>
              {application.status}
            </span>
            <span className="text-xs text-slate-500 font-medium px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              {application.job_type}
            </span>
            <span className="text-xs text-slate-500 font-medium px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
              Source: {application.source}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onScheduleInterview(application)}
              className="px-3.5 py-1.5 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" /> Schedule Interview
            </button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-brand-500 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Location</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{application.location || 'Not specified'}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
            <DollarSign className="w-5 h-5 text-emerald-500 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Salary Range</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{application.salary || 'Not specified'}</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex items-center gap-3">
            <Calendar className="w-5 h-5 text-indigo-500 shrink-0" />
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Applied Date</p>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{application.application_date || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Contacts & Documents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contact Person */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Recruiter / Contact
            </h4>
            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{application.contact_person || 'No contact specified'}</p>
            {application.contact_email && (
              <a
                href={`mailto:${application.contact_email}`}
                className="text-xs text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
              >
                <Mail className="w-3.5 h-3.5" /> {application.contact_email}
              </a>
            )}
          </div>

          {/* Documents Associated */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Associated Documents
            </h4>
            <div className="text-xs space-y-1">
              <p className="text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-500">Resume:</span> {application.resume_name || 'None attached'}
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                <span className="font-semibold text-slate-500">Cover Letter:</span> {application.cover_letter_title || 'None attached'}
              </p>
            </div>
          </div>
        </div>

        {/* Notes & Description */}
        {application.notes && (
          <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
            <h4 className="text-xs font-bold text-amber-800 dark:text-amber-300 mb-1">Personal Notes</h4>
            <p className="text-xs text-amber-900 dark:text-amber-200 whitespace-pre-line">{application.notes}</p>
          </div>
        )}

        {/* Scheduled Interviews Section */}
        {interviews.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-500" /> Scheduled Interviews ({interviews.length})
            </h3>
            <div className="space-y-2">
              {interviews.map((iv) => (
                <div key={iv.id} className="p-3 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/40 dark:bg-purple-950/30 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-purple-900 dark:text-purple-200">{iv.interview_type} Interview</span>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">{new Date(iv.interview_date).toLocaleString()}</p>
                    {iv.notes && <p className="text-slate-500 italic mt-1">{iv.notes}</p>}
                  </div>
                  {iv.meeting_url && (
                    <a
                      href={iv.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                    >
                      Join Meeting <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Application Timeline Audit History */}
        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-500" /> Application Timeline History
          </h3>

          {loading ? (
            <p className="text-xs text-slate-500">Loading timeline history...</p>
          ) : history.length === 0 ? (
            <p className="text-xs text-slate-500">No status changes recorded yet.</p>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
              {history.map((item, idx) => (
                <div key={item.id || idx} className="relative flex items-start gap-3 text-xs">
                  <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-brand-500 text-white flex items-center justify-center text-[10px] ring-4 ring-white dark:ring-slate-900">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      Status changed to <span className="text-brand-600 dark:text-brand-400 font-bold">{item.new_status}</span>
                      {item.old_status && <span className="text-slate-400 font-normal"> (from {item.old_status})</span>}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{new Date(item.changed_at).toLocaleString()}</p>
                    {item.notes && <p className="text-slate-600 dark:text-slate-300 mt-1 italic">{item.notes}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
