import { query, getOne, run } from './db';

export interface AutomationResult {
  ruleType: string;
  notificationsGenerated: number;
  details: string[];
}

export async function runAutomationScan(userId: number): Promise<AutomationResult[]> {
  const results: AutomationResult[] = [];
  const rules = await query('SELECT * FROM automation_rules WHERE user_id = ? AND enabled = 1', [userId]);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  for (const rule of rules) {
    let count = 0;
    const details: string[] = [];

    if (rule.rule_type === 'pending_reminder') {
      // 1. Pending Applications (> threshold days)
      const thresholdDays = rule.days_threshold || 7;
      const cutoffDate = new Date(now.getTime() - thresholdDays * 86400000).toISOString().split('T')[0];

      const pendingApps = await query(
        `SELECT id, job_title, company, application_date, status
         FROM applications
         WHERE user_id = ? AND status IN ('Applied', 'Under Review') AND application_date <= ?`,
        [userId, cutoffDate]
      );

      for (const app of pendingApps) {
        // Check if notification already sent recently
        const existingNotif = await getOne(
          `SELECT id FROM notifications
           WHERE user_id = ? AND type = 'reminder' AND message LIKE ? AND created_at >= date('now', '-3 days')`,
          [userId, `%${app.company}%`]
        );

        if (!existingNotif) {
          await run(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES (?, ?, ?, 'reminder', '/applications')`,
            [
              userId,
              `Application Pending: ${app.company}`,
              `Your application for ${app.job_title} at ${app.company} has been pending for over ${thresholdDays} days.`
            ]
          );
          count++;
          details.push(`Alerted pending app for ${app.job_title} at ${app.company}`);
        }
      }
    } else if (rule.rule_type === 'interview_reminder') {
      // 2. Upcoming Interviews (within 24-48 hours)
      const targetDate = new Date(now.getTime() + 48 * 3600000).toISOString();

      const upcomingInterviews = await query(
        `SELECT i.id, i.interview_date, i.interview_type, a.job_title, a.company
         FROM interviews i
         JOIN applications a ON i.application_id = a.id
         WHERE i.user_id = ? AND i.status = 'Scheduled' AND i.interview_date >= ? AND i.interview_date <= ?`,
        [userId, todayStr, targetDate]
      );

      for (const interview of upcomingInterviews) {
        const existingNotif = await getOne(
          `SELECT id FROM notifications
           WHERE user_id = ? AND type = 'interview' AND message LIKE ? AND created_at >= date('now', '-1 days')`,
          [userId, `%${interview.company}%`]
        );

        if (!existingNotif) {
          await run(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES (?, ?, ?, 'interview', '/calendar')`,
            [
              userId,
              `Upcoming Interview Reminder`,
              `Reminder: ${interview.interview_type} interview for ${interview.job_title} at ${interview.company} is scheduled for ${interview.interview_date}.`
            ]
          );
          count++;
          details.push(`24h interview reminder created for ${interview.company}`);
        }
      }
    } else if (rule.rule_type === 'deadline_reminder') {
      // 3. Application Deadlines (within 3 days)
      const deadlineCutoff = new Date(now.getTime() + 3 * 86400000).toISOString().split('T')[0];

      const deadlineApps = await query(
        `SELECT id, job_title, company, deadline, status
         FROM applications
         WHERE user_id = ? AND deadline != '' AND deadline >= ? AND deadline <= ? AND status = 'Saved'`,
        [userId, todayStr, deadlineCutoff]
      );

      for (const app of deadlineApps) {
        const existingNotif = await getOne(
          `SELECT id FROM notifications
           WHERE user_id = ? AND type = 'deadline' AND message LIKE ? AND created_at >= date('now', '-2 days')`,
          [userId, `%${app.company}%`]
        );

        if (!existingNotif) {
          await run(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES (?, ?, ?, 'deadline', '/applications')`,
            [
              userId,
              `Deadline Approaching!`,
              `Application deadline for ${app.job_title} at ${app.company} is on ${app.deadline}. Submit soon!`
            ]
          );
          count++;
          details.push(`Deadline reminder created for ${app.job_title} at ${app.company}`);
        }
      }
    } else if (rule.rule_type === 'followup_reminder') {
      // 4. Follow-up Reminders (7-14 days without response)
      const followupCutoff = new Date(now.getTime() - 10 * 86400000).toISOString().split('T')[0];

      const followupApps = await query(
        `SELECT id, job_title, company, contact_email, contact_person, application_date
         FROM applications
         WHERE user_id = ? AND status = 'Applied' AND application_date <= ?`,
        [userId, followupCutoff]
      );

      for (const app of followupApps) {
        const existingNotif = await getOne(
          `SELECT id FROM notifications
           WHERE user_id = ? AND type = 'reminder' AND message LIKE ? AND created_at >= date('now', '-4 days')`,
          [userId, `%Follow-up%${app.company}%`]
        );

        if (!existingNotif) {
          const contact = app.contact_email ? `to ${app.contact_email}` : 'to hiring recruiter';
          await run(
            `INSERT INTO notifications (user_id, title, message, type, link)
             VALUES (?, ?, ?, 'reminder', '/applications')`,
            [
              userId,
              `Follow-up Suggested: ${app.company}`,
              `It has been 10+ days since applying for ${app.job_title}. Consider sending a follow-up email ${contact}.`
            ]
          );
          count++;
          details.push(`Suggested follow-up email for ${app.job_title} at ${app.company}`);
        }
      }
    }

    results.push({
      ruleType: rule.rule_type,
      notificationsGenerated: count,
      details
    });
  }

  return results;
}
