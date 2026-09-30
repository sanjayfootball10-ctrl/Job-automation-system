import { Router, Response } from 'express';
import { query, getOne, run } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { runAutomationScan } from '../automationEngine';

const router = Router();

// GET all rules for current user
router.get('/rules', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const rules = await query('SELECT * FROM automation_rules WHERE user_id = ? ORDER BY id ASC', [userId]);

    res.json({ rules });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch automation rules' });
  }
});

// UPDATE rule (toggle enabled, change threshold)
router.put('/rules/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { enabled, days_threshold, configuration } = req.body;

    const existing = await getOne('SELECT id FROM automation_rules WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Automation rule not found' });
    }

    await run(
      `UPDATE automation_rules SET
        enabled = COALESCE(?, enabled),
        days_threshold = COALESCE(?, days_threshold),
        configuration = COALESCE(?, configuration)
       WHERE id = ? AND user_id = ?`,
      [enabled !== undefined ? (enabled ? 1 : 0) : undefined, days_threshold, configuration, req.params.id, userId]
    );

    const updated = await getOne('SELECT * FROM automation_rules WHERE id = ?', [req.params.id]);
    res.json({ message: 'Automation rule updated', rule: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update rule' });
  }
});

// TRIGGER manual automation engine scan
router.post('/run', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const results = await runAutomationScan(userId);

    const totalNotifications = results.reduce((acc, curr) => acc + curr.notificationsGenerated, 0);

    res.json({
      message: totalNotifications > 0 ? `Scan completed! ${totalNotifications} new notification(s) generated.` : 'Scan completed. All applications up-to-date.',
      results
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to run automation scan' });
  }
});

export default router;
