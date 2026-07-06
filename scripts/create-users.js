// Script to create admin + faculty accounts in Supabase
const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://kkbaddxfvtfiyzcfwpaw.supabase.co'
// We need the service role key to create users via admin API
// For now, use signUp which works with anon key
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrYmFkZHhmdnRmaXl6Y2Z3cGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NzUyNjEsImV4cCI6MjA4MjI1MTI2MX0.92ifTEyJ7rsUDpaFt16saB2WcJV4k-UvCUCvv2gqRKo'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const USERS = [
  // Admin
  { email: 'innocrew.admin@gmail.com', password: 'Admin@1234', full_name: 'INNOCREW Admin', role: 'admin', department: 'Administration', code: 'ADMIN' },
  // Faculty
  { email: 'innocrew.fcs@gmail.com', password: 'Faculty@1234', full_name: 'FCS Faculty', role: 'faculty', department: 'IT', code: 'FCS' },
  { email: 'innocrew.mrg@gmail.com', password: 'Faculty@1234', full_name: 'MRG Faculty', role: 'faculty', department: 'IT', code: 'MRG' },
  { email: 'innocrew.ums@gmail.com', password: 'Faculty@1234', full_name: 'UMS Faculty', role: 'faculty', department: 'IT', code: 'UMS' },
  { email: 'innocrew.hap@gmail.com', password: 'Faculty@1234', full_name: 'HAP Faculty', role: 'faculty', department: 'IT', code: 'HAP' },
  { email: 'innocrew.ahg@gmail.com', password: 'Faculty@1234', full_name: 'AHG/KJR Faculty', role: 'faculty', department: 'IT', code: 'AHG/KJR' },
  { email: 'innocrew.pdp@gmail.com', password: 'Faculty@1234', full_name: 'PDP Faculty', role: 'faculty', department: 'IT', code: 'PDP' },
  { email: 'innocrew.stm@gmail.com', password: 'Faculty@1234', full_name: 'STM Faculty', role: 'faculty', department: 'IT', code: 'STM' },
]

async function createUsers() {
  console.log('Creating users...\n')
  
  for (const user of USERS) {
    // Sign up via Supabase Auth
    const { data, error } = await supabase.auth.signUp({
      email: user.email,
      password: user.password,
      options: {
        data: {
          full_name: user.full_name,
          role: user.role,
        }
      }
    })

    if (error) {
      console.log(`❌ ${user.email}: ${error.message}`)
      continue
    }

    const authUserId = data.user?.id
    console.log(`✅ Auth created: ${user.email} (id: ${authUserId})`)

    // Upsert faculty profile
    if (authUserId) {
      const { error: profileError } = await supabase
        .from('faculty')
        .upsert({
          auth_user_id: authUserId,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          department: user.department,
        }, { onConflict: 'auth_user_id' })

      if (profileError) {
        console.log(`  ⚠️  Profile error: ${profileError.message}`)
      } else {
        console.log(`  ✅ Profile created for ${user.role}: ${user.full_name}`)
      }
    }
  }

  console.log('\n✅ Done! Check Supabase Auth dashboard to confirm email if needed.')
  console.log('\n📋 CREDENTIALS SUMMARY:')
  console.log('━'.repeat(50))
  USERS.forEach(u => {
    console.log(`[${u.role.toUpperCase()}] ${u.full_name}`)
    console.log(`  Email   : ${u.email}`)
    console.log(`  Password: ${u.password}`)
    console.log(`  Code    : ${u.code}`)
    console.log()
  })
}

createUsers().catch(console.error)
