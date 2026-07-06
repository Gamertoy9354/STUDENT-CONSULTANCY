import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify admin role
  const { data: adminFaculty } = await supabase
    .from('faculty')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (adminFaculty?.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
  }

  const body = await request.json()
  const { full_name, email, password, role, department, mobile } = body

  if (!full_name || !email || !password) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    // Create auth user using service role if available, otherwise use admin API
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: authData, error: authError } = await adminSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      // If admin API fails (anon key used), try signing up normally
      if (authError.message.includes('not allowed')) {
        return NextResponse.json({ 
          error: 'Service role key required to create users. Add SUPABASE_SERVICE_ROLE_KEY to .env.local' 
        })
      }
      return NextResponse.json({ error: authError.message })
    }

    // Create faculty profile
    const { error: profileError } = await supabase.from('faculty').insert({
      full_name,
      email,
      role: role || 'faculty',
      department: department || null,
      mobile: mobile || null,
      auth_user_id: authData.user?.id || null,
    })

    if (profileError) {
      return NextResponse.json({ error: profileError.message })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to create user' })
  }
}
