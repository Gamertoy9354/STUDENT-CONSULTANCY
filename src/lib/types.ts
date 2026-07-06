export type Faculty = {
  id: string
  full_name: string
  email: string
  role: 'faculty' | 'admin'
  department: string | null
  mobile: string | null
  total_assigned: number
  total_consultations: number
  leads_converted: number
  reward_points: number
  created_at: string
  last_login: string | null
  auth_user_id: string | null
}

export type Student = {
  id: string
  full_name: string
  school_name: string | null
  student_mobile: string | null
  parent_mobile: string | null
  caste_category: string | null
  stream: 'A' | 'B' | null
  interested_branch: string | null
  assigned_faculty_id: string | null
  status: 'New' | 'Contacted' | 'Interested' | 'Registered' | 'Admitted'
  total_consultations: number
  last_consulted_at: string | null
  last_consulted_by: string | null
  created_at: string
  updated_at: string
  faculty?: Faculty
}

export type Consultation = {
  id: string
  student_id: string
  faculty_id: string
  consulted_at: string
  call_status: 'Interested' | 'Not Interested' | 'Callback' | 'Registered' | 'Admitted' | 'No Answer' | 'Other' | null
  interest_level: 'High' | 'Medium' | 'Low' | null
  remarks: string | null
  language_used: 'Gujarati' | 'Hindi' | 'English'
  next_followup_date: string | null
  points_earned: number
  created_at: string
  student?: Student
  faculty?: Faculty
}

export type Achievement = {
  id: string
  faculty_id: string
  achievement_type: string
  milestone_name: string | null
  points_required: number | null
  unlocked_at: string
  certificate_url: string | null
}

export type RewardMilestone = {
  id: string
  milestone_name: string
  points_required: number
  reward_type: string
  badge_color: string | null
  description: string | null
}

export type StudentFilter = {
  stream?: 'A' | 'B' | ''
  status?: string
  faculty_id?: string
  branch?: string
  search?: string
}
