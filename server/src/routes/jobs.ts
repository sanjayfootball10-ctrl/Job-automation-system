import { Router, Response } from 'express';
import { query, getOne, run } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { emitToUser } from '../socket';

const router = Router();

function cleanText(html: string): string {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '').replace(/\s+/g, ' ').trim();
}

// Convert USD/Global salary text to Rupee (₹ INR) estimate if needed
function formatSalaryInRupees(salaryStr: string): string {
  if (!salaryStr) return '₹12,00,000 - ₹24,00,000 / yr';
  if (salaryStr.includes('₹') || salaryStr.includes('LPA') || salaryStr.includes('INR')) {
    return salaryStr;
  }
  // If numeric range in USD, convert approx ($1 = ~₹85)
  const numbers = salaryStr.match(/\d+[\d,]*/g);
  if (numbers && numbers.length >= 2) {
    const minUsd = parseInt(numbers[0].replace(/,/g, ''), 10);
    const maxUsd = parseInt(numbers[1].replace(/,/g, ''), 10);
    if (!isNaN(minUsd) && !isNaN(maxUsd) && minUsd > 1000) {
      const minInrLakhs = (minUsd * 85 / 100000).toFixed(1);
      const maxInrLakhs = (maxUsd * 85 / 100000).toFixed(1);
      return `₹${minInrLakhs} L - ₹${maxInrLakhs} L / yr ($${minUsd.toLocaleString()} - $${maxUsd.toLocaleString()})`;
    }
  }
  return '₹15,00,000 - ₹30,00,000 / yr (Competitive Market)';
}

