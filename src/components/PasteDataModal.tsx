'use client'

import { useState } from 'react'
import { X, Loader2, Info } from 'lucide-react'
import { importStudents } from '@/lib/actions/consultancy'

// ─── Exact column order as specified by admin ─────────────────────────────────
// Col 0: Student Name
// Col 1: Student Mobile No.
// Col 2: Caste Category
// Col 3: Parents Mobile No.
// Col 4: School Name
// Col 5: Group A or B
// Col 6: Interested Branch
// Col 7: Assigned Faculty

const EXACT_HEADERS = [
  'student name',
  'student mobile no.',
  'caste category',
  'parents mobile no.',
  'school name',
  'group a or b',
  'intrested branch',   // intentional typo to match their sheet
  'assigned faculty',
]

// Maps header keywords → field name
const HEADER_FIELD_MAP: Record<string, string> = {
  // name
  'student name': 'fullName',
  'full name': 'fullName',
  'name': 'fullName',
  // student mobile
  'student mobile': 'studentMobile',
  'student mobile no': 'studentMobile',
  'student mobile no.': 'studentMobile',
  'mobile no': 'studentMobile',
  'mobile': 'studentMobile',
  'phone': 'studentMobile',
  'contact': 'studentMobile',
  // caste / category
  'caste category': 'caste',
  'caste': 'caste',
  'category': 'caste',
  'social category': 'caste',
  // parent mobile
  'parents mobile no.': 'parentMobile',
  'parents mobile no': 'parentMobile',
  'parents mobile': 'parentMobile',
  'parent mobile': 'parentMobile',
  'alternate': 'parentMobile',
  // school
  'school name': 'school',
  'school': 'school',
  'college': 'school',
  'institution': 'school',
  // stream / group
  'group a or b': 'stream',
  'group': 'stream',
  'stream': 'stream',
  'major': 'stream',
  // branch
  'intrested branch': 'branch',   // intentional typo
  'interested branch': 'branch',
  'branch': 'branch',
  'course': 'branch',
  'interest': 'branch',
  // faculty
  'assigned faculty': 'faculty',
  'faculty': 'faculty',
  'assigned': 'faculty',
  'counselor': 'faculty',
}

function detectSeparator(line: string): string {
  // Prefer tab (from Excel copy-paste), fall back to comma
  return line.includes('\t') ? '\t' : ','
}

function isHeaderLine(line: string): boolean {
  const lower = line.toLowerCase()
  return (
    lower.includes('student name') ||
    lower.includes('student mobile') ||
    lower.includes('assigned faculty') ||
    lower.includes('intrested branch') ||
    lower.includes('interested branch') ||
    (lower.includes('name') && lower.includes('mobile'))
  )
}

function resolveHeaderToField(header: string): string | null {
  const h = header.trim().toLowerCase()
  // exact match first
  if (HEADER_FIELD_MAP[h]) return HEADER_FIELD_MAP[h]
  // partial match
  for (const [key, field] of Object.entries(HEADER_FIELD_MAP)) {
    if (h.includes(key) || key.includes(h)) return field
  }
  return null
}

