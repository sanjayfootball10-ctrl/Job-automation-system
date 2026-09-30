import sqlite3 from 'sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const dbPath = path.resolve(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

export function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows as T[]);
    });
  });
}

export function getOne<T = any>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row as T);
    });
  });
}

export function run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

export async function initDb() {
  return new Promise<void>((resolve, reject) => {
    db.serialize(async () => {
      try {
        // 1. Users Table
        await run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            phone TEXT,
            location TEXT,
            skills TEXT,
            education TEXT,
            experience TEXT,
            linkedin_url TEXT,
            github_url TEXT,
            portfolio_url TEXT,
            preferred_role TEXT,
            preferred_location TEXT,
            expected_salary TEXT,
            role TEXT DEFAULT 'user',
            email_verified INTEGER DEFAULT 1,
            reset_token TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 2. Applications Table
        await run(`
          CREATE TABLE IF NOT EXISTS applications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            job_title TEXT NOT NULL,
            company TEXT NOT NULL,
            company_website TEXT,
            job_description TEXT,
            location TEXT,
            job_type TEXT DEFAULT 'Full-time',
            salary TEXT,
            application_date TEXT,
            deadline TEXT,
            source TEXT DEFAULT 'LinkedIn',
            status TEXT DEFAULT 'Applied',
            contact_person TEXT,
            contact_email TEXT,
            notes TEXT,
            resume_id INTEGER,
            cover_letter_id INTEGER,
            kanban_order INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // 3. Application History Table
        await run(`
          CREATE TABLE IF NOT EXISTS application_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            application_id INTEGER NOT NULL,
            old_status TEXT,
            new_status TEXT NOT NULL,
            notes TEXT,
            changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
          )
        `);

        // 4. Resumes Table
        await run(`
          CREATE TABLE IF NOT EXISTS resumes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            file_path TEXT,
            file_type TEXT DEFAULT 'pdf',
            is_default INTEGER DEFAULT 0,
            content TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // 5. Cover Letters Table
        await run(`
          CREATE TABLE IF NOT EXISTS cover_letters (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // 6. Interviews Table
        await run(`
          CREATE TABLE IF NOT EXISTS interviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            application_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            interview_date TEXT NOT NULL,
            interview_type TEXT DEFAULT 'Video',
            meeting_url TEXT,
            notes TEXT,
            status TEXT DEFAULT 'Scheduled',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // 7. Notifications Table
        await run(`
          CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            type TEXT DEFAULT 'reminder',
            is_read INTEGER DEFAULT 0,
            link TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // 8. Automation Rules Table
        await run(`
          CREATE TABLE IF NOT EXISTS automation_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            rule_type TEXT NOT NULL,
            enabled INTEGER DEFAULT 1,
            days_threshold INTEGER DEFAULT 7,
            configuration TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          )
        `);

        // 9. Jobs Table
        await run(`
          CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            job_type TEXT DEFAULT 'Full-time',
            description TEXT,
            salary TEXT,
            source TEXT DEFAULT 'Direct',
            external_url TEXT,
            posted_date TEXT,
            experience_level TEXT DEFAULT 'Mid-Level',
            skills TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // 10. Activity Logs Table
        await run(`
          CREATE TABLE IF NOT EXISTS activity_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            action TEXT NOT NULL,
            details TEXT,
            ip_address TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Seed initial default demo user if table empty
        await seedInitialData();

        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
}

export async function seedUserDataIfEmpty(userId: number) {
  try {
    const appCount = await getOne<{ count: number }>('SELECT COUNT(*) as count FROM applications WHERE user_id = ?', [userId]);
    if (appCount && appCount.count > 0) return; // User already has data

    console.log(`🌱 Populating sample tracking applications for user #${userId}...`);

    // 1. Ensure Resumes
    let resume1Id: number | null = null;
    let resume2Id: number | null = null;
    const existingResumes = await query('SELECT id FROM resumes WHERE user_id = ?', [userId]);

    if (existingResumes.length === 0) {
      const r1 = await run(
        `INSERT INTO resumes (user_id, name, file_path, file_type, is_default, content)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          'Master_Software_Engineer_Resume.pdf',
          '/uploads/resumes/Master_Software_Engineer_Resume.pdf',
          'pdf',
          1,
          'Senior Software Engineer with 5+ years experience building high-scale React, Node.js, and Cloud microservices.'
        ]
      );
      resume1Id = r1.lastID;

      const r2 = await run(
        `INSERT INTO resumes (user_id, name, file_path, file_type, is_default, content)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          'Frontend_React_Specialist_Resume.pdf',
          '/uploads/resumes/Frontend_React_Specialist_Resume.pdf',
          'pdf',
          0,
          'UI/UX Architecture Specialist expert in React 19, TypeScript, Next.js, and Web Vitals optimization.'
        ]
      );
      resume2Id = r2.lastID;
    } else {
      resume1Id = existingResumes[0].id;
    }

    // 2. Ensure Cover Letters
    let cover1Id: number | null = null;
    let cover2Id: number | null = null;
    const existingCovers = await query('SELECT id FROM cover_letters WHERE user_id = ?', [userId]);

    if (existingCovers.length === 0) {
      const c1 = await run(
        `INSERT INTO cover_letters (user_id, title, content)
         VALUES (?, ?, ?)`,
        [
          userId,
          'General Tech Cover Letter',
          `Dear Hiring Team,\n\nI am thrilled to submit my application. With extensive experience architecting user-centric web applications and managing scalable backend APIs, I am confident in my ability to drive high-impact outcomes for your team.\n\nLooking forward to connecting.\n\nBest regards.`
        ]
      );
      cover1Id = c1.lastID;

      const c2 = await run(
        `INSERT INTO cover_letters (user_id, title, content)
         VALUES (?, ?, ?)`,
        [
          userId,
          'Razorpay Fintech Pitch',
          `Dear Razorpay Engineering Team,\n\nAs a passionate developer building financial dashboard tools, I am excited about the Senior Full Stack Engineer role. My background in React, TypeScript, and microservices aligns directly with your platform's scale.\n\nWarm regards.`
        ]
      );
      cover2Id = c2.lastID;
    } else {
      cover1Id = existingCovers[0].id;
    }

    // Dates
    const today = new Date().toISOString().split('T')[0];
    const dateSub7 = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const dateSub14 = new Date(Date.now() - 14 * 86400000).toISOString().split('T')[0];
    const dateSub30 = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const datePlus3 = new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0];
    const datePlus5 = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];

    // 3. Applications
    const app1 = await run(
      `INSERT INTO applications (user_id, job_title, company, company_website, job_description, location, job_type, salary, application_date, deadline, source, status, contact_person, contact_email, notes, resume_id, cover_letter_id, kanban_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'Senior Full Stack Engineer',
        'Razorpay',
        'https://razorpay.com/jobs',
        'Build core checkout payment gateway, merchant analytics dashboard, and microservices.',
        'Bengaluru / Bangalore, India',
        'Full-time',
        '₹24,00,000 - ₹35,00,000 / yr',
        dateSub14,
        datePlus3,
        'Razorpay Careers',
        'Interview',
        'Sarah Jenkins',
        'sjenkins@razorpay.com',
        'Passed technical screening round! System design interview scheduled next.',
        resume1Id,
        cover2Id || cover1Id,
        0
      ]
    );

    const app2 = await run(
      `INSERT INTO applications (user_id, job_title, company, company_website, job_description, location, job_type, salary, application_date, deadline, source, status, contact_person, contact_email, notes, resume_id, cover_letter_id, kanban_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'Backend Systems Engineer',
        'Swiggy',
        'https://careers.swiggy.com',
        'Architect real-time order tracking, dispatch routing, and microservices.',
        'Bengaluru / Bangalore, India',
        'Full-time',
        '₹22,00,000 - ₹30,00,000 / yr',
        dateSub30,
        datePlus5,
        'Swiggy Careers',
        'Offer',
        'Michael Chang',
        'm.chang@swiggy.com',
        'Received formal offer letter! Reviewing compensation & equity package.',
        resume1Id,
        cover1Id,
        0
      ]
    );

    const app3 = await run(
      `INSERT INTO applications (user_id, job_title, company, company_website, job_description, location, job_type, salary, application_date, deadline, source, status, contact_person, contact_email, notes, resume_id, cover_letter_id, kanban_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'UI Architect',
        'Flipkart',
        'https://careers.flipkart.com',
        'Architect responsive e-commerce web platform with focus on core web vitals.',
        'Bengaluru / Bangalore, India',
        'Full-time',
        '₹25,00,000 - ₹38,00,000 / yr',
        dateSub7,
        datePlus3,
        'Referral',
        'Under Review',
        'David Miller',
        'david.m@flipkart.com',
        'Referred by Senior Tech Lead. Hiring Manager evaluating portfolio.',
        resume2Id || resume1Id,
        cover1Id,
        0
      ]
    );

    const app4 = await run(
      `INSERT INTO applications (user_id, job_title, company, company_website, job_description, location, job_type, salary, application_date, deadline, source, status, contact_person, contact_email, notes, resume_id, cover_letter_id, kanban_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'Senior Software Engineer',
        'Postman',
        'https://www.postman.com/careers',
        'Build collaborative API platform, mock servers, and WebSocket protocol tools.',
        'Hyderabad / Remote India',
        'Remote',
        '₹28,00,000 - ₹42,00,000 / yr',
        dateSub7,
        '',
        'Company Portal',
        'Applied',
        'Hiring Team',
        'careers@postman.com',
        'Applied directly on official career portal.',
        resume1Id,
        cover1Id,
        0
      ]
    );

    const app5 = await run(
      `INSERT INTO applications (user_id, job_title, company, company_website, job_description, location, job_type, salary, application_date, deadline, source, status, contact_person, contact_email, notes, resume_id, cover_letter_id, kanban_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'AI Infrastructure Engineer',
        'Zomato',
        'https://www.zomato.com/careers',
        'Lead AI recommendation engines, dynamic price optimization models, and computer vision.',
        'Gurgaon / Delhi NCR, India',
        'Full-time',
        '₹30,00,000 - ₹50,00,000 / yr',
        today,
        datePlus5,
        'Direct Official',
        'Saved',
        'Jessica Vance',
        'jessica@zomato.com',
        'Saved for weekend review before applying.',
        resume1Id,
        cover1Id,
        0
      ]
    );

    const app6 = await run(
      `INSERT INTO applications (user_id, job_title, company, company_website, job_description, location, job_type, salary, application_date, deadline, source, status, contact_person, contact_email, notes, resume_id, cover_letter_id, kanban_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'Full Stack React Engineer',
        'CRED',
        'https://cred.club/careers',
        'Craft sleek reward management apps, financial security vaults, and instant UPI integrations.',
        'Bengaluru / Bangalore, India',
        'Full-time',
        '₹26,00,000 - ₹40,00,000 / yr',
        dateSub14,
        '',
        'LinkedIn',
        'Applied',
        'Recruiting Team',
        'jobs@cred.club',
        'Submitted application via LinkedIn 1-click.',
        resume1Id,
        cover1Id,
        0
      ]
    );

    const app7 = await run(
      `INSERT INTO applications (user_id, job_title, company, company_website, job_description, location, job_type, salary, application_date, deadline, source, status, contact_person, contact_email, notes, resume_id, cover_letter_id, kanban_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'Cloud DevOps Engineer',
        'PhonePe',
        'https://www.phonepe.com/careers',
        'Manage high-availability cloud infrastructure processing millions of daily transactions.',
        'Pune / Bengaluru, India',
        'Full-time',
        '₹18,00,000 - ₹26,00,000 / yr',
        dateSub30,
        '',
        'Indeed',
        'Rejected',
        'Talent Team',
        'careers@phonepe.com',
        'Role closed following internal candidate transfer.',
        resume1Id,
        cover1Id,
        0
      ]
    );

    // 4. Application History
    await run(
      `INSERT INTO application_history (application_id, old_status, new_status, notes, changed_at) VALUES (?, ?, ?, ?, ?)`,
      [app1.lastID, 'Saved', 'Applied', 'Submitted resume and cover letter via company portal', dateSub14]
    );
    await run(
      `INSERT INTO application_history (application_id, old_status, new_status, notes, changed_at) VALUES (?, ?, ?, ?, ?)`,
      [app1.lastID, 'Applied', 'Under Review', 'Recruiter phone screening completed', dateSub7]
    );
    await run(
      `INSERT INTO application_history (application_id, old_status, new_status, notes, changed_at) VALUES (?, ?, ?, ?, ?)`,
      [app1.lastID, 'Under Review', 'Interview', 'Scheduled Technical System Design interview', today]
    );

    await run(
      `INSERT INTO application_history (application_id, old_status, new_status, notes, changed_at) VALUES (?, ?, ?, ?, ?)`,
      [app2.lastID, 'Applied', 'Interview', 'Passed final architect interview round', dateSub14]
    );
    await run(
      `INSERT INTO application_history (application_id, old_status, new_status, notes, changed_at) VALUES (?, ?, ?, ?, ?)`,
      [app2.lastID, 'Interview', 'Offer', 'Received formal written offer letter', dateSub7]
    );

    // 5. Scheduled Interview for Razorpay
    await run(
      `INSERT INTO interviews (application_id, user_id, interview_date, interview_type, meeting_url, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        app1.lastID,
        userId,
        `${datePlus3}T14:00`,
        'Technical Video',
        'https://meet.google.com/abc-defg-hij',
        'System design interview focusing on distributed cache and rate limiters.',
        'Scheduled'
      ]
    );

    // 6. Automation Rules
    const existingRules = await query('SELECT id FROM automation_rules WHERE user_id = ?', [userId]);
    if (existingRules.length === 0) {
      await run(`INSERT INTO automation_rules (user_id, rule_type, enabled, days_threshold, configuration) VALUES (?, ?, ?, ?, ?)`, [userId, 'pending_reminder', 1, 7, '{"message": "Notify if application pending > 7 days"}']);
      await run(`INSERT INTO automation_rules (user_id, rule_type, enabled, days_threshold, configuration) VALUES (?, ?, ?, ?, ?)`, [userId, 'interview_reminder', 1, 1, '{"message": "Send alert 24h prior to interview"}']);
      await run(`INSERT INTO automation_rules (user_id, rule_type, enabled, days_threshold, configuration) VALUES (?, ?, ?, ?, ?)`, [userId, 'deadline_reminder', 1, 3, '{"message": "Alert 3 days before deadline"}']);
      await run(`INSERT INTO automation_rules (user_id, rule_type, enabled, days_threshold, configuration) VALUES (?, ?, ?, ?, ?)`, [userId, 'followup_reminder', 1, 10, '{"message": "Suggest follow-up email if no update for 10 days"}']);
    }

    // 7. Initial Notifications
    await run(
      `INSERT INTO notifications (user_id, title, message, type, is_read, link) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'Upcoming Interview: Razorpay',
        'Technical System Design interview with Razorpay scheduled for ' + datePlus3 + ' at 2:00 PM.',
        'interview',
        0,
        '/applications'
      ]
    );
    await run(
      `INSERT INTO notifications (user_id, title, message, type, is_read, link) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'Offer Letter Received: Swiggy',
        'Swiggy has extended a formal offer for Backend Systems Engineer!',
        'status',
        0,
        '/applications'
      ]
    );
    await run(
      `INSERT INTO notifications (user_id, title, message, type, is_read, link) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        userId,
        'Application Deadline Nearing: Flipkart',
        'Deadline for Flipkart UI Architect application is in 3 days.',
        'deadline',
        0,
        '/applications'
      ]
    );

    // 8. Activity Log
    await run(`INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (?, ?, ?, ?)`, [userId, 'USER_DATA_SEEDED', 'Populated sample applications', '127.0.0.1']);

    console.log(`✅ Sample tracking applications successfully created for user #${userId}!`);
  } catch (err) {
    console.error('Error seeding user sample data:', err);
  }
}

async function seedInitialData() {
  const existingUser = await getOne('SELECT id FROM users LIMIT 1');
  if (existingUser) return;

  console.log('Seeding initial database...');

  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);

  const demoUser = await run(
    `INSERT INTO users (name, email, password_hash, phone, location, skills, education, experience, linkedin_url, github_url, portfolio_url, preferred_role, preferred_location, expected_salary, role)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      'Alex Morgan',
      'alex@example.com',
      passwordHash,
      '+91 98765 43210',
      'Bengaluru, India',
      'React, TypeScript, Node.js, Express, PostgreSQL, Tailwind CSS, Python',
      'B.Tech Computer Science - IIT Bangalore',
      'Senior Full Stack Engineer (5+ yrs experience)',
      'https://linkedin.com/in/alexmorgan',
      'https://github.com/alexmorgan',
      'https://alexmorgan.dev',
      'Senior Software Engineer',
      'Bengaluru / Remote',
      '₹25,00,000 - ₹35,00,000',
      'user'
    ]
  );

  const userId = demoUser.lastID;

  await run(
    `INSERT INTO users (name, email, password_hash, phone, location, role)
     VALUES (?, ?, ?, ?, ?, ?)`,
    ['Admin User', 'admin@example.com', adminPasswordHash, '+91 99999 00000', 'New York, NY', 'admin']
  );

  await seedUserDataIfEmpty(userId);
}
