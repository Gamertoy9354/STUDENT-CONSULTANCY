const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
const xlsx = require('xlsx')

// Load .env.local
const envPath = path.join(__dirname, '../.env.local')
const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
envContent.split('\n').forEach(line => {
  if (line && line.includes('=')) {
    const [key, ...rest] = line.split('=')
    env[key.trim()] = rest.join('=').trim()
  }
})

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function run() {
  console.log('Fetching existing faculty from Supabase...')
  const { data: allFaculty, error: fErr } = await supabase.from('faculty').select('id, full_name').eq('role', 'faculty')
  if (fErr) throw fErr

  // Map first_name -> uuid
  const facultyDbMap = new Map()
  for (const faculty of allFaculty) {
    // E.g. "FORAM C. SHUKLA" -> "foram"
    const firstName = faculty.full_name.split(/[\s.]+/)[0].toLowerCase()
    facultyDbMap.set(firstName, faculty.id)
  }
  console.log(`Loaded ${facultyDbMap.size} faculties for mapping.`)

  console.log('Reading Excel file to correlate students...')
  const filePath = path.join(__dirname, '../../STUDENT_DATA.xlsx')
  const workbook = xlsx.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = xlsx.utils.sheet_to_json(sheet)

  const getVal = (row, possibleKeys) => {
    const key = Object.keys(row).find(k => possibleKeys.includes(k.toLowerCase().trim()))
    return key ? String(row[key]).trim() : ''
  }

  // Fetch all students to get their UUIDs
  const { data: dbStudents } = await supabase.from('students').select('id, full_name')
  const studentDbMap = new Map() // normalize name -> id
  for (const s of dbStudents) {
    if (s.full_name) {
       studentDbMap.set(s.full_name.toLowerCase().trim(), s.id)
    }
  }

  let matched = 0
  
  // We'll update sequentially or batch via a script
  for (const row of rows) {
    const fullName = getVal(row, ['full name', 'fullname', 'name', 'candidate name', 'student name'])
    if (!fullName) continue

    let rawFaculty = getVal(row, ['assigned faculty', 'faculty', 'assigned to', 'counselor'])
    if (!rawFaculty) continue

    let primaryFaculty = rawFaculty
    if (rawFaculty.includes(',')) {
      primaryFaculty = rawFaculty.split(',')[0].trim()
    } else if (rawFaculty.toLowerCase().includes(' and ')) {
      primaryFaculty = rawFaculty.split(/ and /i)[0].trim()
    } else if (rawFaculty.includes('&')) {
      primaryFaculty = rawFaculty.split('&')[0].trim()
    }

    const firstNameParts = primaryFaculty.split(/[\s.]+/)
    let firstName = firstNameParts[0].toLowerCase()
    if (['dr', 'dr.', 'mr', 'mr.', 'ms', 'ms.', 'prof', 'prof.'].includes(firstName) && firstNameParts.length > 1) {
      firstName = firstNameParts[1].toLowerCase()
    }

    const facultyId = facultyDbMap.get(firstName)
    const studentId = studentDbMap.get(fullName.toLowerCase().trim())

    if (facultyId && studentId) {
      await supabase.from('students').update({ assigned_faculty_id: facultyId }).eq('id', studentId)
      matched++
    }
  }

  console.log(`Finished correctly mapping ${matched} students to their faculties!`)

  // Update total assigned counts
  for (const faculty of allFaculty) {
    const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('assigned_faculty_id', faculty.id)
    await supabase.from('faculty').update({ total_assigned: count || 0 }).eq('id', faculty.id)
  }
  console.log(`Recalculated faculty statistics successfully!`)
}

run().catch(console.error)
