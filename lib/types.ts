// Database Models
export interface User {
  id: string
  email: string
  name: string
  college: string
  branch: string
  cgpa: number
  passout_date: string
  chosen_path: string
  created_at?: string
  updated_at?: string
}

export interface Milestone {
  id: string
  user_id: string
  milestone_title: string
  description: string
  due_date: string
  category: string
  status: string
  version: number
  created_at?: string
  updated_at?: string
}

export interface UserSkill {
  user_id: string
  skill_name: string
  confidence: number
  created_at?: string
}

export interface Roadmap {
  id: string
  user_id: string
  title: string
  description: string
  timeline: string
  milestones: Milestone[]
  created_at?: string
  updated_at?: string
}

// DTOs and Request/Response Types
export interface OnboardingProfile {
  name: string
  college: string
  // Current average mark as a percentage (e.g. "64"). Stored in users.cgpa.
  average: string
  // Degree title, e.g. "Accounting and Finance". Stored in users.branch.
  degree: string
  // "Year 1" | "Year 2" | "Final year"
  yearOfStudy: string
  // When the student wants the placement to start, e.g. "Summer 2027"
  placementStart: string
  graduationYear: string
  // Where they are in this recruitment cycle
  applicationStatus: string
  // Relevant experience so far, e.g. "Spring week", "Part-time job"
  experience: string[]
  // Areas of finance they are interested in, e.g. "Audit", "Tax"
  targetSectors: string[]
  // Optional free text, e.g. "Deloitte, BDO, Co-op"
  targetEmployers: string
  // Professional qualification plan: ACA, ACCA, CIMA, CFA, Not sure
  qualificationPlan: string
  skills: Record<string, number>
  dreamFuture: string
  reminderEmail: string
  reminderFreq: string
}

export interface RoadmapGenerationRequest {
  userId: string
  profile: OnboardingProfile
}

export interface RoadmapGenerationResponse {
  roadmap: Roadmap
  message: string
}

// Auth Types
export interface AuthUser {
  id: string
  email: string
  user_metadata?: Record<string, any>
  app_metadata?: Record<string, any>
}

export interface AuthResponse {
  user: AuthUser | null
  error: Error | null
}
