import React, { useEffect, useState } from 'react';
import type { AutomationRule } from '../types';
import { api } from '../api/client';
import { Cpu, Play, CheckCircle, BellRing, ShieldCheck, Clock, Mail, AlertTriangle } from 'lucide-react';

export const AutomationsPage: React.FC = () => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);

  const loadRules = async () => {
    try {
      setLoading(true);
      const res = await api.getAutomationRules();
      setRules(res.rules);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const handleToggleRule = async (ruleId: number, currentEnabled: number) => {
    try {
      const updatedEnabled = currentEnabled ? 0 : 1;
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, enabled: updatedEnabled } : r)));
      await api.updateAutomationRule(ruleId, { enabled: !!updatedEnabled });
    } catch (err) {
      console.error('Failed to toggle rule:', err);
      loadRules();
    }
  };

  const handleUpdateDays = async (ruleId: number, newDays: number) => {
    try {
      setRules((prev) => prev.map((r) => (r.id === ruleId ? { ...r, days_threshold: newDays } : r)));
      await api.updateAutomationRule(ruleId, { days_threshold: newDays });
    } catch (err) {
      console.error('Failed to update threshold:', err);
    }
  };

  const handleRunScan = async () => {
    try {
      setRunning(true);
      const res = await api.runAutomationScan();
      setScanResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  const getRuleDetails = (type: string) => {
    switch (type) {
      case 'pending_reminder':
        return {
          title: 'Application Pending Alert',
          description: 'Notify when an application has been pending without status change for X days.',
          icon: Clock,
          color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60'
        };
      case 'interview_reminder':
        return {
          title: 'Interview 24h Countdown Reminder',
          description: 'Send high-priority in-app reminder 24 hours prior to a scheduled technical interview.',
          icon: BellRing,
          color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60'
        };
      case 'deadline_reminder':
        return {
          title: 'Application Deadline Warning',
          description: 'Alert 3 days prior to an application submission deadline.',
          icon: AlertTriangle,
          color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/60'
        };
      case 'followup_reminder':
        return {
          title: 'Recruiter Follow-up Recommender',
          description: 'Suggest drafting a polite follow-up email after 7-14 days of no response.',
          icon: Mail,
          color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60'
        };
      default:
        return {
          title: 'System Trigger Rule',
          description: 'Automated workflow processor',
          icon: Cpu,
          color: 'text-slate-500 bg-slate-50'
        };
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
            Automation Engine & Triggers <Cpu className="w-5 h-5 text-brand-500" />
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Configure automated background rules for pending app follow-ups, interview 24h reminders, and deadlines.
          </p>
        </div>

        <button
          onClick={handleRunScan}
          disabled={running}
          className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 disabled:opacity-50 transition-all"
        >
          <Play className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
          {running ? 'Scanning Database...' : 'Run Automation Engine Scan'}
        </button>
      </div>

      {/* Manual Execution Feedback Banner */}
      {scanResult && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-600" /> {scanResult.message}
          </div>
          {scanResult.results && scanResult.results.length > 0 && (
            <div className="space-y-1 text-slate-700 dark:text-slate-300">
              {scanResult.results.map((res: any, idx: number) => (
                <p key={idx}>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 uppercase text-[10px]">[{res.ruleType}]</span>: {res.notificationsGenerated} notifications generated
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Rules Config List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider text-slate-500">Active Automation Rules</h2>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-500">Loading rules...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rules.map((rule) => {
              const info = getRuleDetails(rule.rule_type);
              const Icon = info.icon;
              return (
                <div key={rule.id} className="glass-card p-5 space-y-4 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${info.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">{info.title}</h3>
                          <span className="text-[10px] font-semibold uppercase text-slate-400">Rule #{rule.id}</span>
                        </div>
                      </div>

                      {/* Toggle Switch */}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!rule.enabled}
                          onChange={() => handleToggleRule(rule.id, rule.enabled)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:after:border-slate-600 peer-checked:bg-brand-600"></div>
                      </label>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400">{info.description}</p>
                  </div>

                  {/* Threshold Config */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Days Threshold:</span>
                    <input
                      type="number"
                      min="1"
                      max="30"
                      value={rule.days_threshold || 7}
                      onChange={(e) => handleUpdateDays(rule.id, parseInt(e.target.value, 10) || 1)}
                      className="w-16 px-2 py-1 text-center font-bold bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Internal vs External Automation Rules Notice */}
      <div className="glass-panel p-5 border-l-4 border-l-brand-500 space-y-2">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-500" /> Automation Architecture & Security Compliance
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          <strong>Internal Automation:</strong> Evaluates your application history, generates reminders, interview 24h countdown alerts, deadline warnings, and timeline logs securely on the backend.<br />
          <strong>External Integration Safety:</strong> External website platforms (LinkedIn, Indeed, Company portals) are accessed exclusively via official APIs or authorized user configurations. Unauthorized site scraping or credential harvesting is strictly prohibited.
        </p>
      </div>
    </div>
  );
};
