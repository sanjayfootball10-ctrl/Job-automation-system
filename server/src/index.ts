import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import http from 'http';
import { initDb, query } from './db';
import { initSocket, emitToUser } from './socket';
import { runAutomationScan } from './automationEngine';

import authRoutes from './routes/auth';
import applicationRoutes from './routes/applications';
import resumeRoutes from './routes/resumes';
import coverLetterRoutes from './routes/coverLetters';
import interviewRoutes from './routes/interviews';
import jobRoutes from './routes/jobs';
import automationRoutes from './routes/automations';
import notificationRoutes from './routes/notifications';
import analyticsRoutes from './routes/analytics';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Create HTTP & WebSocket Server
const server = http.createServer(app);
initSocket(server);

// Serve static uploads
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Healthcheck endpoint with real-time status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'realtime-production',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/cover-letters', coverLetterRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);

// Real-Time Background Automation Engine (Runs every 2 minutes)
function startBackgroundAutomationEngine() {
  console.log('⏰ [Background Engine] Starting real-time automated job scan worker...');

  setInterval(async () => {
    try {
      // Find all active users
      const users = await query('SELECT id FROM users');
      for (const u of users) {
        const results = await runAutomationScan(u.id);
        const totalNew = results.reduce((acc, curr) => acc + curr.notificationsGenerated, 0);

        if (totalNew > 0) {
          console.log(`🔔 [Realtime Notification] User #${u.id} triggered ${totalNew} real-time automation alerts.`);
          // Fetch updated notification list & unread count for user
          const unreadRow = await query('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0', [u.id]);
          const notifications = await query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [u.id]);

          emitToUser(u.id, 'notifications_updated', {
            notifications,
            unreadCount: unreadRow[0]?.count || 0
          });
        }
      }
    } catch (err) {
      console.error('❌ [Background Engine] Scan error:', err);
    }
  }, 120000); // Every 2 minutes
}

// Serverless middleware to ensure DB is initialized on Vercel
let isDbInitialized = false;
app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    try {
      await initDb();
      isDbInitialized = true;
    } catch (err) {
      console.error('Database initialization error:', err);
    }
  }
  next();
});

// Initialize DB and launch server locally
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  initDb()
    .then(() => {
      server.listen(PORT, () => {
        console.log(`🚀 [Realtime Server] Running on http://localhost:${PORT}`);
        console.log(`⚡ WebSocket Server active on ws://localhost:${PORT}`);
        startBackgroundAutomationEngine();
      });
    })
    .catch((err) => {
      console.error('Failed to initialize database:', err);
    });
}

export default app;
