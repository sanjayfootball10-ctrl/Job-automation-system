import { Router, Response } from 'express';
import { query, getOne, run } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET all interviews for current user (with application metadata for calendar)
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const interviews = await query(
      `SELECT i.*, a.job_title, a.company, a.location as job_location, a.status as application_status
       FROM interviews i
       JOIN applications a ON i.application_id = a.id
       WHERE i.user_id = ?
       ORDER BY i.interview_date ASC`,
      [userId]
    );

    res.json({ interviews });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch interviews' });
  }
});

// CREATE interview event
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { application_id, interview_date, interview_type, meeting_url, notes, status } = req.body;

    if (!application_id || !interview_date) {
      return res.status(400).json({ error: 'Application ID and Interview Date are required' });
    }

    const app = await getOne('SELECT id, job_title, company FROM applications WHERE id = ? AND user_id = ?', [application_id, userId]);
    if (!app) {
      return res.status(404).json({ error: 'Associated application not found' });
    }

    const result = await run(
      `INSERT INTO interviews (application_id, user_id, interview_date, interview_type, meeting_url, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [application_id, userId, interview_date, interview_type || 'Video', meeting_url || '', notes || '', status || 'Scheduled']
    );

    // Auto-update application status to "Interview" if it's currently Applied or Under Review
    await run(`UPDATE applications SET status = 'Interview', updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status IN ('Saved', 'Applied', 'Under Review', 'Shortlisted')`, [application_id]);

    // Create notification
    await run(
      `INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)`,
      [
        userId,
        `Interview Scheduled: ${app.company}`,
        `${interview_type || 'Interview'} for ${app.job_title} at ${app.company} set for ${new Date(interview_date).toLocaleString()}.`,
        'interview',
        '/calendar'
      ]
    );

    const created = await getOne('SELECT * FROM interviews WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Interview scheduled successfully', interview: created });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to schedule interview' });
  }
});

// UPDATE interview
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { interview_date, interview_type, meeting_url, notes, status } = req.body;

    const existing = await getOne('SELECT id FROM interviews WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Interview not found' });
    }

    await run(
      `UPDATE interviews SET
        interview_date = COALESCE(?, interview_date),
        interview_type = COALESCE(?, interview_type),
        meeting_url = COALESCE(?, meeting_url),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status)
       WHERE id = ? AND user_id = ?`,
      [interview_date, interview_type, meeting_url, notes, status, req.params.id, userId]
    );

    const updated = await getOne('SELECT * FROM interviews WHERE id = ?', [req.params.id]);
    res.json({ message: 'Interview updated', interview: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update interview' });
  }
});

// DELETE interview
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await run('DELETE FROM interviews WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ message: 'Interview removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete interview' });
  }
});

export default router;
