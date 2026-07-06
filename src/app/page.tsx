import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: faculty } = await supabase
    .from('faculty')
    .select('role')
    .eq('auth_user_id', user.id)
    .single()

  if (faculty?.role === 'admin' || faculty?.role === 'hod') {
    redirect('/admin')
  } else {
    redirect('/dashboard')
  }
}

