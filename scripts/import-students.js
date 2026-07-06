// Import students from STUDENT_DATA.xlsx into Supabase
const { createClient } = require('@supabase/supabase-js')
const XLSX = require('xlsx')

const SUPABASE_URL = 'https://kkbaddxfvtfiyzcfwpaw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtrYmFkZHhmdnRmaXl6Y2Z3cGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NzUyNjEsImV4cCI6MjA4MjI1MTI2MX0.92ifTEyJ7rsUDpaFt16saB2WcJV4k-UvCUCvv2gqRKo'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Faculty code → email mapping (to lookup faculty ID)
const FACULTY_EMAIL_MAP = {
  'FCS': 'innocrew.fcs@gmail.com',
  'MRG': 'innocrew.mrg@gmail.com',
  'UMS': 'innocrew.ums@gmail.com',
  'HAP': 'innocrew.hap@gmail.com',
  'AHG/KJR': 'innocrew.ahg@gmail.com',
  'PDP': 'innocrew.pdp@gmail.com',
  'STM': 'innocrew.stm@gmail.com',
}

async function importStudents() {
  // First, sign in as admin (to have auth context)
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: 'innocrew.admin@gmail.com',
    password: 'Admin@1234'
  })
  if (signInErr) { console.error('Sign in failed:', signInErr.message); return }
  console.log('✅ Signed in as admin')

  // Get all faculty
  const { data: facultyList, error: fErr } = await supabase.from('faculty').select('id, email')
  if (fErr) { console.error('Faculty fetch failed:', fErr.message); return }
  
  const emailToId = {}
  facultyList.forEach(f => emailToId[f.email] = f.id)
  console.log('Faculty loaded:', Object.keys(emailToId).length)

  // Read Excel
  const wb = XLSX.readFile('../STUDENT_DATA.xlsx')
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet)
  console.log(`Reading ${rows.length} students from Excel...`)

  // Map rows to student objects
  const students = rows.map(row => {
    const facultyCode = (row['FACULTY'] || '').trim().toUpperCase()
    const facultyEmail = FACULTY_EMAIL_MAP[facultyCode] || null
    const facultyId = facultyEmail ? emailToId[facultyEmail] : null
    const stream = (row['STREAM'] || '').toString().trim().toUpperCase()

    return {
      full_name: (row['STUDENT NAME'] || '').trim(),
      school_name: (row['SCHOOL NAME'] || '').toString().trim() || null,
      student_mobile: (row['STUDENT MOBILE'] || '').toString().replace(/\D/g, '').slice(-10) || null,
      parent_mobile: (row['PARENTS MOBILE'] || '').toString().replace(/\D/g, '').slice(-10) || null,
      caste_category: (row['CATEGORY'] || '').toString().trim() || null,
      stream: ['A', 'B'].includes(stream) ? stream : null,
      interested_branch: (row['INTERSETED BRANCH'] || '').toString().trim() || null,
      assigned_faculty_id: facultyId,
      status: 'New',
    }
  }).filter(s => s.full_name && s.full_name !== '**')

  console.log(`Prepared ${students.length} valid students`)

  // Insert in batches of 50
  let successCount = 0
  let errorCount = 0
  const batchSize = 50

  for (let i = 0; i < students.length; i += batchSize) {
    const batch = students.slice(i, i + batchSize)
    const { error } = await supabase.from('students').insert(batch)
    if (error) {
      console.log(`  ❌ Batch ${Math.floor(i/batchSize)+1} failed: ${error.message}`)
      errorCount += batch.length
    } else {
      successCount += batch.length
      console.log(`  ✅ Batch ${Math.floor(i/batchSize)+1}: ${batch.length} students imported (total: ${successCount})`)
    }
  }

  // Update faculty total_assigned counts  
  console.log('\nUpdating faculty assignment counts...')
  const { data: fCounts } = await supabase
    .from('students')
    .select('assigned_faculty_id')
    .not('assigned_faculty_id', 'is', null)

  const counts = {}
  fCounts.forEach(s => { counts[s.assigned_faculty_id] = (counts[s.assigned_faculty_id] || 0) + 1 })
  
  for (const [fId, count] of Object.entries(counts)) {
    await supabase.from('faculty').update({ total_assigned: count }).eq('id', fId)
    console.log(`  Faculty ${fId}: ${count} students`)
  }

  console.log(`\n✅ Import complete! ${successCount} students added, ${errorCount} failed.`)
}

importStudents().catch(console.error)