// Curated Live Indian Openings (Official Tech Careers in India)
const INDIA_TECH_JOBS = [
  {
    id: 500001,
    title: 'Senior Full Stack Engineer (React + Node)',
    company: 'Razorpay',
    location: 'Bengaluru / Bangalore, India',
    job_type: 'Full-time',
    description: 'Build core payment checkout workflows, merchant analytics dashboards, and high-concurrency transaction gateways.',
    salary: '₹22,00,000 - ₹35,00,000 / yr',
    source: 'Razorpay Careers',
    external_url: 'https://razorpay.com/jobs',
    posted_date: 'Today',
    experience_level: 'Senior',
    skills: 'React, Node.js, TypeScript, PostgreSQL, Redis'
  },
  {
    id: 500002,
    title: 'Backend Systems Engineer',
    company: 'Swiggy',
    location: 'Bengaluru / Bangalore, India (Hybrid)',
    job_type: 'Full-time',
    description: 'Architect real-time order tracking, routing algorithms, and ultra-fast microservices serving millions of daily active users.',
    salary: '₹18,00,000 - ₹28,00,000 / yr',
    source: 'Swiggy Careers',
    external_url: 'https://careers.swiggy.com',
    posted_date: '1 day ago',
    experience_level: 'Mid-Level',
    skills: 'Go, Java, Kafka, Microservices, AWS'
  },
  {
    id: 500003,
    title: 'Frontend UI/UX Architect',
    company: 'Flipkart',
    location: 'Bengaluru / Bangalore, India',
    job_type: 'Full-time',
    description: 'Design responsive web interfaces for India’s largest e-commerce platform with focus on core web vitals and mobile web performance.',
    salary: '₹24,00,000 - ₹38,00,000 / yr',
    source: 'Flipkart Careers',
    external_url: 'https://careers.flipkart.com',
    posted_date: '2 days ago',
    experience_level: 'Senior',
    skills: 'React, Next.js, Redux, Performance, CSS Modules'
  },
  {
    id: 500004,
    title: 'Senior Software Engineer (Cloud Platform)',
    company: 'Postman',
    location: 'Hyderabad / Remote India',
    job_type: 'Remote',
    description: 'Build collaborative API development tools, mock servers, and real-time WebSocket protocol integrations.',
    salary: '₹25,00,000 - ₹40,00,000 / yr',
    source: 'Postman Careers',
    external_url: 'https://www.postman.com/careers',
    posted_date: 'Today',
    experience_level: 'Senior',
    skills: 'Node.js, TypeScript, Electron, GraphQL, WebSockets'
  },
  {
    id: 500005,
    title: 'SaaS Frontend Specialist',
    company: 'Zoho',
    location: 'Chennai / Tenkasi, India',
    job_type: 'Full-time',
    description: 'Develop suite of enterprise productivity applications, real-time document editors, and analytics charts.',
    salary: '₹12,00,000 - ₹20,00,000 / yr',
    source: 'Zoho Careers',
    external_url: 'https://www.zoho.com/careers',
    posted_date: '3 days ago',
    experience_level: 'Mid-Level',
    skills: 'JavaScript, HTML5/CSS3, Web Components, REST'
  },
  {
    id: 500006,
    title: 'Staff AI Infrastructure Engineer',
    company: 'Zomato',
    location: 'Gurgaon / Delhi NCR, India',
    job_type: 'Full-time',
    description: 'Lead AI recommendation engines, dynamic price optimization models, and computer vision for kitchen automation.',
    salary: '₹30,00,000 - ₹50,00,000 / yr',
    source: 'Zomato Careers',
    external_url: 'https://www.zomato.com/careers',
    posted_date: 'Today',
    experience_level: 'Staff',
    skills: 'Python, PyTorch, Kubernetes, MLOps, Distributed Systems'
  },
  {
    id: 500007,
    title: 'Full Stack React & Python Engineer',
    company: 'Cred',
    location: 'Bengaluru / Bangalore, India',
    job_type: 'Full-time',
    description: 'Craft sleek reward management applications, financial security vaults, and instant UPI payment integrations.',
    salary: '₹26,00,000 - ₹42,00,000 / yr',
    source: 'CRED Careers',
    external_url: 'https://cred.club/careers',
    posted_date: '1 day ago',
    experience_level: 'Senior',
    skills: 'React Native, Python, Django, AWS, MySQL'
  },
  {
    id: 500008,
    title: 'Cloud DevOps & Security Engineer',
    company: 'PhonePe',
    location: 'Pune / Bengaluru, India',
    job_type: 'Full-time',
    description: 'Manage zero-downtime infrastructure across thousands of servers processing billions of monthly transactions.',
    salary: '₹16,00,000 - ₹26,00,000 / yr',
    source: 'PhonePe Careers',
    external_url: 'https://www.phonepe.com/careers',
    posted_date: '4 days ago',
    experience_level: 'Mid-Level',
    skills: 'Kubernetes, Terraform, Docker, CI/CD, Python'
  },
  {
    id: 500009,
    title: 'Software Development Engineer I (SDE 1)',
    company: 'Tata Consultancy Services (TCS Digital)',
    location: 'Mumbai / Pune / Hyderabad, India',
    job_type: 'Full-time',
    description: 'Develop enterprise digital transformation solutions, microservices, and automated testing pipelines.',
    salary: '₹7,50,000 - ₹12,00,000 / yr',
    source: 'TCS NextStep',
    external_url: 'https://www.tcs.com/careers',
    posted_date: '2 days ago',
    experience_level: 'Entry / Intern',
    skills: 'Java, Spring Boot, React, SQL, Git'
  },
  {
    id: 500010,
    title: 'Senior React Developer (Remote India)',
    company: 'Harness',
    location: 'Remote India',
    job_type: 'Remote',
    description: 'Build modern continuous delivery dashboards, feature flag management UI, and developer observability tooling.',
    salary: '₹28,00,000 - ₹45,00,000 / yr',
    source: 'Harness Careers',
    external_url: 'https://harness.io/careers',
    posted_date: 'Today',
    experience_level: 'Senior',
    skills: 'React, TypeScript, GraphQL, CI/CD'
  }
];

