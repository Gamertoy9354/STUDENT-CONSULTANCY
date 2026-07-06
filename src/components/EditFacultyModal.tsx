'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { editFaculty } from '@/lib/actions/consultancy'

export default function EditFacultyModal({ faculty, onClose }: { faculty: any; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    full_name: faculty.full_name || '',
    email: faculty.email || '',
    department: faculty.department || '',
    mobile: faculty.mobile || '',
    role: faculty.role || 'faculty',
  })

  const DEPARTMENTS = ['CSE', 'Chemical', 'Mechanical', 'IT', 'Civil', 'MBA', 'MSCIT', 'Electrical', 'Librarian', 'CLERK', 'Pharmacy', 'S&H', 'Admin']

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await editFaculty(faculty.id, form)
    
    if (result.error) {
      setError(result.error)
      setLoading(false)
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="modal-overlay">
      <div className="glass-card animate-slide-up" style={{ maxWidth: '500px', width: '100%', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>Edit Faculty Details</h2>
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
            <label className="form-label">Full Name</label>
            <input 
              type="text" 
              className="form-input" 
              value={form.full_name} 
              onChange={e => setForm({ ...form, full_name: e.target.value })} 
              required 
            />
          </div>

          <div>
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-input" 
              value={form.email} 
              onChange={e => setForm({ ...form, email: e.target.value })} 
              required 
            />
          </div>

          <div>
            <label className="form-label">Mobile Number</label>
            <input 
              type="text" 
              className="form-input" 
              value={form.mobile} 
              onChange={e => setForm({ ...form, mobile: e.target.value })} 
            />
          </div>

          <div>
            <label className="form-label">Department</label>
            <select 
              className="form-input" 
              value={form.department} 
              onChange={e => setForm({ ...form, department: e.target.value })}
            >
              <option value="">Select Department</option>
              {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="form-label">Role</label>
            <select 
              className="form-input" 
              value={form.role} 
              onChange={e => setForm({ ...form, role: e.target.value })}
            >
              <option value="faculty">Faculty</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={loading} style={{ marginTop: '0.5rem', padding: '12px', justifyContent: 'center' }}>
            {loading ? <Loader2 className="animate-spin" size={18} /> : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
