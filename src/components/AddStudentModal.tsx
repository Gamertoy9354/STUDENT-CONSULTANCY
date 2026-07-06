'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { importStudents } from '@/lib/actions/consultancy'

export default function AddStudentModal({ onClose, allFaculty }: { onClose: () => void, allFaculty: any[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    try {
      const student = {
        full_name: formData.get('full_name') as string,
        school_name: formData.get('school_name') as string,
        student_mobile: formData.get('student_mobile') as string,
        parent_mobile: formData.get('parent_mobile') as string,
        caste_category: formData.get('caste_category') as string,
        stream: formData.get('stream') as string,
        interested_branch: formData.get('interested_branch') as string,
        assigned_faculty_name: formData.get('assigned_faculty_name') as string,
      }

      if (!student.full_name || !student.student_mobile) {
        throw new Error('Name and Contact are required.')
      }

      const res = await importStudents([student])
      if (res.error) throw new Error(res.error)
      
      onClose()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay">
      <div className="glass-card animate-slide-up" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Add Single Student</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Full Name *</label>
            <input required name="full_name" className="form-input" placeholder="e.g. John Doe" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Student Contact *</label>
              <input required name="student_mobile" className="form-input" placeholder="10-digit number" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Parent Contact</label>
              <input name="parent_mobile" className="form-input" placeholder="Optional" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>School Name</label>
            <input name="school_name" className="form-input" placeholder="e.g. DPS High School" />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Group / Stream</label>
              <input name="stream" className="form-input" placeholder="e.g. A" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Category</label>
              <input name="caste_category" className="form-input" placeholder="e.g. OPEN" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Branch</label>
              <input name="interested_branch" className="form-input" placeholder="e.g. IT" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-muted)' }}>Assigned Faculty</label>
            <input name="assigned_faculty_name" className="form-input" placeholder="Type name (auto-creates if new)" list="faculty-list" />
            <datalist id="faculty-list">
              {allFaculty.map(f => <option key={f.id} value={f.full_name} />)}
            </datalist>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', padding: '12px' }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Student Record'}
          </button>
        </form>
      </div>
    </div>
  )
}
