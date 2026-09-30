import React, { useState, useEffect } from 'react';
import type { Resume } from '../types';
import { api } from '../api/client';
import { FileText, Upload, CheckCircle2, Star, Trash2, Eye } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const ResumesPage: React.FC = () => {
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Preview Modal State
  const [selectedResume, setSelectedResume] = useState<Resume | null>(null);

  const loadResumes = async () => {
    try {
      setLoading(true);
      const res = await api.getResumes();
      setResumes(res.resumes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadResumes();
  }, []);

  const handleSetDefault = async (id: number) => {
    try {
      await api.setDefaultResume(id);
      loadResumes();
    } catch (err) {
      console.error('Failed to set default resume:', err);
    }
  };

  const handleDelete = async (id: number, rName: string) => {
    if (!window.confirm(`Delete resume "${rName}"?`)) return;
    try {
      await api.deleteResume(id);
      loadResumes();
    } catch (err) {
      console.error('Failed to delete resume:', err);
    }
  };

  const handleCreateResume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      setSubmitting(true);
      await api.uploadResume({
        name: name.endsWith('.pdf') ? name : `${name}.pdf`,
        content: content || 'Standard software engineering experience resume text',
        is_default: isDefault
      });
      setShowUploadModal(false);
      setName('');
      setContent('');
      setIsDefault(false);
      loadResumes();
    } catch (err) {
      console.error('Failed to create resume:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Resume Vault & Management <FileText className="w-5 h-5 text-brand-500" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Store multiple tailored resumes (Software Developer, Data Analyst, Web Engineer) and assign default versions.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Upload className="w-4 h-4" /> Upload / Add Resume
        </button>
      </div>

      {/* Resume Cards Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading resume vault...</div>
      ) : resumes.length === 0 ? (
        <div className="p-12 text-center glass-panel space-y-3">
          <FileText className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No resumes uploaded</h3>
          <p className="text-xs text-slate-500">Upload your tailored resumes to attach to job applications.</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl"
          >
            Upload Resume
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {resumes.map((r) => (
            <div
              key={r.id}
              className={`glass-card p-5 space-y-4 flex flex-col justify-between relative overflow-hidden ${
                r.is_default ? 'ring-2 ring-brand-500/80 border-brand-500/40' : ''
              }`}
            >
              {r.is_default === 1 && (
                <div className="absolute top-0 right-0 bg-brand-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-xl flex items-center gap-1 shadow-xs">
                  <Star className="w-3 h-3 fill-white" /> Default Resume
                </div>
              )}

              <div className="space-y-2 pt-1">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold">
                  <FileText className="w-5 h-5 text-brand-500" />
                </div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-1">{r.name}</h3>
                <p className="text-[11px] text-slate-400">Added: {new Date(r.created_at).toLocaleDateString()}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 italic bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg border border-slate-200/50 dark:border-slate-700/50">
                  "{r.content || 'Master Software Engineering Resume'}"
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                {r.is_default ? (
                  <span className="text-[11px] font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Primary Default
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(r.id)}
                    className="text-[11px] text-slate-500 hover:text-brand-600 font-semibold hover:underline"
                  >
                    Set as Default
                  </button>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedResume(r)}
                    title="Preview Content"
                    className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id, r.name)}
                    title="Delete Resume"
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload/Add Resume Modal */}
      <Modal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        title="Add Resume to Vault"
        subtitle="Create or upload a new resume version for specific job roles."
      >
        <form onSubmit={handleCreateResume} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Resume Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Data_Analyst_Master_Resume.pdf"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Resume Content / Highlights Summary</label>
            <textarea
              rows={4}
              placeholder="Paste main skills, project highlights, or resume text content..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
              className="rounded text-brand-600"
            />
            Set as default primary resume for new applications
          </label>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowUploadModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-xs"
            >
              {submitting ? 'Saving...' : 'Add Resume'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Preview Modal */}
      <Modal
        isOpen={!!selectedResume}
        onClose={() => setSelectedResume(null)}
        title={selectedResume?.name || 'Resume Preview'}
        subtitle="Saved resume document content"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
            {selectedResume?.content || 'No text preview available.'}
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setSelectedResume(null)}
              className="px-4 py-2 text-xs font-semibold bg-slate-200 dark:bg-slate-800 rounded-xl"
            >
              Close Preview
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
