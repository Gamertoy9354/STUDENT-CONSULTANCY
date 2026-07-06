'use client'

import { useState } from 'react'
import { X, Loader2, ArrowRight } from 'lucide-react'
import { reassignStudents } from '@/lib/actions/consultancy'

export default function ReassignModal({ 
  onClose, 
  studentIds, 
  allFaculty 
}: { 
  onClose: () => void, 
  studentIds: string[], 
  allFaculty: any[] 
}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const newFacultyId = formData.get('faculty_id') as string

    if (!newFacultyId) {
      setError('Please select a faculty member.')
      setLoading(false)
      return
    }

    try {
      const res = await reassignStudents(studentIds, newFacultyId)
      if (res.error) throw new Error(res.error)
      onClose()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="glass-card animate-slide-up" style={{ maxWidth: '400px', width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Reassign Students</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
          You are reassigning <strong>{studentIds.length}</strong> selected student(s).
        </p>

        {error && (
          <div style={{ padding: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>New Assignee</label>
            <select name="faculty_id" className="form-input" required defaultValue="">
              <option value="" disabled>Select Faculty...</option>
              {allFaculty.map(f => (
                <option key={f.id} value={f.id}>{f.full_name} ({f.department || 'Staff'})</option>
              ))}
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : (
              <>Apply Reassignment <ArrowRight size={16} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
