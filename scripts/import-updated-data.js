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
  console.log('Reading Excel file...')
  const filePath = path.join(__dirname, '../../STUDENT_DATA.xlsx')
  const workbook = xlsx.readFile(filePath)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  
  // Read as 2D array to find the correct header row
  const rawRows = xlsx.utils.sheet_to_json(sheet, { header: 1 })
  
  let headerRowIndex = -1
  let headers = []
  
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i]
    if (!row) continue
    const text = row.map(cell => String(cell || '').toLowerCase().trim())
    
    // The real header row will have many columns, not just 2 or 3 like the instructions
    const nonEmptyCells = text.filter(t => t.length > 0)
    if ((text.includes('student name') || text.includes('name')) && nonEmptyCells.length > 4) {
      headerRowIndex = i
      headers = row.map(v => String(v || '').trim())
      break
    }
  }

  if (headerRowIndex === -1) {
    console.error("Could not find a header row containing 'Student Name'")
    process.exit(1)
  }

  console.log(`Found headers at row ${headerRowIndex + 1}:`, headers)

  const rows = []
  // Process rows below header
  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const rawRow = rawRows[i]
    if (!rawRow || rawRow.length === 0) continue
    
    // Quick skip for mostly empty rows
    if (rawRow.filter(x => x).length < 2) continue

    const obj = {}
    headers.forEach((h, colIdx) => {
      if (h) {
        obj[h] = rawRow[colIdx]
      }
    })
    rows.push(obj)
  }

  const getVal = (row, possibleKeys) => {
    const key = Object.keys(row).find(k => possibleKeys.includes(k.toLowerCase().trim()))
    return key ? String(row[key] || '').trim() : ''
  }

  console.log('Parsing student rows...')
  const mappedStudents = []
  const uniqueFacultyMap = new Map() 

  for (const row of rows) {
    const fullName = getVal(row, ['full name', 'fullname', 'name', 'candidate name', 'student name'])
    if (!fullName) continue

    let rawFaculty = getVal(row, ['assigned faculty', 'faculty', 'assigned to', 'counselor'])
    
    let primaryFaculty = rawFaculty
    if (rawFaculty.includes(',')) {
      primaryFaculty = rawFaculty.split(',')[0].trim()
    } else if (rawFaculty.toLowerCase().includes(' and ')) {
      primaryFaculty = rawFaculty.split(/ and /i)[0].trim()
    } else if (rawFaculty.includes('&')) {
      primaryFaculty = rawFaculty.split('&')[0].trim()
    } else if (rawFaculty.includes('/')) {
      primaryFaculty = rawFaculty.split('/')[0].trim()
    }

    const firstNameParts = primaryFaculty.split(/[\s.]+/)
    let firstName = firstNameParts[0].toLowerCase()
    
    if (['dr', 'dr.', 'mr', 'mr.', 'ms', 'ms.', 'prof', 'prof.'].includes(firstName) && firstNameParts.length > 1) {
      firstName = firstNameParts[1].toLowerCase()
    }

    // Clean any trailing marks from first name
    firstName = firstName.replace(/[^a-z0-9]/g, '')

    if (primaryFaculty && firstName) {
      if (!uniqueFacultyMap.has(firstName)) {
        uniqueFacultyMap.set(firstName, primaryFaculty)
      }
    }

    mappedStudents.push({
      full_name: fullName,
      school_name: getVal(row, ['school name', 'school', 'college', 'institution']) || null,
      student_mobile: getVal(row, ['student mobile', 'student mobile no.', 'mobile', 'phone', 'contact', 'student contact']) || null,
      parent_mobile: getVal(row, ['parent mobile', 'parents mobile no.', 'parent contact', 'alternate number']) || null,
      caste_category: getVal(row, ['caste category', 'category', 'caste', 'social category']) || null,
      stream: getVal(row, ['stream', 'group a or b', 'group', 'major']).toUpperCase() || null,
      interested_branch: getVal(row, ['interested branch', 'branch', 'course', 'interest']) || null,
      status: 'New',
      _tempFirstName: primaryFaculty ? firstName : null
    })
  }

  console.log(`Found ${mappedStudents.length} valid students and ${uniqueFacultyMap.size} unique faculty mapping names.`)

  const facultyDbMap = new Map() 
  const creds = []

  for (const [firstName, fullName] of uniqueFacultyMap.entries()) {
    const email = `${firstName}@rngpit.ac.in`
    const password = `${firstName}@1234`
    
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })

    let authUser = authData?.user
    if (authErr && !authErr.message.includes('already registered')) {
      console.error(`Failed to create auth for ${email}:`, authErr)
    }

    if (!authUser) {
      const { data: allUsers } = await supabase.auth.admin.listUsers()
      authUser = allUsers.users.find(u => u.email === email)
    }

    if (!authUser) {
      console.log(`Skipping faculty logic for ${email} because auth failed`)
      continue
    }

    const { data: dbFaculty, error: dbErr } = await supabase
      .from('faculty')
      .upsert({
        auth_user_id: authUser.id,
        email,
        full_name: fullName,
        role: 'faculty',
        department: 'Engineering',
        password_changed: false 
      }, { onConflict: 'email' })
      .select('id')
      .single()

    if (dbErr) {
      console.error(`Failed to create faculty record for ${email}:`, dbErr)
    } else {
      facultyDbMap.set(firstName, dbFaculty.id)
      console.log(`Created faculty: ${fullName} (${email})`)
      creds.push(`| ${fullName} | ${email} | \`${password}\` | Faculty |`)
    }
  }

  const credsPath = path.join(__dirname, '../../CREDS.md')
  let currentCreds = fs.existsSync(credsPath) ? fs.readFileSync(credsPath, 'utf8') : ''
  fs.appendFileSync(credsPath, '\n' + creds.join('\n'))

  const finalStudents = mappedStudents.map(s => {
    const { _tempFirstName, ...rest } = s
    return {
      ...rest,
      assigned_faculty_id: _tempFirstName ? (facultyDbMap.get(_tempFirstName) || null) : null
    }
  })

  const chunkSize = 100
  let inserted = 0
  for (let i = 0; i < finalStudents.length; i += chunkSize) {
    const chunk = finalStudents.slice(i, i + chunkSize)
    const { error } = await supabase.from('students').insert(chunk)
    if (error) {
      console.error('Error inserting students chunk:', error)
    } else {
      inserted += chunk.length
      console.log(`Inserted ${inserted}/${finalStudents.length} students...`)
    }
  }

  // Final stats calc
  for (const [_, id] of facultyDbMap.entries()) {
    const { count } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('assigned_faculty_id', id)
    await supabase.from('faculty').update({ total_assigned: count || 0 }).eq('id', id)
  }

  console.log('Data import complete!')
}

run().catch(console.error)
