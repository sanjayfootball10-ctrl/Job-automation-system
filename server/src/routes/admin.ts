import { Router, Response } from 'express';
import { query, getOne } from '../db';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Admin Dashboard Summary stats
router.get('/dashboard', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const totalUsers = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM users');
    const totalApplications = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM applications');
    const totalInterviews = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM interviews');
    const totalResumes = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM resumes');

    const usersList = await query(
      'SELECT id, name, email, role, location, preferred_role, created_at FROM users ORDER BY created_at DESC'
    );

    const activityLogs = await query(
      `SELECT l.*, u.name as user_name, u.email as user_email
       FROM activity_logs l
       LEFT JOIN users u ON l.user_id = u.id
       ORDER BY l.created_at DESC
       LIMIT 50`
    );

    res.json({
      metrics: {
        totalUsers: totalUsers?.count || 0,
        activeUsers: totalUsers?.count || 0,
        totalApplications: totalApplications?.count || 0,
        totalInterviews: totalInterviews?.count || 0,
        totalResumes: totalResumes?.count || 0
      },
      users: usersList,
      logs: activityLogs
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch admin stats' });
  }
});

export default router;
