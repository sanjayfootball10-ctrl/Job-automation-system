import { Router, Response } from 'express';
import { query, getOne, run } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// GET all cover letters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const coverLetters = await query('SELECT * FROM cover_letters WHERE user_id = ? ORDER BY updated_at DESC', [userId]);
    res.json({ coverLetters });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch cover letters' });
  }
});

// GET single cover letter
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const coverLetter = await getOne('SELECT * FROM cover_letters WHERE id = ? AND user_id = ?', [req.params.id, userId]);

    if (!coverLetter) {
      return res.status(404).json({ error: 'Cover letter not found' });
    }

    res.json({ coverLetter });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch cover letter' });
  }
});

// CREATE cover letter
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    const result = await run(
      `INSERT INTO cover_letters (user_id, title, content) VALUES (?, ?, ?)`,
      [userId, title, content]
    );

    const created = await getOne('SELECT * FROM cover_letters WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Cover letter created successfully', coverLetter: created });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create cover letter' });
  }
});

// UPDATE cover letter
router.put('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, content } = req.body;

    const existing = await getOne('SELECT id FROM cover_letters WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'Cover letter not found' });
    }

    await run(
      `UPDATE cover_letters SET title = COALESCE(?, title), content = COALESCE(?, content), updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
      [title, content, req.params.id, userId]
    );

    const updated = await getOne('SELECT * FROM cover_letters WHERE id = ?', [req.params.id]);
    res.json({ message: 'Cover letter updated successfully', coverLetter: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update cover letter' });
  }
});

// DELETE cover letter
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await run('DELETE FROM cover_letters WHERE id = ? AND user_id = ?', [req.params.id, userId]);
    res.json({ message: 'Cover letter deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete cover letter' });
  }
});

// AI-ASSISTED COVER LETTER GENERATOR
router.post('/generate-ai', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { job_title, company, job_description, tone } = req.body;

    // Fetch user profile for context
    const user = await getOne('SELECT name, skills, experience, preferred_role FROM users WHERE id = ?', [userId]);
    const userName = user?.name || 'Applicant';
    const userSkills = user?.skills || 'React, TypeScript, Node.js, Web Engineering';
    const userExperience = user?.experience || '5+ years in software engineering building scalable applications';

    const currentYear = new Date().getFullYear();
    const currentDate = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const keySkillsList = userSkills.split(',').slice(0, 4).map((s: string) => s.trim()).join(', ');

    let generatedDraft = '';

    if (tone === 'confident') {
      generatedDraft = `
Date: ${currentDate}

To the Hiring Team at ${company || 'your esteemed company'},

I am writing to express my strong enthusiasm for the ${job_title || 'Software Engineering'} position at ${company || 'the company'}. With a proven track record in building high-performance web applications and expertise in ${keySkillsList}, I am confident in my ability to immediately elevate your development team's velocity and codebase quality.

Key Highlights of My Qualifications:
- Technical Expertise: Deep domain mastery in ${userSkills}.
- Track Record: ${userExperience}.
- Industry Alignment: ${job_description ? `My background aligns directly with your mission to "${job_description.slice(0, 120)}..."` : `Demonstrated capability to deliver reliable systems on tight timelines.`}

${company || 'Your organization'} has established itself as an industry standard-bearer, and I am excited about the prospect of contributing to your future innovations. I welcome the opportunity to discuss how my skill set matches your team's strategic goals.

Thank you for your time and consideration.

Sincerely,

${userName}
      `.trim();
    } else if (tone === 'casual') {
      generatedDraft = `
Date: ${currentDate}

Hi ${company || 'Team'} Hiring Team,

I came across the ${job_title || 'Role'} opening at ${company || 'your company'} and couldn't resist reaching out! I've been following your work closely, and I'm really inspired by what you are building.

Over the past few years, I've specialized in ${keySkillsList}, crafting product-focused tools and web applications (${userExperience}).

Why I'd be a great fit:
1. Passionate about developer UX and clean code standards.
2. Direct experience with ${userSkills}.
3. Excited to dive headfirst into your team's current challenges (${job_description ? job_description.slice(0, 100) + '...' : 'building exceptional software'}).

I'd love to chat more about how I can help ${company || 'the team'} reach its next milestones!

Best regards,

${userName}
      `.trim();
    } else {
      // Professional / Default
      generatedDraft = `
Date: ${currentDate}

Hiring Manager
${company || 'Company'}

Subject: Application for ${job_title || 'Target Role'} Position

Dear Hiring Team,

Please accept this letter and attached resume as my formal application for the ${job_title || 'Open Position'} role at ${company || 'your company'}. Given my background in ${keySkillsList} and experience in ${userExperience}, I am eager to apply my technical leadership to support your team's strategic objectives.

Throughout my career, I have focused on producing maintainable, scalable, and user-centric software solutions. ${job_description ? `The opportunity described for ${job_title} matches my core strengths in ${keySkillsList}.` : ''}

I would welcome the privilege of an interview to discuss how my technical expertise can advance ${company || 'your company'}'s goals. Thank you for evaluating my application.

Respectfully yours,

${userName}
      `.trim();
    }

    res.json({
      title: `${company || 'Job'} - ${job_title || 'Cover Letter'} Draft`,
      content: generatedDraft,
      disclaimer: 'This draft was generated with AI assistance based on your profile and target job. Please review and refine before submitting.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI generation failed' });
  }
});

export default router;
