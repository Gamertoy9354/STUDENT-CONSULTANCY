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

  if (adminFaculty?.role !== 'admin' && adminFaculty?.role !== 'hod') {
    return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 })
  }

  const { userId, newPassword } = await request.json()

  if (!userId || !newPassword) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  try {
    const { createClient: createAdminClient } = await import('@supabase/supabase-js')
    const adminSupabase = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error: authError } = await adminSupabase.auth.admin.updateUserById(userId, {
      password: newPassword
    })

    if (authError) return NextResponse.json({ error: authError.message })

    // Mark the user as needing to change password since an admin just reset it
    await supabase.from('faculty').update({ password_changed: false }).eq('auth_user_id', userId)

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to reset password' })
  }
}
