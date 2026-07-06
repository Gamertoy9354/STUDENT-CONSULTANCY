'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function submitConsultation(data: {
  student_id: string
  call_status: string
  interest_level: string
  remarks: string
  language_used: string
  next_followup_date?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: faculty } = await supabase
    .from('faculty')
    .select('id')
    .eq('auth_user_id', user.id)
    .single()

  if (!faculty) return { error: 'Faculty profile not found' }

  // Check for existing consultations for this student by this faculty to avoid duplicate points
  const { data: previousConsultations } = await supabase
    .from('consultations')
    .select('call_status')
    .eq('student_id', data.student_id)
    .eq('faculty_id', faculty.id)

  const previouslyCalled = previousConsultations && previousConsultations.length > 0
  const previouslyInterested = previousConsultations?.some(c => c.call_status === 'Interested')
  const previouslyRegistered = previousConsultations?.some(c => c.call_status === 'Registered')
  const previouslyAdmitted = previousConsultations?.some(c => c.call_status === 'Admitted')

  // Calculate points following new "one-time per milestone" rule
  let points = 0

  // Milestone: Outbound Call (1 Point) - First interaction only
  if (!previouslyCalled) {
    points += 1
  }

  // Milestone: Counseling Success (2 Points) - First time "Interested"
  if (data.call_status === 'Interested' && !previouslyInterested) {
    points += 2
  }

  // Milestone: Registered (5 Points) - First time "Registered"
  if (data.call_status === 'Registered' && !previouslyRegistered) {
    points += 5
  }

  // Milestone: Admission (15 or 25 Points) - First time "Admitted"
  if (data.call_status === 'Admitted' && !previouslyAdmitted) {
    // Fetch student interested branch and faculty department to compare
    const [{ data: st }, { data: fa }] = await Promise.all([
      supabase.from('students').select('interested_branch').eq('id', data.student_id).single(),
      supabase.from('faculty').select('department').eq('id', faculty.id).single()
    ])

    const studentBranch = (st?.interested_branch || '').toLowerCase().trim()
    const facultyDept = (fa?.department || '').toLowerCase().trim()

    // Heuristic match for "Mother Department"
    const isMotherDept = studentBranch && facultyDept && 
      (studentBranch.includes(facultyDept) || facultyDept.includes(studentBranch))

    points += isMotherDept ? 25 : 15
  }

  const { error, data: insertedData } = await supabase.from('consultations').insert({
    student_id: data.student_id,
    faculty_id: faculty.id,
    call_status: data.call_status,
    interest_level: data.interest_level,
    remarks: data.remarks,
    language_used: data.language_used,
    next_followup_date: data.next_followup_date || null,
    points_earned: points,
    consulted_at: new Date().toISOString(),
  }).select().single()

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return { success: true, points_earned: points }
}