export default function PasteDataModal({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ count: number; skipped: number; skippedNames: string[] } | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!text.trim()) return

    setLoading(true)
    setError('')

    try {
      let lines = text.split('\n').map(l => l.trim()).filter(l => l)
      if (lines.length === 0) throw new Error('No data provided.')

      const separator = detectSeparator(lines[0])

      // ── Detect or inject header row ──────────────────────────────────────
      const headerIdx = lines.findIndex(l => isHeaderLine(l))
      let fieldOrder: (string | null)[] = []
      let dataStartIdx = 0

      if (headerIdx !== -1) {
        // Parse headers from the detected header row
        const headerCells = lines[headerIdx].split(separator)
        fieldOrder = headerCells.map(h => resolveHeaderToField(h))
        dataStartIdx = headerIdx + 1
      } else {
        // No header found — inject and assume exact positional column order
        fieldOrder = [
          'fullName',
          'studentMobile',
          'caste',
          'parentMobile',
          'school',
          'stream',
          'branch',
          'faculty',
        ]
        dataStartIdx = 0
      }

      // ── Parse data rows ──────────────────────────────────────────────────
      const parsedStudents = []

      for (let i = dataStartIdx; i < lines.length; i++) {
        const values = lines[i].split(separator).map(v => v.trim())
        if (values.filter(v => v).length < 2) continue

        const row: Record<string, string> = {}
        fieldOrder.forEach((field, idx) => {
          if (field && values[idx]) row[field] = values[idx]
        })

        const fullName     = row['fullName']     || ''
        const studentMobile = row['studentMobile'] || ''
        const caste        = row['caste']        || ''
        const parentMobile = row['parentMobile'] || ''
        const school       = row['school']       || ''
        const stream       = row['stream']       || ''
        const branch       = row['branch']       || ''
        const faculty      = row['faculty']      || ''

        if (!fullName) continue

        parsedStudents.push({
          full_name:             fullName,
          student_mobile:        studentMobile || null,
          caste_category:        caste || null,
          parent_mobile:         parentMobile || null,
          school_name:           school || null,
          stream:                stream ? stream.toUpperCase() : null,
          interested_branch:     branch || null,
          assigned_faculty_name: faculty || null,
        })
      }

      if (parsedStudents.length === 0) {
        throw new Error(
          'No valid student rows could be parsed. Make sure your data has at least a name column, ' +
          'and ideally matches the column order: Student Name → Student Mobile → Caste Category → ' +
          'Parents Mobile → School Name → Group A or B → Interested Branch → Assigned Faculty.'
        )
      }

      const res = await importStudents(parsedStudents)
      if (res.error) throw new Error(res.error)

      setResult({
        count:        res.count        ?? 0,
        skipped:      res.skipped      ?? 0,
        skippedNames: res.skippedNames ?? [],
      })
      setLoading(false)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  const placeholderText = [
    'Student Name\tStudent Mobile No.\tCaste Category\tParents Mobile No.\tSchool Name\tGroup A or B\tIntrested Branch\tAssigned Faculty',
    'Patel Rahul\t9876543210\tOBC\t9876543211\tGreen High School\tA\tComputer\tMayur Bhai',
    'Shah Priya\t9123456789\tGeneral\t9123456780\tBlue Academy\tB\tMechanical\tRinisha Patel',
  ].join('\n')

  return (
    <div className="modal-overlay">
      <div className="glass-card animate-slide-up" style={{ maxWidth: '680px', width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Paste CSV / Excel Data</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {/* Column order guide */}
        <div style={{ padding: '1rem', background: 'rgba(var(--primary-rgb),0.08)', border: '1px solid rgba(var(--primary-rgb),0.2)', borderRadius: '10px', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
            <Info size={14} style={{ color: 'var(--primary-light)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--primary-light)' }}>Expected Column Order</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {['Student Name', 'Student Mobile', 'Caste Category', 'Parents Mobile', 'School Name', 'Group A/B', 'Interested Branch', 'Assigned Faculty'].map((col, i) => (
              <span key={col} style={{
                fontSize: '0.72rem', padding: '3px 9px', borderRadius: '20px',
                background: i === 0 || i === 7 ? 'rgba(var(--primary-rgb),0.1)' : '#f1f5f9',
                color: i === 0 || i === 7 ? 'var(--primary-light)' : 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}>
                {i + 1}. {col}
              </span>
            ))}
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>
            Duplicates are auto-skipped by matching <b>Student Mobile</b> or <b>Parents Mobile</b> against existing records.
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Import Result Summary */}
        {result ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ padding: '1.2rem', background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.8rem' }}>
                <span style={{ fontSize: '1.4rem' }}>✅</span>
                <span style={{ fontWeight: '700', color: '#34d399', fontSize: '1rem' }}>Import Complete</span>
              </div>
              <div style={{ display: 'flex', gap: '3rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#34d399' }}>{result.count}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Students Added</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fbbf24' }}>{result.skipped}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Duplicates Skipped</div>
                </div>
              </div>
            </div>

            {result.skipped > 0 && (
              <div style={{ padding: '1rem', background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: '10px' }}>
                <p style={{ fontSize: '0.8rem', color: '#fbbf24', fontWeight: '600', marginBottom: '0.5rem' }}>
                  ⚠️ Skipped — already in database (matched by student or parent mobile):
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {result.skippedNames.map((name, i) => (
                    <span key={i} style={{
                      fontSize: '0.75rem', background: 'rgba(251,191,36,0.12)', color: '#fbbf24',
                      padding: '3px 10px', borderRadius: '20px', border: '1px solid rgba(251,191,36,0.3)'
                    }}>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button className="btn-primary" onClick={onClose} style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              className="form-input"
              placeholder={placeholderText}
              style={{ minHeight: '220px', fontFamily: 'monospace', fontSize: '0.8rem', whiteSpace: 'pre' }}
              required
            />

            <button type="submit" className="btn-primary" disabled={loading || !text.trim()} style={{ marginTop: '0.5rem', padding: '12px' }}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : 'Process & Import Data'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
