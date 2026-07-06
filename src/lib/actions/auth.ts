'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const data = {
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  }

  const { error } = await supabase.auth.signInWithPassword(data)

  if (error) {
    return { error: error.message }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Authentication failed' }

  // Get faculty role and setup status
  const { data: faculty } = await supabase
    .from('faculty')
    .select('role, password_changed')
    .eq('auth_user_id', user.id)
    .single()

  // Update last_login
  await supabase
    .from('faculty')
    .update({ last_login: new Date().toISOString() })
    .eq('auth_user_id', user.id)

  revalidatePath('/', 'layout')
  
  if (faculty?.password_changed === false) {
    redirect('/change-password')
  } else if (faculty?.role === 'admin' || faculty?.role === 'hod') {
    redirect('/admin')
  } else {
    redirect('/dashboard')
  }
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/login')
}

export async function getCurrentFaculty() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data } = await supabase
    .from('faculty')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  return data
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const newPassword = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (newPassword.length < 6) return { error: 'Password must be at least 6 characters' }
  if (newPassword !== confirmPassword) return { error: 'Passwords do not match' }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Update password in auth engine
  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }

  // Mark password as changed in faculty table
  await supabase
    .from('faculty')
    .update({ password_changed: true })
    .eq('auth_user_id', user.id)

  revalidatePath('/', 'layout')
  
  // Need to get role to redirect correctly
  const { data: faculty } = await supabase.from('faculty').select('role').eq('auth_user_id', user.id).single()
  
  if (faculty?.role === 'admin' || faculty?.role === 'hod') {
    redirect('/admin')
  } else {
    redirect('/dashboard')
  }
}

export async function forgotPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  // Use headers to get the site URL for redirect
  const { headers } = await import('next/headers')
  const host = (await headers()).get('host')
  const protocol = host?.includes('localhost') ? 'http' : 'https'
  const siteUrl = `${protocol}://${host}`

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/reset-password`,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (password.length < 6) return { error: 'Password must be at least 6 characters' }
  if (password !== confirmPassword) return { error: 'Passwords do not match' }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }
  return { success: true }
}