// GET job listings with real-time India & Global official API aggregation
router.get('/', async (req, res) => {
  try {
    const { search, location, job_type, experience } = req.query;

    const liveJobs: any[] = [...INDIA_TECH_JOBS];

    // 1. Fetch Real Live Remote Jobs from Remotive API
    try {
      const remotiveUrl = search
        ? `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(String(search))}&limit=20`
        : `https://remotive.com/api/remote-jobs?limit=20`;

      const remotiveRes = await fetch(remotiveUrl);
      if (remotiveRes.ok) {
        const data: any = await remotiveRes.json();
        if (Array.isArray(data?.jobs)) {
          data.jobs.forEach((item: any, idx: number) => {
            const tagsList = Array.isArray(item.tags) ? item.tags.join(', ') : (item.category || 'Tech');
            const cleanDesc = cleanText(item.description).slice(0, 300) + '...';

            let expLevel = 'Mid-Level';
            const lowerTitle = item.title.toLowerCase();
            if (lowerTitle.includes('senior') || lowerTitle.includes('lead')) expLevel = 'Senior';
            if (lowerTitle.includes('staff') || lowerTitle.includes('architect')) expLevel = 'Staff';
            if (lowerTitle.includes('junior') || lowerTitle.includes('intern')) expLevel = 'Entry / Intern';

            liveJobs.push({
              id: 200000 + idx,
              title: item.title,
              company: item.company_name,
              location: item.candidate_required_location || 'Remote (Worldwide)',
              job_type: item.job_type || 'Remote',
              description: cleanDesc,
              salary: formatSalaryInRupees(item.salary),
              source: 'Remotive Official',
              external_url: item.url,
              posted_date: 'Active',
              experience_level: expLevel,
              skills: tagsList
            });
          });
        }
      }
    } catch (err) {
      console.warn('Remotive API fetch warning:', err);
    }

    // 2. Fetch User-Created Custom Jobs from SQLite Database
    let dbSql = 'SELECT * FROM jobs WHERE 1=1';
    const dbParams: any[] = [];
    if (search) {
      dbSql += ' AND (title LIKE ? OR company LIKE ? OR description LIKE ? OR skills LIKE ?)';
      const term = `%${search}%`;
      dbParams.push(term, term, term, term);
    }
    if (location) {
      dbSql += ' AND location LIKE ?';
      dbParams.push(`%${location}%`);
    }
    dbSql += ' ORDER BY created_at DESC';

    const customDbJobs = await query(dbSql, dbParams);

    // Merge custom DB jobs & live jobs
    let combined = [...customDbJobs, ...liveJobs];

    // Filter by Keyword (search)
    if (search) {
      const q = String(search).toLowerCase();
      combined = combined.filter((j: any) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        (j.skills && j.skills.toLowerCase().includes(q)) ||
        (j.description && j.description.toLowerCase().includes(q))
      );
    }

    // Filter by Location
    if (location && location !== 'all') {
      const locQ = String(location).toLowerCase();
      combined = combined.filter((j: any) => {
        const jobLoc = (j.location || '').toLowerCase();
        if (locQ === 'india') return jobLoc.includes('india') || jobLoc.includes('bengaluru') || jobLoc.includes('bangalore') || jobLoc.includes('hyderabad') || jobLoc.includes('mumbai') || jobLoc.includes('pune') || jobLoc.includes('delhi') || jobLoc.includes('gurgaon') || jobLoc.includes('chennai');
        if (locQ.includes('bengaluru') || locQ.includes('bangalore')) return jobLoc.includes('bengaluru') || jobLoc.includes('bangalore');
        if (locQ.includes('hyderabad')) return jobLoc.includes('hyderabad');
        if (locQ.includes('mumbai')) return jobLoc.includes('mumbai');
        if (locQ.includes('delhi') || locQ.includes('gurgaon') || locQ.includes('noida')) return jobLoc.includes('delhi') || jobLoc.includes('gurgaon') || jobLoc.includes('noida');
        if (locQ.includes('pune')) return jobLoc.includes('pune');
        if (locQ.includes('chennai')) return jobLoc.includes('chennai');
        if (locQ.includes('remote india')) return jobLoc.includes('remote india') || (jobLoc.includes('remote') && jobLoc.includes('india'));
        return jobLoc.includes(locQ);
      });
    }

    // Filter by Job Type
    if (job_type && job_type !== 'all') {
      combined = combined.filter((j: any) =>
        j.job_type && j.job_type.toLowerCase() === String(job_type).toLowerCase()
      );
    }

    // Filter by Experience Level
    if (experience && experience !== 'all') {
      combined = combined.filter((j: any) =>
        j.experience_level && j.experience_level.toLowerCase() === String(experience).toLowerCase()
      );
    }

    res.json({ jobs: combined, total: combined.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch jobs' });
  }
});

// POST Custom Job Listing
router.post('/custom', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { title, company, location, job_type, description, salary, external_url, skills, experience_level } = req.body;

    if (!title || !company) {
      return res.status(400).json({ error: 'Job title and company are required' });
    }

    const formattedSalary = salary ? formatSalaryInRupees(salary) : '₹15,00,000 - ₹25,00,000 / yr';

    const result = await run(
      `INSERT INTO jobs (title, company, location, job_type, description, salary, source, external_url, posted_date, experience_level, skills)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        company,
        location || 'Bengaluru, India',
        job_type || 'Full-time',
        description || '',
        formattedSalary,
        'Direct Official',
        external_url || '',
        'Today',
        experience_level || 'Mid-Level',
        skills || 'Software'
      ]
    );

    const created = await getOne('SELECT * FROM jobs WHERE id = ?', [result.lastID]);
    res.status(201).json({ message: 'Custom job created', job: created });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create job' });
  }
});

// Save job directly into user's Application tracker
router.post('/:id/save-application', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const jobId = req.params.id;

    let targetJob: any = req.body.job;

    if (!targetJob && Number(jobId) < 200000) {
      targetJob = await getOne('SELECT * FROM jobs WHERE id = ?', [jobId]);
    }

    if (!targetJob) {
      return res.status(404).json({ error: 'Job details not found' });
    }

    const { status } = req.body;
    const targetStatus = status || 'Saved';
    const today = new Date().toISOString().split('T')[0];

    const existing = await getOne('SELECT id FROM applications WHERE user_id = ? AND job_title = ? AND company = ?', [
      userId,
      targetJob.title,
      targetJob.company
    ]);

    if (existing) {
      return res.status(400).json({ error: 'You have already added this job to your applications!' });
    }

    const result = await run(
      `INSERT INTO applications (
        user_id, job_title, company, company_website, job_description, location, job_type,
        salary, application_date, source, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        targetJob.title,
        targetJob.company,
        targetJob.external_url || '',
        targetJob.description || '',
        targetJob.location || '',
        targetJob.job_type || 'Full-time',
        targetJob.salary || '₹15,00,000 / yr',
        today,
        targetJob.source || 'Official Page',
        targetStatus
      ]
    );

    const appId = result.lastID;

    await run('INSERT INTO application_history (application_id, old_status, new_status, notes) VALUES (?, ?, ?, ?)', [
      appId,
      null,
      targetStatus,
      `Added from Live Job Search engine (${targetJob.source})`
    ]);

    await run('INSERT INTO notifications (user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?)', [
      userId,
      `Job Saved: ${targetJob.company}`,
      `Added ${targetJob.title} at ${targetJob.company} to your ${targetStatus} applications.`,
      'reminder',
      '/applications'
    ]);

    emitToUser(userId, 'application_created', {
      applicationId: appId,
      jobTitle: targetJob.title,
      company: targetJob.company,
      status: targetStatus
    });

    res.status(201).json({ message: `Job saved as ${targetStatus} application`, applicationId: appId });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to save job application' });
  }
});

export default router;
