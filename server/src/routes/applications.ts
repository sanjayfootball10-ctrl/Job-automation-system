import { Router, Response } from 'express';
import { query, getOne, run, seedUserDataIfEmpty } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { emitToUser } from '../socket';

const router = Router();

// GET all applications for current user with filtering & search
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await seedUserDataIfEmpty(userId);
    const { search, status, job_type, source, sort } = req.query;

    let sql = `
      SELECT a.*, r.name as resume_name, c.title as cover_letter_title
      FROM applications a
      LEFT JOIN resumes r ON a.resume_id = r.id
      LEFT JOIN cover_letters c ON a.cover_letter_id = c.id
      WHERE a.user_id = ?
    `;
    const params: any[] = [userId];

    if (search) {
      sql += ` AND (a.job_title LIKE ? OR a.company LIKE ? OR a.location LIKE ? OR a.notes LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status && status !== 'all') {
      sql += ` AND a.status = ?`;
      params.push(status);
    }

    if (job_type && job_type !== 'all') {
      sql += ` AND a.job_type = ?`;
      params.push(job_type);
    }

    if (source && source !== 'all') {
      sql += ` AND a.source = ?`;
      params.push(source);
    }

    if (sort === 'oldest') {
      sql += ` ORDER BY a.created_at ASC`;
    } else if (sort === 'company') {
      sql += ` ORDER BY a.company ASC`;
    } else {
      sql += ` ORDER BY a.kanban_order ASC, a.created_at DESC`;
    }

    const applications = await query(sql, params);
    res.json({ applications });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch applications' });
  }
});

// GET single application details + timeline history
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const appId = req.params.id;

    const application = await getOne(
      `SELECT a.*, r.name as resume_name, c.title as cover_letter_title
       FROM applications a
       LEFT JOIN resumes r ON a.resume_id = r.id
       LEFT JOIN cover_letters c ON a.cover_letter_id = c.id
       WHERE a.id = ? AND a.user_id = ?`,
      [appId, userId]
    );

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const history = await query(
      `SELECT * FROM application_history WHERE application_id = ? ORDER BY changed_at DESC`,
      [appId]
    );

    const interviews = await query(
      `SELECT * FROM interviews WHERE application_id = ? ORDER BY interview_date ASC`,
      [appId]
    );

    res.json({ application, history, interviews });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch application' });
  }
});

// CREATE new application
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      job_title, company, company_website, job_description, location, job_type,
      salary, application_date, deadline, source, status, contact_person,
      contact_email, notes, resume_id, cover_letter_id
    } = req.body;

    if (!job_title || !company) {
      return res.status(400).json({ error: 'Job title and company are required' });
    }

    const appStatus = status || 'Saved';
    const appDate = application_date || new Date().toISOString().split('T')[0];

    const result = await run(
      `INSERT INTO applications (
        user_id, job_title, company, company_website, job_description, location, job_type,
        salary, application_date, deadline, source, status, contact_person, contact_email,
        notes, resume_id, cover_letter_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId, job_title, company, company_website || '', job_description || '', location || '',
        job_type || 'Full-time', salary || '', appDate, deadline || '', source || 'LinkedIn',
        appStatus, contact_person || '', contact_email || '', notes || '', resume_id || null, cover_letter_id || null
      ]
    );

    const appId = result.lastID;

    // Log initial timeline history
    await run(
      `INSERT INTO application_history (application_id, old_status, new_status, notes)
       VALUES (?, ?, ?, ?)`,
      [appId, null, appStatus, 'Application created']
    );

    // Audit log
    await run('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [
      userId,
      'CREATE_APPLICATION',
      `Created application for ${job_title} at ${company}`
    ]);

    const createdApp = await getOne('SELECT * FROM applications WHERE id = ?', [appId]);

    // Real-Time Socket Event
    emitToUser(userId, 'application_created', { application: createdApp });

    res.status(201).json({ message: 'Application created successfully', application: createdApp });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create application' });
  }
});

