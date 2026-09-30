import React, { useState, useEffect } from 'react';
import type { JobListing } from '../types';
import { api } from '../api/client';
import { Search, MapPin, ExternalLink, Bookmark, CheckCircle2, Filter, Plus, Radio, Globe, IndianRupee } from 'lucide-react';

interface JobSearchPageProps {
  onJobSavedToTracker: () => void;
}

const LOCATION_OPTIONS = [
  { value: 'all', label: 'All Locations' },
  { value: 'india', label: '🇮🇳 All India' },
  { value: 'bengaluru', label: '📍 Bengaluru / Bangalore' },
  { value: 'hyderabad', label: '📍 Hyderabad' },
  { value: 'mumbai', label: '📍 Mumbai' },
  { value: 'delhi', label: '📍 Delhi NCR / Gurgaon / Noida' },
  { value: 'pune', label: '📍 Pune' },
  { value: 'chennai', label: '📍 Chennai' },
  { value: 'remote india', label: '🌐 Remote (India)' },
  { value: 'remote', label: '🌐 Remote (Worldwide)' },
  { value: 'us', label: '🇺🇸 United States' },
  { value: 'europe', label: '🇪🇺 Europe' }
];

export const JobSearchPage: React.FC<JobSearchPageProps> = ({ onJobSavedToTracker }) => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [location, setLocation] = useState('all');
  const [customLocationText, setCustomLocationText] = useState('');
  const [jobType, setJobType] = useState('all');
  const [experience, setExperience] = useState('all');

  const [savedJobIds, setSavedJobIds] = useState<number[]>([]);
  const [savingId, setSavingId] = useState<number | null>(null);

  // Add Custom Job Modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customJob, setCustomJob] = useState({
    title: '',
    company: '',
    location: 'Bengaluru, India',
    job_type: 'Full-time',
    description: '',
    salary: '₹18,00,000 - ₹28,00,000 / yr',
    external_url: '',
    skills: ''
  });

  const loadJobs = async () => {
    try {
      setLoading(true);
      const activeLoc = location !== 'all' ? location : customLocationText;
      const res = await api.getJobs({
        search,
        location: activeLoc,
        job_type: jobType,
        experience
      });
      setJobs(res.jobs);
    } catch (err) {
      console.error('Failed to load jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, [search, location, customLocationText, jobType, experience]);

  const handleSaveJob = async (job: JobListing, targetStatus: 'Saved' | 'Applied') => {
    try {
      setSavingId(job.id);
      await api.saveJobAsApplication(job.id, targetStatus, job);
      setSavedJobIds((prev) => [...prev, job.id]);
      onJobSavedToTracker();
    } catch (err: any) {
      alert(err.message || 'Job already saved');
    } finally {
      setSavingId(null);
    }
  };

  const handleAddCustomJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customJob.title || !customJob.company) return;
    try {
      await api.createCustomJob(customJob);
      setShowCustomModal(false);
      setCustomJob({
        title: '',
        company: '',
        location: 'Bengaluru, India',
        job_type: 'Full-time',
        description: '',
        salary: '₹18,00,000 - ₹28,00,000 / yr',
        external_url: '',
        skills: ''
      });
      loadJobs();
    } catch (err: any) {
      alert(err.message || 'Failed to add custom job');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Real-Time Job Search <Search className="w-5 h-5 text-brand-500" />
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-full flex items-center gap-1">
              <Radio className="w-3 h-3 animate-ping text-emerald-500" /> Live Feed (India & Global)
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Filter live tech openings by Indian tech hubs or global locations with salaries in Rupees (₹ INR).
          </p>
        </div>

        <button
          onClick={() => setShowCustomModal(true)}
          className="px-4 py-2 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Custom Job Posting
        </button>
      </div>

      {/* Search & Location Filter Bar */}
      <div className="glass-panel p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Keyword Search */}
          <div className="relative md:col-span-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Job title, skills (React, Node, Java)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-brand-500 focus:outline-none"
            />
          </div>

          {/* Location Dropdown */}
          <div className="relative md:col-span-1">
            <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-500" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-slate-200 dark:border-slate-700 font-semibold focus:border-brand-500 focus:outline-none"
            >
              {LOCATION_OPTIONS.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom City Search */}
          <div className="relative md:col-span-1">
            <Globe className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Or type custom city name..."
              value={customLocationText}
              onChange={(e) => {
                setCustomLocationText(e.target.value);
                if (e.target.value) setLocation('all');
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-xl border border-transparent focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Secondary Filter Tags */}
        <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
          <div className="flex items-center gap-1.5 text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5" /> Filters:
          </div>

          <select
            value={jobType}
            onChange={(e) => setJobType(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Job Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Remote">Remote</option>
            <option value="Internship">Internship</option>
          </select>

          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Experience Levels</option>
            <option value="Senior">Senior</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Staff">Staff</option>
            <option value="Entry / Intern">Entry / Intern</option>
          </select>
        </div>
      </div>

      {/* Job Cards Feed */}
      {loading ? (
        <div className="p-12 text-center glass-panel space-y-3">
          <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs text-slate-400">Fetching live openings in your selected location...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 text-center glass-panel space-y-2">
          <Search className="w-8 h-8 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No openings found in this location</h3>
          <p className="text-xs text-slate-500">Try switching location to "All India" or clearing search keywords.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {jobs.map((j) => {
            const isSaved = savedJobIds.includes(j.id);
            return (
              <div key={j.id} className="glass-card p-5 space-y-4 flex flex-col justify-between hover:border-brand-500/50 transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 dark:text-slate-100 leading-snug">{j.title}</h3>
                      <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 mt-0.5">{j.company}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">
                        {j.job_type}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{j.source}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {j.description}
                  </p>

                  <div className="flex flex-wrap gap-3 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                      <MapPin className="w-3.5 h-3.5 text-brand-500" /> {j.location}
                    </span>
                    <span className="flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-500" /> {j.salary}
                    </span>
                  </div>

                  {j.skills && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {j.skills.split(',').map((sk, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-[10px] font-medium bg-brand-50 text-brand-700 dark:bg-brand-950/60 dark:text-brand-300 rounded-md border border-brand-200/50 dark:border-brand-800/50"
                        >
                          {sk.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {j.external_url ? (
                    <a
                      href={j.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" /> Official Posting <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-400">Posted {j.posted_date}</span>
                  )}

                  <div className="flex items-center gap-2">
                    {isSaved ? (
                      <span className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 rounded-xl flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Tracked
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSaveJob(j, 'Saved')}
                          disabled={savingId === j.id}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl flex items-center gap-1 transition-colors"
                        >
                          <Bookmark className="w-3.5 h-3.5" /> Save
                        </button>
                        <button
                          onClick={() => handleSaveJob(j, 'Applied')}
                          disabled={savingId === j.id}
                          className="px-3.5 py-1.5 text-xs font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-xs flex items-center gap-1 transition-colors"
                        >
                          Apply & Track
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Custom Job Posting */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-lg p-6 space-y-4 border border-slate-700 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Add Custom Job Posting</h2>
            <form onSubmit={handleAddCustomJob} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Senior React Developer"
                  value={customJob.title}
                  onChange={(e) => setCustomJob({ ...customJob, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Razorpay / Swiggy / Zoho"
                    value={customJob.company}
                    onChange={(e) => setCustomJob({ ...customJob, company: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g. Bengaluru, India"
                    value={customJob.location}
                    onChange={(e) => setCustomJob({ ...customJob, location: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Official Career Page URL</label>
                <input
                  type="url"
                  placeholder="https://careers.company.com/job/123"
                  value={customJob.external_url}
                  onChange={(e) => setCustomJob({ ...customJob, external_url: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Description & Requirements</label>
                <textarea
                  rows={3}
                  placeholder="Paste job description..."
                  value={customJob.description}
                  onChange={(e) => setCustomJob({ ...customJob, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                ></textarea>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Salary Range (in Rupees ₹)</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹18,00,000 - ₹28,00,000 / yr"
                    value={customJob.salary}
                    onChange={(e) => setCustomJob({ ...customJob, salary: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Skills (comma separated)</label>
                  <input
                    type="text"
                    placeholder="React, Node.js, TypeScript"
                    value={customJob.skills}
                    onChange={(e) => setCustomJob({ ...customJob, skills: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md"
                >
                  Save Job Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
