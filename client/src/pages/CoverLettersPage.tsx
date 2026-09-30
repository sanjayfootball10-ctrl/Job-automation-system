import React, { useState, useEffect } from 'react';
import type { CoverLetter } from '../types';
import { api } from '../api/client';
import { Mail, Plus, Edit3, Trash2, Sparkles, Copy, Check } from 'lucide-react';
import { Modal } from '../components/common/Modal';

export const CoverLettersPage: React.FC = () => {
  const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([]);
  const [loading, setLoading] = useState(true);

  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // AI Generator Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiJobTitle, setAiJobTitle] = useState('');
  const [aiCompany, setAiCompany] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [aiTone, setAiTone] = useState('professional');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const loadCoverLetters = async () => {
    try {
      setLoading(true);
      const res = await api.getCoverLetters();
      setCoverLetters(res.coverLetters);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoverLetters();
  }, []);

  const handleOpenEditor = (cl?: CoverLetter) => {
    if (cl) {
      setEditingId(cl.id);
      setTitle(cl.title);
      setContent(cl.content);
    } else {
      setEditingId(null);
      setTitle('');
      setContent('');
    }
    setShowEditorModal(true);
  };

  const handleSaveEditor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    try {
      if (editingId) {
        await api.updateCoverLetter(editingId, { title, content });
      } else {
        await api.createCoverLetter({ title, content });
      }
      setShowEditorModal(false);
      loadCoverLetters();
    } catch (err) {
      console.error('Failed to save cover letter:', err);
    }
  };

  const handleDelete = async (id: number, clTitle: string) => {
    if (!window.confirm(`Delete cover letter "${clTitle}"?`)) return;
    try {
      await api.deleteCoverLetter(id);
      loadCoverLetters();
    } catch (err) {
      console.error('Failed to delete cover letter:', err);
    }
  };

  // Trigger AI Draft Generator
  const handleGenerateAIDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAiGenerating(true);
      const res = await api.generateAICoverLetter({
        job_title: aiJobTitle,
        company: aiCompany,
        job_description: aiDescription,
        tone: aiTone
      });

      setTitle(res.title);
      setContent(res.content);
      setShowAIModal(false);
      setShowEditorModal(true);
    } catch (err) {
      console.error('AI Draft Generation failed:', err);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCopyContent = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Cover Letter Studio <Mail className="w-5 h-5 text-brand-500" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Create, edit, and store multiple cover letter versions, or generate tailored drafts instantly with AI.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAIModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 hover:opacity-95 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300 fill-amber-300" /> AI Draft Generator
          </button>
          <button
            onClick={() => handleOpenEditor()}
            className="px-4 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Blank Cover Letter
          </button>
        </div>
      </div>

      {/* List Grid */}
      {loading ? (
        <div className="p-8 text-center text-xs text-slate-500">Loading cover letters...</div>
      ) : coverLetters.length === 0 ? (
        <div className="p-12 text-center glass-panel space-y-3">
          <Mail className="w-10 h-10 mx-auto text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">No cover letters created</h3>
          <p className="text-xs text-slate-500">Create your first cover letter or use the AI Generator tool!</p>
          <button
            onClick={() => setShowAIModal(true)}
            className="px-4 py-2 bg-purple-600 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 fill-amber-300 text-amber-300" /> Generate AI Draft
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {coverLetters.map((cl) => (
            <div key={cl.id} className="glass-card p-5 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">{cl.title}</h3>
                  <span className="text-[10px] text-slate-400">{new Date(cl.updated_at).toLocaleDateString()}</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 line-clamp-4 font-mono leading-relaxed whitespace-pre-wrap">
                  {cl.content}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleCopyContent(cl.content)}
                  className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 font-medium flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied' : 'Copy Text'}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEditor(cl)}
                    className="p-1.5 text-slate-400 hover:text-brand-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cl.id, cl.title)}
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

      {/* Editor Modal */}
      <Modal
        isOpen={showEditorModal}
        onClose={() => setShowEditorModal(false)}
        title={editingId ? 'Edit Cover Letter' : 'Create Cover Letter'}
        subtitle="Review, edit, and refine your cover letter text."
        maxWidth="max-w-3xl"
      >
        <form onSubmit={handleSaveEditor} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Title / Identifier</label>
            <input
              type="text"
              required
              placeholder="e.g. Stripe Senior Frontend Engineer Pitch"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Cover Letter Body</label>
            <textarea
              rows={12}
              required
              placeholder="Dear Hiring Manager..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2 text-sm font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none leading-relaxed"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowEditorModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-brand-600 text-white rounded-xl shadow-xs"
            >
              Save Cover Letter
            </button>
          </div>
        </form>
      </Modal>

      {/* AI Draft Generator Modal */}
      <Modal
        isOpen={showAIModal}
        onClose={() => setShowAIModal(false)}
        title="AI Cover Letter Assistant"
        subtitle="Generates a customized, persuasive draft based on your user profile skills and target role."
      >
        <form onSubmit={handleGenerateAIDraft} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Job Title</label>
              <input
                type="text"
                required
                placeholder="e.g. Senior Product Engineer"
                value={aiJobTitle}
                onChange={(e) => setAiJobTitle(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Company</label>
              <input
                type="text"
                required
                placeholder="e.g. Vercel"
                value={aiCompany}
                onChange={(e) => setAiCompany(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Writing Tone</label>
            <select
              value={aiTone}
              onChange={(e) => setAiTone(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
            >
              <option value="professional">Professional & Formal</option>
              <option value="confident">Confident & High-Impact</option>
              <option value="casual">Casual & Conversational Startup Pitch</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Job Description Highlights (Optional)</label>
            <textarea
              rows={3}
              placeholder="Paste job requirements or company mission statement..."
              value={aiDescription}
              onChange={(e) => setAiDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
            />
          </div>

          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-xl border border-purple-200 dark:border-purple-800 text-[11px] text-purple-900 dark:text-purple-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
            <span>AI will automatically incorporate your profile skills and work experience into the draft.</span>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAIModal(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={aiGenerating}
              className="px-5 py-2 text-xs font-bold bg-gradient-to-r from-purple-600 to-brand-600 text-white rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {aiGenerating ? 'Generating Draft...' : 'Generate AI Cover Letter'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
