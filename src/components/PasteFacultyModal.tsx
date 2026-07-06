'use client'

import { useState } from 'react'
import { X, Loader2, Info } from 'lucide-react'
import { importFaculties } from '@/lib/actions/consultancy'

export default function PasteFacultyModal({ onClose, onSuccess, adminFaculty }: { onClose: () => void, onSuccess: () => void, adminFaculty?: any }) {
  const [text, setText] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setResult(null)

    if (!text.trim()) {
      setError('Please paste some data first')
      setLoading(false)
      return
    }

    const lines = text.trim().split(/\r?\n/)
    
    // Check if the first line is headers
    let startIndex = 0
    const firstLineLower = lines[0].toLowerCase()
    if (firstLineLower.includes('faculty name') || firstLineLower.includes('mobile')) {
      startIndex = 1
    }

    const faculties = []

    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i]
        if (!line.trim()) continue
        
        let separator = line.includes('\t') ? '\t' : ','
        const parts = line.split(separator)

        let fullName = ''
        let mobile = ''
        let department = ''

        if (parts.length >= 3) {
            fullName = parts[0].trim()
            mobile = parts[1].trim()
            department = parts[2].trim()
        } else if (parts.length === 2) {
            fullName = parts[0].trim()
            mobile = parts[1].trim()
        }

        if (fullName && mobile) {
            faculties.push({ 
                full_name: fullName, 
                mobile, 
                department: adminFaculty?.role === 'hod' ? adminFaculty.department : department 
            })
        }
    }

    if (faculties.length === 0) {
      setError('Could not extract any valid faculty records. Ensure format is: Name | Mobile | Department')
      setLoading(false)
      return
    }

    try {
      const res = await importFaculties(faculties)
      if (res.error) {
        setResult({ success: false, message: res.error })
      } else {
        setResult({ success: true, message: `Successfully imported ${res.count} faculties! Skiped ${res.skipped} duplicates.` })
        setTimeout(() => {
          onSuccess()
        }, 3000)
      }
    } catch (err: any) {
      setResult({ success: false, message: err.message || 'Import failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 110 }}>
      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '700px', padding: '2rem', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Bulk Import Faculty (Paste)</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)', padding: '1rem', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <Info size={16} style={{ color: '#60a5fa', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#60a5fa', display: 'block', marginBottom: '4px' }}>Required Format (Columns in exact order):</strong>
              <div style={{ 
                display: 'flex', 
                gap: '8px', 
                fontFamily: 'monospace', 
                background: '#f1f5f9', 
                padding: '6px 12px', 
                borderRadius: '6px',
                color: 'var(--primary-light)',
                whiteSpace: 'nowrap',
                overflowX: 'auto'
              }}>
                <span>Faculty Name</span>
                {adminFaculty?.role !== 'hod' && <>|<span>Mobile Number</span>|<span>Department</span></>}
                {adminFaculty?.role === 'hod' && <>|<span>Mobile Number</span></>}
              </div>
              <p style={{ marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                You can copy-paste directly from Excel/Google Sheets. The system will automatically generate login credentials using their mobile number.
              </p>
            </div>
          </div>
        </div>

        {result ? (
          <div style={{ 
            padding: '1.5rem', 
            borderRadius: '12px', 
            background: result.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${result.success ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
            color: result.success ? '#34d399' : '#f87171',
            textAlign: 'center',
            marginBottom: '1rem'
          }}>
            <h3 style={{ fontWeight: '700', marginBottom: '8px' }}>{result.success ? 'Import Complete' : 'Import Failed'}</h3>
            <p style={{ fontSize: '0.9rem' }}>{result.message}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '300px' }}>
            {error && <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '10px' }}>{error}</div>}
            
            <textarea
              className="input-field"
              style={{ flex: 1, minHeight: '200px', resize: 'vertical', fontFamily: 'monospace', fontSize: '0.85rem', whiteSpace: 'pre', overflowWrap: 'normal', overflowX: 'auto' }}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={adminFaculty?.role === 'hod' 
                ? "Dr. Priya Sharma\t9876543210\nDr. Rahul Verma\t9123456780\n..."
                : "Dr. Priya Sharma\t9876543210\tCSE\nDr. Rahul Verma\t9123456780\tMechanical\n..."
              }
            />

            <div style={{ display: 'flex', gap: '10px', marginTop: '1.5rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose} disabled={loading}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={loading || !text}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : 'Import Faculties'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
