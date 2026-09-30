import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import type { Application, Resume, CoverLetter, ApplicationStatus, JobType, JobSource } from '../../types';

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Application>) => Promise<void>;
  initialData?: Application | null;
  resumes: Resume[];
  coverLetters: CoverLetter[];
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  resumes,
  coverLetters
}) => {
  const [formData, setFormData] = useState<Partial<Application>>({
    job_title: '',
    company: '',
    company_website: '',
    job_description: '',
    location: '',
    job_type: 'Full-time',
    salary: '',
    application_date: new Date().toISOString().split('T')[0],
    deadline: '',
    source: 'LinkedIn',
    status: 'Saved',
    contact_person: '',
    contact_email: '',
    notes: '',
    resume_id: null,
    cover_letter_id: null
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        job_title: initialData.job_title || '',
        company: initialData.company || '',
        company_website: initialData.company_website || '',
        job_description: initialData.job_description || '',
        location: initialData.location || '',
        job_type: initialData.job_type || 'Full-time',
        salary: initialData.salary || '',
        application_date: initialData.application_date || new Date().toISOString().split('T')[0],
        deadline: initialData.deadline || '',
        source: initialData.source || 'LinkedIn',
        status: initialData.status || 'Saved',
        contact_person: initialData.contact_person || '',
        contact_email: initialData.contact_email || '',
        notes: initialData.notes || '',
        resume_id: initialData.resume_id || null,
        cover_letter_id: initialData.cover_letter_id || null
      });
    } else {
      setFormData({
        job_title: '',
        company: '',
        company_website: '',
        job_description: '',
        location: '',
        job_type: 'Full-time',
        salary: '',
        application_date: new Date().toISOString().split('T')[0],
        deadline: '',
        source: 'LinkedIn',
        status: 'Saved',
        contact_person: '',
        contact_email: '',
        notes: '',
        resume_id: resumes.find((r) => r.is_default)?.id || (resumes[0]?.id || null),
        cover_letter_id: coverLetters[0]?.id || null
      });
    }
    setError('');
  }, [initialData, isOpen, resumes, coverLetters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.job_title || !formData.company) {
      setError('Job title and company name are required!');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onSave(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statuses: ApplicationStatus[] = [
    'Saved', 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Offer', 'Rejected', 'Withdrawn'
  ];

  const jobTypes: JobType[] = ['Full-time', 'Part-time', 'Internship', 'Contract', 'Remote'];

  const sources: JobSource[] = ['LinkedIn', 'Indeed', 'Naukri', 'Company Website', 'Referral', 'Other'];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Application' : 'Add New Application'}
      subtitle="Track your job application details, company contacts, and associated documents."
      maxWidth="max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 text-xs font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        {/* Basic Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Senior React Engineer"
              value={formData.job_title}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Company Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Stripe"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as ApplicationStatus })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none font-medium"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Type</label>
            <select
              value={formData.job_type}
              onChange={(e) => setFormData({ ...formData, job_type: e.target.value as JobType })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            >
              {jobTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Source</label>
            <select
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value as JobSource })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            >
              {sources.map((src) => (
                <option key={src} value={src}>
                  {src}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location & Salary & Website */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Location</label>
            <input
              type="text"
              placeholder="e.g. San Francisco / Remote"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Salary Range</label>
            <input
              type="text"
              placeholder="e.g. $140,000 - $160,000"
              value={formData.salary}
              onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Company Website</label>
            <input
              type="url"
              placeholder="https://company.com"
              value={formData.company_website}
              onChange={(e) => setFormData({ ...formData, company_website: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Application Date</label>
            <input
              type="date"
              value={formData.application_date}
              onChange={(e) => setFormData({ ...formData, application_date: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Application Deadline</label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Contacts */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
            <input
              type="text"
              placeholder="e.g. Sarah Jenkins (Recruiter)"
              value={formData.contact_person}
              onChange={(e) => setFormData({ ...formData, contact_person: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
            <input
              type="email"
              placeholder="recruiter@company.com"
              value={formData.contact_email}
              onChange={(e) => setFormData({ ...formData, contact_email: e.target.value })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Associated Documents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Associated Resume</label>
            <select
              value={formData.resume_id || ''}
              onChange={(e) => setFormData({ ...formData, resume_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            >
              <option value="">-- Select Resume --</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.is_default ? '(Default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Associated Cover Letter</label>
            <select
              value={formData.cover_letter_id || ''}
              onChange={(e) => setFormData({ ...formData, cover_letter_id: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
            >
              <option value="">-- Select Cover Letter --</option>
              {coverLetters.map((cl) => (
                <option key={cl.id} value={cl.id}>
                  {cl.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Job Description & Notes */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Description</label>
          <textarea
            rows={3}
            placeholder="Paste job description highlights or key requirements..."
            value={formData.job_description}
            onChange={(e) => setFormData({ ...formData, job_description: e.target.value })}
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Personal Notes</label>
          <textarea
            rows={2}
            placeholder="Interviewer names, referral notes, preparation points..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold bg-gradient-to-r from-brand-600 to-blue-600 text-white rounded-xl shadow-sm hover:from-brand-500 hover:to-blue-500 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : initialData ? 'Update Application' : 'Save Application'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
