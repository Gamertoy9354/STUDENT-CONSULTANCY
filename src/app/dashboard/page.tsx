import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import FacultyDashboardClient from './FacultyDashboardClient'

export default async function FacultyDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: faculty } = await supabase
    .from('faculty')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (!faculty) redirect('/login')
  if (faculty.password_changed === false) redirect('/change-password')
  if (faculty.role === 'admin') redirect('/admin')

  const { data: students } = await supabase
    .from('students')
    .select('*')
    .eq('assigned_faculty_id', faculty.id)
    .order('full_name')

  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('faculty_id', faculty.id)
    .order('unlocked_at', { ascending: false })

  const { data: milestones } = await supabase
    .from('reward_milestones')
    .select('*')
    .order('points_required')

  return (
    <FacultyDashboardClient
      faculty={faculty}
      initialStudents={students || []}
      achievements={achievements || []}
      milestones={milestones || []}
    />
  )
}