// UPDATE application
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const appId = req.params.id;

    const existing = await getOne('SELECT * FROM applications WHERE id = ? AND user_id = ?', [appId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const {
      job_title, company, company_website, job_description, location, job_type,
      salary, application_date, deadline, source, status, contact_person,
      contact_email, notes, resume_id, cover_letter_id
    } = req.body;

    const oldStatus = existing.status;
    const newStatus = status || oldStatus;

    await run(
      `UPDATE applications SET
        job_title = COALESCE(?, job_title),
        company = COALESCE(?, company),
        company_website = COALESCE(?, company_website),
        job_description = COALESCE(?, job_description),
        location = COALESCE(?, location),
        job_type = COALESCE(?, job_type),
        salary = COALESCE(?, salary),
        application_date = COALESCE(?, application_date),
        deadline = COALESCE(?, deadline),
        source = COALESCE(?, source),
        status = ?,
        contact_person = COALESCE(?, contact_person),
        contact_email = COALESCE(?, contact_email),
        notes = COALESCE(?, notes),
        resume_id = ?,
        cover_letter_id = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        job_title, company, company_website, job_description, location, job_type,
        salary, application_date, deadline, source, newStatus, contact_person,
        contact_email, notes, resume_id !== undefined ? resume_id : existing.resume_id,
        cover_letter_id !== undefined ? cover_letter_id : existing.cover_letter_id,
        appId, userId
      ]
    );

    // If status changed, record timeline history & trigger notification
    if (oldStatus !== newStatus) {
      await run(
        `INSERT INTO application_history (application_id, old_status, new_status, notes)
         VALUES (?, ?, ?, ?)`,
        [appId, oldStatus, newStatus, `Status updated from ${oldStatus} to ${newStatus}`]
      );

      await run(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          `Status Update: ${company}`,
          `Application status for ${existing.job_title} at ${company} changed to ${newStatus}.`,
          'status',
          '/applications'
        ]
      );
    }

    const updated = await getOne('SELECT * FROM applications WHERE id = ?', [appId]);

    // Real-Time Socket Event
    emitToUser(userId, 'application_updated', { application: updated });

    res.json({ message: 'Application updated successfully', application: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update application' });
  }
});

// QUICK STATUS UPDATE (Kanban real-time drag and drop)
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const appId = req.params.id;
    const { status, kanban_order } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const existing = await getOne('SELECT * FROM applications WHERE id = ? AND user_id = ?', [appId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const oldStatus = existing.status;

    await run(
      `UPDATE applications SET status = ?, kanban_order = COALESCE(?, kanban_order), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      [status, kanban_order, appId, userId]
    );

    if (oldStatus !== status) {
      await run(
        `INSERT INTO application_history (application_id, old_status, new_status, notes)
         VALUES (?, ?, ?, ?)`,
        [appId, oldStatus, status, `Status changed via Kanban board`]
      );

      // Create notification
      await run(
        `INSERT INTO notifications (user_id, title, message, type, link)
         VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          `Status Changed to ${status}`,
          `${existing.job_title} at ${existing.company} moved to ${status}.`,
          'status',
          '/applications'
        ]
      );
    }

    // Real-Time Socket Event for instant Kanban board sync across open browser tabs
    emitToUser(userId, 'application_status_changed', {
      id: appId,
      oldStatus,
      newStatus: status,
      kanban_order
    });

    res.json({ message: 'Status updated', id: appId, oldStatus, newStatus: status });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Status update failed' });
  }
});

// DELETE application
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const appId = req.params.id;

    const existing = await getOne('SELECT id, job_title, company FROM applications WHERE id = ? AND user_id = ?', [appId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Application not found' });
    }

    await run('DELETE FROM applications WHERE id = ? AND user_id = ?', [appId, userId]);

    // Audit log
    await run('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [
      userId,
      'DELETE_APPLICATION',
      `Deleted application for ${existing.job_title} at ${existing.company}`
    ]);

    // Real-Time Socket Event
    emitToUser(userId, 'application_deleted', { id: appId });

    res.json({ message: 'Application deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete application' });
  }
});

export default router;
