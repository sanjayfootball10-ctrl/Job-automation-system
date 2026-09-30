import { Router, Response } from 'express';
import { query, getOne, run } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET notifications
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notifications = await query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC', [userId]);
    const unreadCountRow = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [userId]);

    res.json({
      notifications,
      unreadCount: unreadCountRow?.count || 0
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' });
  }
});

// MARK single notification read
router.patch('/:id/read', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await run('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ message: 'Marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update notification' });
  }
});

// MARK all read
router.patch('/read-all', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await run('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    res.json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update notifications' });
  }
});

// DELETE notification
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await run('DELETE FROM notifications WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ message: 'Notification removed' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete notification' });
  }
});

export default router;
