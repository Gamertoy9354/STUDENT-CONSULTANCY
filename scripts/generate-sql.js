const XLSX = require('xlsx')
const fs = require('fs')

const wb = XLSX.readFile('../STUDENT_DATA.xlsx')
const sheet = wb.Sheets[wb.SheetNames[0]]
const rows = XLSX.utils.sheet_to_json(sheet)

const FACULTY_EMAIL = {
  'FCS': 'innocrew.fcs@gmail.com',
  'MRG': 'innocrew.mrg@gmail.com',
  'UMS': 'innocrew.ums@gmail.com',
  'HAP': 'innocrew.hap@gmail.com',
  'AHG/KJR': 'innocrew.ahg@gmail.com',
  'PDP': 'innocrew.pdp@gmail.com',
  'STM': 'innocrew.stm@gmail.com',
}

function esc(v) {
  if (!v) return 'NULL'
  return "'" + String(v).replace(/'/g, "''") + "'"
}

const students = rows.map(r => {
  const name = (r['STUDENT NAME'] || '').toString().trim()
  const school = (r['SCHOOL NAME'] || '').toString().trim()
  const smobile = (r['STUDENT MOBILE'] || '').toString().replace(/\D/g, '').slice(-10)
  const pmobile = (r['PARENTS MOBILE'] || '').toString().replace(/\D/g, '').slice(-10)
  const category = (r['CATEGORY'] || '').toString().trim()
  const streamRaw = (r['STREAM'] || '').toString().trim().toUpperCase()
  const stream = ['A', 'B'].includes(streamRaw) ? streamRaw : null
  const branch = (r['INTERSETED BRANCH'] || '').toString().trim()
  const facultyCode = (r['FACULTY'] || '').toString().trim().toUpperCase()
  const facultyEmail = FACULTY_EMAIL[facultyCode] || null

  return { name, school, smobile, pmobile, category, stream, branch, facultyEmail }
}).filter(s => s.name && s.name !== '**' && s.name !== 'STUDENT NAME')

console.log('Total valid students:', students.length)

const values = students.map(s => {
  const facultySubquery = s.facultyEmail
    ? `(SELECT id FROM faculty WHERE email = '${s.facultyEmail}')`
    : 'NULL'
  return `  (${esc(s.name)}, ${esc(s.school) || 'NULL'}, ${s.smobile ? esc(s.smobile) : 'NULL'}, ${s.pmobile ? esc(s.pmobile) : 'NULL'}, ${esc(s.category) || 'NULL'}, ${s.stream ? `'${s.stream}'` : 'NULL'}, ${esc(s.branch) || 'NULL'}, ${facultySubquery}, 'New')`
})

const sql = `INSERT INTO students (full_name, school_name, student_mobile, parent_mobile, caste_category, stream, interested_branch, assigned_faculty_id, status)\nVALUES\n${values.join(',\n')};\n\n-- Update faculty assignment counts\nUPDATE faculty SET total_assigned = (\n  SELECT COUNT(*) FROM students WHERE students.assigned_faculty_id = faculty.id\n);\n\nSELECT COUNT(*) as total_students FROM students;\nSELECT full_name, total_assigned FROM faculty WHERE role = 'faculty' ORDER BY full_name;\n`

fs.writeFileSync('scripts/import-students.sql', sql)
console.log('SQL written to scripts/import-students.sql')