export async function getStudentsForFaculty(facultyId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('students')
    .select('*, faculty:assigned_faculty_id(full_name, email)')
    .eq('assigned_faculty_id', facultyId)
    .order('full_name')

  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

export async function getAllStudents(filters?: {
  stream?: string
  status?: string
  faculty_id?: string
  branch?: string
  search?: string
}) {
  const supabase = await createClient()
  
  let query = supabase
    .from('students')
    .select('*, faculty:assigned_faculty_id(id, full_name, email, department)')
    .order('full_name')

  if (filters?.stream) query = query.eq('stream', filters.stream)
  if (filters?.status) query = query.eq('status', filters.status)
  if (filters?.faculty_id) query = query.eq('assigned_faculty_id', filters.faculty_id)
  if (filters?.branch) query = query.ilike('interested_branch', `%${filters.branch}%`)
  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,school_name.ilike.%${filters.search}%,student_mobile.ilike.%${filters.search}%`)
  }

  const { data, error } = await query
  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

export async function getConsultationHistory(studentId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('consultations')
    .select('*, faculty:faculty_id(full_name)')
    .eq('student_id', studentId)
    .order('consulted_at', { ascending: false })

  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

export async function importStudents(students: Array<{
  full_name: string
  school_name?: string
  student_mobile?: string
  parent_mobile?: string
  caste_category?: string
  stream?: string
  interested_branch?: string
  assigned_faculty_name?: string
}>) {
  const supabase = await createClient()

  // Get all faculty for name lookup
  const { data: allFaculty } = await supabase.from('faculty').select('id, full_name')
  const facultyMap = new Map<string, string>()
  allFaculty?.forEach(f => {
    const firstName = f.full_name.split(/[\s.]+/)[0].toLowerCase()
    facultyMap.set(firstName, f.id)
    facultyMap.set(f.full_name.toLowerCase(), f.id)
  })

  // Identify missing faculties that need creation
  const uniqueMissingFaculties = new Map<string, string>()
  students.forEach(s => {
    if (s.assigned_faculty_name) {
      // Apply the same parse logic from our script
      let raw = s.assigned_faculty_name
      let primary = raw.includes(',') ? raw.split(',')[0].trim() :
                    raw.toLowerCase().includes(' and ') ? raw.split(/ and /i)[0].trim() :
                    raw.includes('&') ? raw.split('&')[0].trim() :
                    raw.includes('/') ? raw.split('/')[0].trim() : raw

      let firstName = primary.split(/[\s.]+/)[0].toLowerCase()
      if (['dr', 'dr.', 'mr', 'mr.', 'ms', 'ms.', 'prof', 'prof.'].includes(firstName) && primary.split(/[\s.]+/).length > 1) {
        firstName = primary.split(/[\s.]+/)[1].toLowerCase()
      }
      firstName = firstName.replace(/[^a-z0-9]/g, '')

      if (firstName && !facultyMap.has(firstName) && !uniqueMissingFaculties.has(firstName)) {
        uniqueMissingFaculties.set(firstName, primary)
      }
      
      // Mutate object purely for easy insertion map
      s._parsedFirstName = firstName
    }
  })

  // Auto-create missing faculties using Admin Client
  if (uniqueMissingFaculties.size > 0 && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    for (const [firstName, fullName] of uniqueMissingFaculties.entries()) {
      const email = `${firstName}@rngpit.ac.in`
      const password = `${firstName}@1234`
      
      let userId = null
      const { data: authData, error: authErr } = await adminSupabase.auth.admin.createUser({
        email, password, email_confirm: true
      })

      if (authErr && !authErr.message.includes('already registered')) {
        console.error(`Error auto-creating faculty ${email}:`, authErr)
      }

      userId = authData?.user?.id
      if (!userId) {
        const { data: usersData } = await adminSupabase.auth.admin.listUsers()
        userId = usersData?.users?.find(u => u.email === email)?.id || null
      }

      if (userId) {
        const { data: dbFac } = await adminSupabase.from('faculty').upsert({
          auth_user_id: userId, email, full_name: fullName, role: 'faculty', department: 'Engineering'
        }, { onConflict: 'email' }).select('id').single()

        if (dbFac) {
          facultyMap.set(firstName, dbFac.id)
        }
      }
    }
  }

  const rawStudentsToInsert = students.map((s: any) => ({
    full_name: s.full_name,
    school_name: s.school_name || null,
    student_mobile: s.student_mobile || null,
    parent_mobile: s.parent_mobile || null,
    caste_category: s.caste_category || null,
    stream: s.stream || null,
    interested_branch: s.interested_branch || null,
    assigned_faculty_id: s._parsedFirstName ? (facultyMap.get(s._parsedFirstName) || null) : null,
    status: 'New' as const,
  }))

  // ── Deduplication: check both student_mobile AND parent_mobile ──────────
  // IMPORTANT: Supabase caps results at 1000 rows by default.
  // We use the service-role admin client + manual pagination to fetch
  // ALL existing phone numbers across the ENTIRE students table.
  const normalize = (n: string | null | undefined): string | null => {
    if (!n) return null
    const d = String(n).replace(/\D/g, '')
    return d.length >= 10 ? d : null
  }

  const existingPhones = new Set<string>()

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminDb = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const PAGE_SIZE = 1000
    let page = 0
    let hasMore = true

    while (hasMore) {
      const from = page * PAGE_SIZE
      const to = from + PAGE_SIZE - 1
      const { data: pageData, error: pageError } = await adminDb
        .from('students')
        .select('student_mobile, parent_mobile')
        .range(from, to)

      if (pageError || !pageData || pageData.length === 0) {
        hasMore = false
      } else {
        pageData.forEach(s => {
          const sm = normalize(s.student_mobile)
          const pm = normalize(s.parent_mobile)
          if (sm) existingPhones.add(sm)
          if (pm) existingPhones.add(pm)
        })
        hasMore = pageData.length === PAGE_SIZE
        page++
      }
    }
  } else {
    // Fallback if no service key: still query but may miss rows beyond 1000
    const { data: fallbackData } = await supabase
      .from('students')
      .select('student_mobile, parent_mobile')
    fallbackData?.forEach(s => {
      const sm = normalize(s.student_mobile)
      const pm = normalize(s.parent_mobile)
      if (sm) existingPhones.add(sm)
      if (pm) existingPhones.add(pm)
    })
  }

  // Track phones used within this batch to catch intra-batch duplicates too
  const batchPhones = new Set<string>()
  const studentsToInsert: typeof rawStudentsToInsert = []
  const skippedStudents: string[] = []

  for (const s of rawStudentsToInsert) {
    const sm = normalize(s.student_mobile)
    const pm = normalize(s.parent_mobile)

    const isDuplicate =
      (sm && (existingPhones.has(sm) || batchPhones.has(sm))) ||
      (pm && (existingPhones.has(pm) || batchPhones.has(pm)))

    if (isDuplicate) {
      skippedStudents.push(s.full_name)
      continue
    }

    // Register these numbers so the same batch can't contain duplicates
    if (sm) batchPhones.add(sm)
    if (pm) batchPhones.add(pm)
    studentsToInsert.push(s)
  }

  if (studentsToInsert.length === 0) {
    return {
      success: true,
      count: 0,
      skipped: skippedStudents.length,
      skippedNames: skippedStudents,
      message: `All ${skippedStudents.length} student(s) were already in the database and were skipped.`,
    }
  }

  const { error, data } = await supabase
    .from('students')
    .insert(studentsToInsert)
    .select()

  if (error) return { error: error.message }

  // Update faculty total_assigned counts
  if (data) {
    const facultyCounts = new Map<string, number>()
    data.forEach(s => {
      if (s.assigned_faculty_id) {
        facultyCounts.set(s.assigned_faculty_id, (facultyCounts.get(s.assigned_faculty_id) || 0) + 1)
      }
    })
    for (const [fId] of facultyCounts) {
      const { count: c } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('assigned_faculty_id', fId)
      await supabase.from('faculty').update({ total_assigned: c || 0 }).eq('id', fId)
    }
  }

  revalidatePath('/admin')
  return {
    success: true,
    count: studentsToInsert.length,
    skipped: skippedStudents.length,
    skippedNames: skippedStudents,
  }
}

export async function reassignStudents(studentIds: string[], newFacultyId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('students')
    .update({ assigned_faculty_id: newFacultyId })
    .in('id', studentIds)

  if (error) return { error: error.message }
  
  // Recalculate assigned counts roughly by touching everyone
  const { data: allFaculty } = await supabase.from('faculty').select('id')
  if (allFaculty) {
    for (const f of allFaculty) {
      const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('assigned_faculty_id', f.id)
      await supabase.from('faculty').update({ total_assigned: count || 0 }).eq('id', f.id)
    }
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function getFacultyPerformance() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('faculty')
    .select(`
      id, full_name, department, total_assigned, total_consultations,
      leads_converted, reward_points, last_login,
      achievements(*)
    `)
    .eq('role', 'faculty')
    .order('reward_points', { ascending: false })

  if (error) return { error: error.message, data: [] }
  return { data: data || [] }
}

export async function createFaculty(data: {
  full_name: string
  email: string
  password: string
  role: 'faculty' | 'admin'
  department?: string
  mobile?: string
}) {
  const supabase = await createClient()
  
  // Create auth user
  const { data: authData, error: authError } = await supabase.auth.admin?.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
  }) ?? { data: null, error: { message: 'Admin API not available' } }

  if (authError) return { error: authError.message }

  // Create faculty profile
  const { error } = await supabase.from('faculty').insert({
    full_name: data.full_name,
    email: data.email,
    role: data.role,
    department: data.department || null,
    mobile: data.mobile || null,
    auth_user_id: authData?.user?.id || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/admin')
  return { success: true }
}

export async function getAdminStats() {
  const supabase = await createClient()

  const [
    { count: totalStudents },
    { count: newStudents },
    { count: consultedStudents },
    { count: convertedStudents },
    { count: totalFaculty },
    { count: totalConsultations },
  ] = await Promise.all([
    supabase.from('students').select('*', { count: 'exact', head: true }),
    supabase.from('students').select('*', { count: 'exact', head: true }).eq('status', 'New'),
    supabase.from('students').select('*', { count: 'exact', head: true }).neq('status', 'New'),
    supabase.from('students').select('*', { count: 'exact', head: true }).in('status', ['Registered', 'Admitted']),
    supabase.from('faculty').select('*', { count: 'exact', head: true }).eq('role', 'faculty'),
    supabase.from('consultations').select('*', { count: 'exact', head: true }),
  ])

  return {
    totalStudents: totalStudents || 0,
    newStudents: newStudents || 0,
    consultedStudents: consultedStudents || 0,
    convertedStudents: convertedStudents || 0,
    totalFaculty: totalFaculty || 0,
    totalConsultations: totalConsultations || 0,
    conversionRate: totalStudents ? Math.round(((convertedStudents || 0) / totalStudents) * 100) : 0,
  }
}

export async function getAchievements(facultyId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('achievements')
    .select('*')
    .eq('faculty_id', facultyId)
    .order('unlocked_at', { ascending: false })
  return data || []
}

export async function getMilestones() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('reward_milestones')
    .select('*')
    .order('points_required')
  return data || []
}

export async function editFaculty(facultyId: string, updates: { full_name?: string; email?: string; department?: string; mobile?: string; role?: string }) {
  const supabase = await createClient()

  let client = supabase
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    client = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) as any
  }

  const { error } = await client
    .from('faculty')
    .update(updates)
    .eq('id', facultyId)

  if (error) return { error: error.message }
  
  revalidatePath('/admin')
  return { success: true }
}

export async function importFaculties(faculties: any[]) {
  const supabase = await createClient()

  let client = supabase
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    client = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    ) as any
  } else {
    return { error: 'Service role key required for bulk importing faculty members.' }
  }

  // Fetch existing faculties to duplicate check
  const { data: existingFaculties, error: fetchErr } = await client
    .from('faculty')
    .select('mobile')

  if (fetchErr) return { error: fetchErr.message }

  const normalizePhone = (p: string) => String(p || '').replace(/\D/g, '').slice(-10)

  const existingMobiles = new Set(
    (existingFaculties || [])
      .map(f => normalizePhone(f.mobile))
      .filter(m => m.length >= 10)
  )

  let count = 0
  let skipped = 0

  for (const f of faculties) {
    if (!f.full_name || !f.mobile) continue

    const mobileNorm = normalizePhone(f.mobile)
    if (mobileNorm.length >= 10 && existingMobiles.has(mobileNorm)) {
      skipped++
      continue
    }

    const cleanNameParts = f.full_name.toLowerCase().replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.)\s*/, '').split(' ')
    const firstName = cleanNameParts[0] || 'faculty'

    const tempEmail = `${firstName}@rngpit.ac.in`
    const tempPassword = `${firstName}@1234`

    const { data: authData, error: authError } = await client.auth.admin.createUser({
      email: tempEmail,
      password: tempPassword,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already exists')) {
        skipped++
      } else {
        console.error('Auth error for', tempEmail, authError.message)
      }
      continue
    }

    const { error: profileError } = await client.from('faculty').insert({
      full_name: f.full_name,
      email: tempEmail,
      department: f.department || null,
      mobile: f.mobile,
      role: 'faculty',
      auth_user_id: authData.user?.id || null,
      total_assigned: 0,
      total_consultations: 0,
      leads_converted: 0,
      reward_points: 0,
      password_changed: false
    })

    if (profileError) {
      console.error('Profile error for', tempEmail, profileError.message)
      continue
    }

    if (mobileNorm.length >= 10) existingMobiles.add(mobileNorm)
    count++
  }

  revalidatePath('/admin')
  return { success: true, count, skipped }
}

export async function editStudent(studentId: string, updates: { full_name?: string; school_name?: string; student_mobile?: string; parent_mobile?: string; stream?: string; caste_category?: string; interested_branch?: string; }) {
  const supabase = await createClient()
  const { error } = await supabase.from('students').update(updates).eq('id', studentId)
  if (error) return { error: error.message }
  revalidatePath('/dashboard')
  revalidatePath('/admin')
  return { success: true }
}

export async function deleteFaculty(facultyId: string) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { error: 'Service role key required.' }

  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  // 1. Unassign all students assigned to this faculty
  await admin
    .from('students')
    .update({ assigned_faculty_id: null })
    .eq('assigned_faculty_id', facultyId)

  // 2. Get auth_user_id before deleting the profile row
  const { data: profile } = await admin
    .from('faculty')
    .select('auth_user_id')
    .eq('id', facultyId)
    .single()

  // 3. Delete the faculty profile row
  const { error: profileError } = await admin
    .from('faculty')
    .delete()
    .eq('id', facultyId)

  if (profileError) return { error: profileError.message }

  // 4. Delete the auth user (best-effort)
  if (profile?.auth_user_id) {
    await admin.auth.admin.deleteUser(profile.auth_user_id)
  }

  revalidatePath('/admin')
  return { success: true }
}

export async function updateFacultyPoints(
  facultyId: string,
  mode: 'set' | 'add' | 'subtract',
  amount: number
) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { error: 'Service role key required.' }

  const { createClient: createAdminClient } = await import('@supabase/supabase-js')
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  if (mode === 'set') {
    const { error } = await admin
      .from('faculty')
      .update({ reward_points: amount })
      .eq('id', facultyId)
    if (error) return { error: error.message }
  } else {
    const { data: current, error: fetchErr } = await admin
      .from('faculty')
      .select('reward_points')
      .eq('id', facultyId)
      .single()
    if (fetchErr) return { error: fetchErr.message }

    const newPoints = Math.max(0, (current?.reward_points ?? 0) + (mode === 'add' ? amount : -amount))
    const { error } = await admin
      .from('faculty')
      .update({ reward_points: newPoints })
      .eq('id', facultyId)
    if (error) return { error: error.message }
  }

  revalidatePath('/admin')
  return { success: true }
}

