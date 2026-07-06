'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { editStudent } from '@/lib/actions/consultancy'
import { Student } from '@/lib/types'

export default function EditStudentModal({ student, onClose }: { student: Student, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    try {
      const updates = {
        full_name: formData.get('full_name') as string,
        school_name: formData.get('school_name') as string,
        student_mobile: formData.get('student_mobile') as string,
        parent_mobile: formData.get('parent_mobile') as string,
        caste_category: formData.get('caste_category') as string,
        stream: formData.get('stream') as string,
        interested_branch: formData.get('interested_branch') as string,
      }

      if (!updates.full_name || !updates.student_mobile) {
        throw new Error('Name and Contact are required.')
      }

      const res = await editStudent(student.id, updates)
      if (res.error) throw new Error(res.error)
      
      onClose()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 110 }}>
      <div className="glass-card animate-slide-up" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Edit Student Details</h2>
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
            <label className="form-label">Full Name *</label>
            <input required name="full_name" className="form-input" defaultValue={student.full_name} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Student Contact *</label>
              <input required name="student_mobile" className="form-input" defaultValue={student.student_mobile || ''} />
            </div>
            <div>
              <label className="form-label">Parent Contact</label>
              <input name="parent_mobile" className="form-input" defaultValue={student.parent_mobile || ''} />
            </div>
          </div>

          <div>
            <label className="form-label">School Name</label>
            <input name="school_name" className="form-input" defaultValue={student.school_name !== '**' ? student.school_name || '' : ''} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div>
              <label className="form-label">Group / Stream</label>
              <input name="stream" className="form-input" defaultValue={student.stream || ''} />
            </div>
            <div>
              <label className="form-label">Category</label>
              <input name="caste_category" className="form-input" defaultValue={student.caste_category !== '**' ? student.caste_category || '' : ''} />
            </div>
            <div>
              <label className="form-label">Branch</label>
              <select name="interested_branch" className="form-input" defaultValue={student.interested_branch !== '**' ? student.interested_branch || '' : ''}>
                <option value="">Select</option>
                <option value="CSE">CSE</option>
                <option value="Civil">Civil</option>
                <option value="Chemical">Chemical</option>
                <option value="Mechanical">Mechanical</option>
                <option value="Electrical">Electrical</option>
                <option value="IT">IT</option>
                <option value="MSCIT">MSCIT</option>
                <option value="S&H">S&H</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '1rem', padding: '12px', justifyContent: 'center' }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
