import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { User as UserIcon, Save, CheckCircle2, ShieldCheck } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [location, setLocation] = useState(user?.location || '');
  const [skills, setSkills] = useState(user?.skills || '');
  const [education, setEducation] = useState(user?.education || '');
  const [experience, setExperience] = useState(user?.experience || '');
  const [linkedinUrl, setLinkedinUrl] = useState(user?.linkedin_url || '');
  const [githubUrl, setGithubUrl] = useState(user?.github_url || '');
  const [portfolioUrl, setPortfolioUrl] = useState(user?.portfolio_url || '');
  const [preferredRole, setPreferredRole] = useState(user?.preferred_role || '');
  const [preferredLocation, setPreferredLocation] = useState(user?.preferred_location || '');
  const [expectedSalary, setExpectedSalary] = useState(user?.expected_salary || '');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSavedSuccess(false);

      const res = await api.updateProfile({
        name, phone, location, skills, education, experience,
        linkedin_url: linkedinUrl, github_url: githubUrl, portfolio_url: portfolioUrl,
        preferred_role: preferredRole, preferred_location: preferredLocation, expected_salary: expectedSalary
      });

      updateUser(res.user);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
          User Profile & Account <UserIcon className="w-5 h-5 text-brand-500" />
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal details, tech stack skills, experience history, and account credentials.
        </p>
      </div>

      {/* Account Type / Login Mode Slot */}
      <div className="glass-panel p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-brand-500/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 via-blue-500 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-md">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-900 dark:text-slate-100">{user?.name}</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
          </div>
        </div>

        <div>
          {user?.role === 'admin' ? (
            <span className="px-3.5 py-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 rounded-xl flex items-center gap-1.5 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-amber-500" /> Admin Login Mode
            </span>
          ) : (
            <span className="px-3.5 py-1.5 text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 rounded-xl flex items-center gap-1.5 shadow-xs">
              <UserIcon className="w-4 h-4 text-blue-500" /> Normal User Login Mode
            </span>
          )}
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Profile saved successfully! Your AI Cover Letter assistant and application templates are now updated.
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 text-rose-600 border border-rose-200 rounded-2xl text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Personal Details */}
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-slate-500">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Location / City</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Account Role / Mode</label>
              <input
                type="text"
                disabled
                value={user?.role === 'admin' ? 'Admin Login' : 'Normal User Login'}
                className="w-full px-3.5 py-2 text-sm bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-xl font-bold text-brand-600 dark:text-brand-400 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Skills & Experience */}
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-slate-500">
            Skills & Work Background
          </h2>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tech Stack & Key Skills (comma separated)
            </label>
            <input
              type="text"
              placeholder="React, TypeScript, Node.js, Express, Python, PostgreSQL"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Education</label>
            <input
              type="text"
              placeholder="B.Tech Computer Science"
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Work Experience Summary</label>
            <textarea
              rows={3}
              placeholder="Describe your work experience..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
            ></textarea>
          </div>
        </div>

        {/* Social Links & Job Search Preferences */}
        <div className="glass-panel p-6 space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-slate-500">
            Links & Job Search Target
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">LinkedIn URL</label>
              <input
                type="text"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GitHub URL</label>
              <input
                type="text"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Portfolio URL</label>
              <input
                type="text"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Job Role</label>
              <input
                type="text"
                placeholder="Senior Full Stack Engineer"
                value={preferredRole}
                onChange={(e) => setPreferredRole(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Location</label>
              <input
                type="text"
                placeholder="Bengaluru / Remote"
                value={preferredLocation}
                onChange={(e) => setPreferredLocation(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Expected Salary (₹ INR)</label>
              <input
                type="text"
                placeholder="₹25,00,000 - ₹35,00,000"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Profile Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};
