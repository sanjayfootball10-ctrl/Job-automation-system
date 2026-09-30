export interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  location?: string;
  skills?: string;
  education?: string;
  experience?: string;
  linkedin_url?: string;
  github_url?: string;
  portfolio_url?: string;
  preferred_role?: string;
  preferred_location?: string;
  expected_salary?: string;
  email_verified?: number;
  created_at?: string;
}

export type ApplicationStatus =
  | 'Saved'
  | 'Applied'
  | 'Under Review'
  | 'Shortlisted'
  | 'Interview'
  | 'Offer'
  | 'Rejected'
  | 'Withdrawn';

export type JobType = 'Full-time' | 'Part-time' | 'Internship' | 'Contract' | 'Remote';

export type JobSource =
  | 'LinkedIn'
  | 'Indeed'
  | 'Naukri'
  | 'Company Website'
  | 'Referral'
  | 'Other';

export interface Application {
  id: number;
  user_id: number;
  job_title: string;
  company: string;
  company_website?: string;
  job_description?: string;
  location?: string;
  job_type: JobType;
  salary?: string;
  application_date?: string;
  deadline?: string;
  source: JobSource;
  status: ApplicationStatus;
  contact_person?: string;
  contact_email?: string;
  notes?: string;
  resume_id?: number | null;
  cover_letter_id?: number | null;
  resume_name?: string;
  cover_letter_title?: string;
  kanban_order?: number;
  created_at: string;
  updated_at: string;
}

export interface ApplicationHistory {
  id: number;
  application_id: number;
  old_status?: string | null;
  new_status: string;
  notes?: string;
  changed_at: string;
}

export interface Resume {
  id: number;
  user_id: number;
  name: string;
  file_path?: string;
  file_type?: string;
  is_default: number;
  content?: string;
  created_at: string;
}

export interface CoverLetter {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: number;
  application_id: number;
  user_id: number;
  interview_date: string;
  interview_type: string;
  meeting_url?: string;
  notes?: string;
  status: string;
  job_title?: string;
  company?: string;
  job_location?: string;
  application_status?: string;
  created_at: string;
}

export interface AppNotification {
  id: number;
  user_id: number;
  title: string;
  message: string;
  type: 'interview' | 'deadline' | 'reminder' | 'status' | 'system';
  is_read: number;
  link?: string;
  created_at: string;
}

export interface AutomationRule {
  id: number;
  user_id: number;
  rule_type: 'pending_reminder' | 'interview_reminder' | 'deadline_reminder' | 'followup_reminder';
  enabled: number;
  days_threshold: number;
  configuration?: string;
  created_at: string;
}

export interface JobListing {
  id: number;
  title: string;
  company: string;
  location: string;
  job_type: string;
  description: string;
  salary: string;
  source: string;
  external_url: string;
  posted_date: string;
  experience_level: string;
  skills: string;
}

export interface AnalyticsSummary {
  summary: {
    total: number;
    saved: number;
    applied: number;
    underReview: number;
    shortlisted: number;
    interview: number;
    offer: number;
    rejected: number;
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    rejectionRate: number;
    avgResponseDays: number;
  };
  statusBreakdown: { name: string; value: number }[];
  monthlyData: { month: string; count: number }[];
  sourceData: { source: string; count: number }[];
  companyData: { company: string; count: number }[];
  locationData: { location: string; count: number }[];
}

export interface AdminDashboardData {
  metrics: {
    totalUsers: number;
    activeUsers: number;
    totalApplications: number;
    totalInterviews: number;
    totalResumes: number;
  };
  users: User[];
  logs: {
    id: number;
    user_id: number;
    user_name?: string;
    user_email?: string;
    action: string;
    details: string;
    ip_address?: string;
    created_at: string;
  }[];
}
