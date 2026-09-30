import React, { useState, useEffect } from 'react';
import type { Interview, Application } from '../types';
import { api } from '../api/client';
import { Calendar as CalendarIcon, Clock, Plus, ExternalLink, Video } from 'lucide-react';
import { Modal } from '../components/common/Modal';

interface CalendarPageProps {
  onSelectApplicationById: (appId: number) => void;
  applications: Application[];
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ onSelectApplicationById, applications }) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Interview Form
  const [appId, setAppId] = useState<number>(applications[0]?.id || 0);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0] + 'T14:00');
  const [type, setType] = useState('Technical Video');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadInterviews = async () => {
    try {
      setLoading(true);
      const res = await api.getInterviews();
      setInterviews(res.interviews);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const handleCreateInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId || !date) return;

    try {
      setSubmitting(true);
      await api.createInterview({
        application_id: appId,
        interview_date: date,
        interview_type: type,
        meeting_url: meetingUrl,
        notes
      });
      setShowModal(false);
      setMeetingUrl('');
      setNotes('');
      loadInterviews();
    } catch (err) {
      console.error('Failed to schedule interview:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Combine interviews & deadlines for calendar feed
  const calendarEvents = [
    ...interviews.map((i) => ({
      id: `iv-${i.id}`,
      appId: i.application_id,
      title: `${i.interview_type} Interview`,
      subtitle: `${i.job_title} at ${i.company}`,
      date: i.interview_date,
      type: 'interview' as const,
      meetingUrl: i.meeting_url,
      notes: i.notes
    })),
    ...applications
      .filter((a) => a.deadline)
      .map((a) => ({
        id: `dl-${a.id}`,
        appId: a.id,
        title: `Deadline: ${a.job_title}`,
        subtitle: `${a.company}`,
        date: `${a.deadline}T23:59`,
        type: 'deadline' as const,
        meetingUrl: '',
        notes: `Application submission deadline for ${a.company}`
      }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Interviews & Deadlines Calendar <CalendarIcon className="w-5 h-5 text-purple-500" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Integrated calendar view for recruiter calls, technical rounds, deadlines, and assessments.
          </p>
        </div>

        <button
          onClick={() => {
            if (applications.length > 0 && !appId) setAppId(applications[0].id);
            setShowModal(true);
          }}
          className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Schedule Interview
        </button>
      </div>

      {/* Legend Indicators */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold glass-panel p-3.5">
        <span className="text-slate-500">Event Indicators:</span>
        <span className="flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Interviews
        </span>
        <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Application Deadlines
        </span>
        <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Recruiter Follow-ups
        </span>
      </div>

      {/* Events Timeline / Grid List */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading calendar events...</div>
      ) : calendarEvents.length === 0 ? (
        <div className="p-12 text-center glass-panel space-y-3">
          <CalendarIcon className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No events scheduled</h3>
          <p className="text-xs text-slate-500">Schedule an interview or add application deadlines to track on your calendar.</p>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl"
          >
            Schedule Interview
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {calendarEvents.map((evt) => {
            const isInterview = evt.type === 'interview';
            return (
              <div
                key={evt.id}
                className={`glass-card p-4 sm:p-5 border-l-4 ${
                  isInterview ? 'border-l-purple-500' : 'border-l-rose-500'
                } flex flex-col sm:flex-row sm:items-center justify-between gap-4`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                      isInterview ? 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}>
                      {evt.type}
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{evt.title}</h3>
                  </div>

                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">{evt.subtitle}</p>

                  <p className="text-xs text-slate-400 flex items-center gap-1.5 pt-1">
                    <Clock className="w-3.5 h-3.5" /> {new Date(evt.date).toLocaleString()}
                  </p>

                  {evt.notes && <p className="text-xs text-slate-500 italic">{evt.notes}</p>}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => onSelectApplicationById(evt.appId)}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl hover:bg-slate-200 transition-colors"
                  >
                    View Application
                  </button>

                  {evt.meetingUrl && (
                    <a
                      href={evt.meetingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1"
                    >
                      <Video className="w-3.5 h-3.5" /> Join <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Schedule Interview Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Schedule Interview Round"
        subtitle="Record technical screens, system design rounds, or HR calls."
      >
        <form onSubmit={handleCreateInterview} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Application</label>
            <select
              value={appId}
              onChange={(e) => setAppId(Number(e.target.value))}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none font-medium"
            >
              {applications.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.job_title} at {app.company}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Interview Date & Time</label>
              <input
                type="datetime-local"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Interview Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              >
                <option value="Recruiter Phone Screen">Recruiter Phone Screen</option>
                <option value="Technical Video">Technical Video</option>
                <option value="System Design">System Design</option>
                <option value="On-site">On-site Interview</option>
                <option value="Hiring Manager HR">Hiring Manager HR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Meeting Link / URL (Google Meet, Zoom, Teams)</label>
            <input
              type="url"
              placeholder="https://meet.google.com/abc-defg-hij"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Preparation Points / Notes</label>
            <textarea
              rows={3}
              placeholder="Review React Fiber architecture, state management patterns..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold bg-purple-600 text-white rounded-xl shadow-xs"
            >
              {submitting ? 'Scheduling...' : 'Save Interview'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
