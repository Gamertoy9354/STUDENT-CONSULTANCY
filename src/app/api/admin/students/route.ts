import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('faculty')
    .select('role, department')
    .eq('auth_user_id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'hod')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const sp       = req.nextUrl.searchParams
  const page     = Math.max(1, parseInt(sp.get('page') || '1'))
  const pageSize = Math.min(150, parseInt(sp.get('pageSize') || '100'))
  const search   = sp.get('search')?.trim() || ''
  const status   = sp.get('status')?.trim() || ''
  const stream   = sp.get('stream')?.trim() || ''
  const faculty  = sp.get('faculty')?.trim() || ''   // faculty id or '__unassigned__'
  const withRemarks = sp.get('withRemarks') === 'true' // full export mode

  let q = supabase
    .from('students')
    .select(
      'id, full_name, school_name, student_mobile, parent_mobile, caste_category, stream, interested_branch, status, total_consultations, last_consulted_at, assigned_faculty_id, faculty:assigned_faculty_id(id, full_name, department)',
      { count: 'exact' }
    )
    .order('full_name')
    .range((page - 1) * pageSize, page * pageSize - 1)

  // HOD restriction: only their dept's faculty students
  if (profile.role === 'hod') {
    const { data: deptFaculty } = await supabase
      .from('faculty')
      .select('id')
      .eq('department', profile.department)
    const ids = deptFaculty?.map(f => f.id) || []
    q = q.in('assigned_faculty_id', ids)
  }

  if (search) {
    q = q.or(`full_name.ilike.%${search}%,school_name.ilike.%${search}%,student_mobile.ilike.%${search}%,interested_branch.ilike.%${search}%`)
  }
  if (status)  q = q.eq('status', status)
  if (stream)  q = q.ilike('stream', `%${stream}%`)
  if (faculty === '__unassigned__') q = q.is('assigned_faculty_id', null)
  else if (faculty)                 q = q.eq('assigned_faculty_id', faculty)

  const { data: students, count, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Fetch consultation remarks for this page of students ─────────────────
  const studentIds = (students || []).map(s => s.id)
  let remarksMap: Record<string, { latest: string; history: string }> = {}

  if (studentIds.length > 0) {
    const { data: consultations } = await supabase
      .from('consultations')
      .select('student_id, consulted_at, remarks, old_status, new_status')
      .in('student_id', studentIds)
      .not('remarks', 'is', null)
      .order('consulted_at', { ascending: false })

    if (consultations) {
      // Group by student_id
      const grouped: Record<string, typeof consultations> = {}
      for (const c of consultations) {
        if (!grouped[c.student_id]) grouped[c.student_id] = []
        grouped[c.student_id].push(c)
      }

      for (const [sid, cons] of Object.entries(grouped)) {
        const latest  = cons[0]?.remarks || ''
        const history = cons
          .map(c => `[${new Date(c.consulted_at).toLocaleDateString('en-IN')}] ${c.old_status}→${c.new_status}: ${c.remarks || '-'}`)
          .join(' | ')
        remarksMap[sid] = { latest, history }
      }
    }
  }

  // Attach remarks to each student
  const studentsWithRemarks = (students || []).map(s => ({
    ...s,
    latest_remark:  remarksMap[s.id]?.latest  || '',
    remarks_history: remarksMap[s.id]?.history || '',
  }))

  return NextResponse.json({
    students:   studentsWithRemarks,
    total:      count ?? 0,
    page,
    pageSize,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  })
}
