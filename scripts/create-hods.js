const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Manual .env.local loader
function loadEnv() {
  const envPath = path.resolve('.env.local')
  if (!fs.existsSync(envPath)) return
  const envContent = fs.readFileSync(envPath, 'utf-8')
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=')
    if (key && value) {
      process.env[key.trim()] = value.trim()
    }
  })
}

loadEnv()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const departments = [
  'CSE', 'Chemical', 'Mechanical', 'IT', 'Civil', 'MBA', 'MSCIT', 'Electrical', 'Librarian', 'CLERK', 'Pharmacy', 'S&H'
]

async function createHOD(dept) {
  const firstName = dept.toLowerCase().replace(/&/g, 'n')
  const email = `${firstName}.hod@rngpit.ac.in`
  const password = `${firstName}@1234`
  const fullName = `HOD ${dept}`
  
  console.log(`Creating HOD for ${dept}: ${email}`)
  
  try {
    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName }
    })
    
    if (authError) {
        if (authError.message.includes('already registered')) {
            console.log(`User ${email} already exists, skipping auth...`)
            // Continue to profile insert if needed, or skip
        } else {
            console.error(`Auth Error for ${dept}:`, authError.message)
            return
        }
    }
    
    const userId = authData?.user?.id
    
    if (userId) {
        // 2. Create faculty record
        const { error: facultyError } = await supabase.from('faculty').insert({
            full_name: fullName,
            email,
            department: dept,
            role: 'hod',
            auth_user_id: userId,
            password_changed: true // Pre-confirm since we set it
        })
        
        if (facultyError) {
            console.error(`Faculty Insert Error for ${dept}:`, facultyError.message)
        } else {
            console.log(`Successfully created HOD for ${dept}`)
        }
    }
    
  } catch (err) {
    console.error(`Unexpected error for ${dept}:`, err.message)
  }
}

async function run() {
  for (const dept of departments) {
    await createHOD(dept)
  }
}

run()
