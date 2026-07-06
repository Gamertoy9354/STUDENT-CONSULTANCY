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

  const isHOD   = faculty.role === 'hod'
  const hodDept = faculty.department

  // ── Fetch faculty list ────────────────────────────────────────────────────
  let facultyQuery = supabase
    .from('faculty')
    .select('*, achievements(*)')
    .order('reward_points', { ascending: false })
  if (isHOD) facultyQuery = facultyQuery.eq('department', hodDept)

  const { data: allFaculty } = await facultyQuery
  const facultyIds = allFaculty?.map(f => f.id) || []

  // ── All stat + status count queries run in parallel (HEAD only = zero data transfer) ──
  const scope = (q: any) => isHOD ? q.in('assigned_faculty_id', facultyIds) : q

  const [
    { count: totalStudents },
    { count: newStudents },
    { count: contactedStudents },
    { count: interestedStudents },
    { count: registeredStudents },
    { count: admittedStudents },
    { count: totalConsultations },
  ] = await Promise.all([
    scope(supabase.from('students').select('*', { count: 'exact', head: true })),
    scope(supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'New')),
    scope(supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'Contacted')),
    scope(supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'Interested')),
    scope(supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'Registered')),
    scope(supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'Admitted')),
    isHOD
      ? supabase.from('consultations').select('*', { count: 'exact', head: true }).in('faculty_id', facultyIds)
      : supabase.from('consultations').select('*', { count: 'exact', head: true }),
  ])

  // convertedStudents = Admitted
  const convertedStudents = admittedStudents ?? 0

  return (
    <AdminDashboardClient
      adminFaculty={JSON.parse(JSON.stringify(faculty))}
      allFaculty={JSON.parse(JSON.stringify(allFaculty || []))}
      stats={JSON.parse(JSON.stringify({
        totalStudents:      totalStudents      ?? 0,
        newStudents:        newStudents        ?? 0,
        contactedStudents:  contactedStudents  ?? 0,
        interestedStudents: interestedStudents ?? 0,
        registeredStudents: registeredStudents ?? 0,
        convertedStudents,
        totalConsultations: totalConsultations ?? 0,
        totalFaculty:       allFaculty?.length ?? 0,
        conversionRate: totalStudents
          ? Math.round((convertedStudents / totalStudents) * 100)
          : 0,
      }))}
    />
  )
}
