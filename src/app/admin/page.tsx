import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AdminDashboardClient from './AdminDashboardClient'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: faculty } = await supabase
    .from('faculty')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  if (!faculty || (faculty.role !== 'admin' && faculty.role !== 'hod')) redirect('/dashboard')
  if (faculty.password_changed === false) redirect('/change-password')

  const isHOD = faculty.role === 'hod'
  const hodDept = faculty.department

  // Fetch all faculty first to handle HOD filtering
  let facultyQuery = supabase.from('faculty').select('*, achievements(*)').order('reward_points', { ascending: false })
  if (isHOD) {
    facultyQuery = facultyQuery.eq('department', hodDept)
  }
  const { data: allFaculty } = await facultyQuery

  const facultyIds = allFaculty?.map(f => f.id) || []

  // Fetch students handling Supabase 1000 limit
  let allStudents: any[] = []
  let from = 0
  let step = 1000
  while (true) {
    let studentQuery = supabase
      .from('students')
      .select('*, faculty:assigned_faculty_id(id, full_name, department)')
      .order('full_name')
      .range(from, from + step - 1)
    
    if (isHOD) {
      studentQuery = studentQuery.in('assigned_faculty_id', facultyIds)
    }

    const { data: chunk } = await studentQuery
      
    if (chunk && chunk.length > 0) {
      allStudents.push(...chunk)
      if (chunk.length < step) break
      from += step
    } else {
      break
    }
  }

  // Filter stats for HOD
  let statsQueries: any[] = []
  if (isHOD) {
    statsQueries = [
      supabase.from('students').select('*', { count: 'exact', head: true }).in('assigned_faculty_id', facultyIds),
      supabase.from('students').select('*', { count: 'exact', head: true }).in('assigned_faculty_id', facultyIds).eq('status', 'New'),
      supabase.from('students').select('*', { count: 'exact', head: true }).in('assigned_faculty_id', facultyIds).neq('status', 'New'),
      supabase.from('students').select('*', { count: 'exact', head: true }).in('assigned_faculty_id', facultyIds).in('status', ['Registered', 'Admitted']),
      supabase.from('consultations').select('*', { count: 'exact', head: true }).in('faculty_id', facultyIds),
    ]
  } else {
    statsQueries = [
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'New'),
      supabase.from('students').select('*', { count: 'exact', head: true }).neq('status', 'New'),
      supabase.from('students').select('*', { count: 'exact', head: true }).in('status', ['Registered', 'Admitted']),
      supabase.from('consultations').select('*', { count: 'exact', head: true }),
    ]
  }

  const [
    { count: totalStudents },
    { count: newStudents },
    { count: consultedStudents },
    { count: convertedStudents },
    { count: totalConsultations },
  ] = await Promise.all(statsQueries)

  return (
    <AdminDashboardClient
      adminFaculty={JSON.parse(JSON.stringify(faculty))}
      initialStudents={JSON.parse(JSON.stringify(allStudents))}
      allFaculty={JSON.parse(JSON.stringify(allFaculty || []))}
      stats={JSON.parse(JSON.stringify({
        totalStudents: totalStudents || 0,
        newStudents: newStudents || 0,
        consultedStudents: consultedStudents || 0,
        convertedStudents: convertedStudents || 0,
        totalConsultations: totalConsultations || 0,
        totalFaculty: allFaculty?.length || 0,
        conversionRate: totalStudents ? Math.round(((convertedStudents || 0) / totalStudents) * 100) : 0,
      }))}
    />
  )
}
