import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getOne, run } from '../db';
import { authenticateToken, AuthRequest, JWT_SECRET } from '../middleware/auth';

const router = Router();

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, location } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    const existingUser = await getOne('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run(
      `INSERT INTO users (name, email, password_hash, phone, location, role, email_verified)
       VALUES (?, ?, ?, ?, ?, 'user', 1)`,
      [name, email, passwordHash, phone || '', location || '']
    );

    const userId = result.lastID;
    const token = jwt.sign({ id: userId, email, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });

    // Seed default automation rules for new user
    await run(
      `INSERT INTO automation_rules (user_id, rule_type, enabled, days_threshold) VALUES (?, 'pending_reminder', 1, 7)`,
      [userId]
    );
    await run(
      `INSERT INTO automation_rules (user_id, rule_type, enabled, days_threshold) VALUES (?, 'interview_reminder', 1, 1)`,
      [userId]
    );

    // Initial welcome notification
    await run(
      `INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, ?)`,
      [userId, 'Welcome to Job Application Tracker!', 'Start by tracking your first job application or exploring job listings.', 'system']
    );

    const user = await getOne('SELECT id, name, email, role, phone, location, skills, education, experience, linkedin_url, github_url, portfolio_url, preferred_role, preferred_location, expected_salary FROM users WHERE id = ?', [userId]);

    res.status(201).json({ token, user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Signup failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await getOne('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });

    // Audit log
    await run('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)', [user.id, 'USER_LOGIN', 'Logged in successfully']);

    const { password_hash, reset_token, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login failed' });
  }
});

// Get Current User Profile
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = await getOne(
      'SELECT id, name, email, role, phone, location, skills, education, experience, linkedin_url, github_url, portfolio_url, preferred_role, preferred_location, expected_salary, email_verified, created_at FROM users WHERE id = ?',
      [req.user!.id]
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch user' });
  }
});

// Update Profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const {
      name, phone, location, skills, education, experience,
      linkedin_url, github_url, portfolio_url, preferred_role, preferred_location, expected_salary
    } = req.body;

    await run(
      `UPDATE users SET
        name = COALESCE(?, name),
        phone = COALESCE(?, phone),
        location = COALESCE(?, location),
        skills = COALESCE(?, skills),
        education = COALESCE(?, education),
        experience = COALESCE(?, experience),
        linkedin_url = COALESCE(?, linkedin_url),
        github_url = COALESCE(?, github_url),
        portfolio_url = COALESCE(?, portfolio_url),
        preferred_role = COALESCE(?, preferred_role),
        preferred_location = COALESCE(?, preferred_location),
        expected_salary = COALESCE(?, expected_salary)
       WHERE id = ?`,
      [
        name, phone, location, skills, education, experience,
        linkedin_url, github_url, portfolio_url, preferred_role, preferred_location, expected_salary,
        req.user!.id
      ]
    );

    const user = await getOne(
      'SELECT id, name, email, role, phone, location, skills, education, experience, linkedin_url, github_url, portfolio_url, preferred_role, preferred_location, expected_salary FROM users WHERE id = ?',
      [req.user!.id]
    );

    res.json({ message: 'Profile updated successfully', user });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update profile' });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await getOne('SELECT id FROM users WHERE email = ?', [email]);

    if (!user) {
      // Return success to prevent email enumeration
      return res.json({ message: 'If an account with that email exists, password reset instructions have been sent.' });
    }

    const resetToken = Math.random().toString(36).substring(2) + Date.now().toString(36);
    await run('UPDATE users SET reset_token = ? WHERE id = ?', [resetToken, user.id]);

    res.json({
      message: 'Password reset link sent (Simulated)',
      resetToken // Returned for testing convenience
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Request failed' });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;
    if (!resetToken || !newPassword) {
      return res.status(400).json({ error: 'Reset token and new password are required' });
    }

    const user = await getOne('SELECT id FROM users WHERE reset_token = ?', [resetToken]);
    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await run('UPDATE users SET password_hash = ?, reset_token = NULL WHERE id = ?', [passwordHash, user.id]);

    res.json({ message: 'Password reset successful! You can now log in with your new password.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Reset password failed' });
  }
});

export default router;
