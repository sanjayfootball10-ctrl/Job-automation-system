import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { query, getOne, run } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

const uploadsDir = path.resolve(__dirname, '../../uploads/resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${file.originalname.replace(/\s+/g, '_')}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf, .doc, .docx, and .txt files are allowed!'));
    }
  }
});

// GET all resumes
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const resumes = await query('SELECT * FROM resumes WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [userId]);
    res.json({ resumes });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch resumes' });
  }
});

// UPLOAD resume
router.post('/upload', authenticateToken, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const file = req.file;
    const customName = req.body.name;

    if (!file) {
      // If text content provided without binary file
      const name = customName || 'New Resume.pdf';
      const content = req.body.content || 'Sample resume content...';
      const isDefault = req.body.is_default ? 1 : 0;

      if (isDefault) {
        await run('UPDATE resumes SET is_default = 0 WHERE user_id = ?', [userId]);
      }

      const result = await run(
        `INSERT INTO resumes (user_id, name, file_path, file_type, is_default, content)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, name, `/uploads/resumes/${name}`, 'pdf', isDefault, content]
      );

      const created = await getOne('SELECT * FROM resumes WHERE id = ?', [result.lastID]);
      return res.status(201).json({ message: 'Resume uploaded successfully', resume: created });
    }

    const name = customName || file.originalname;
    const fileExt = path.extname(file.originalname).replace('.', '') || 'pdf';
    const filePath = `/uploads/resumes/${file.filename}`;

    const existingCount = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM resumes WHERE user_id = ?', [userId]);
    const isDefault = existingCount && existingCount.count === 0 ? 1 : 0;

    const result = await run(
      `INSERT INTO resumes (user_id, name, file_path, file_type, is_default, content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, name, filePath, fileExt, isDefault, `Uploaded file: ${file.originalname}`]
    );

    const created = await getOne('SELECT * FROM resumes WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Resume uploaded successfully', resume: created });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to upload resume' });
  }
});

// SET default resume
router.patch('/:id/default', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const resumeId = req.params.id;

    const existing = await getOne('SELECT id FROM resumes WHERE id = ? AND user_id = ?', [resumeId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    await run('UPDATE resumes SET is_default = 0 WHERE user_id = ?', [userId]);
    await run('UPDATE resumes SET is_default = 1 WHERE id = ? AND user_id = ?', [resumeId, userId]);

    res.json({ message: 'Default resume updated', defaultResumeId: resumeId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to set default resume' });
  }
});

// DELETE resume
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const resumeId = req.params.id;

    const existing = await getOne('SELECT id, file_path FROM resumes WHERE id = ? AND user_id = ?', [resumeId, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    await run('DELETE FROM resumes WHERE id = ? AND user_id = ?', [resumeId, userId]);
    res.json({ message: 'Resume deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete resume' });
  }
});

export default router;
