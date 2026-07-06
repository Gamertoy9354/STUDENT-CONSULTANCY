'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { X, User, Mail, Lock, Building, Phone, Shield, Loader2, CheckCircle } from 'lucide-react'

interface Props {
  onClose: () => void
  onSuccess: () => void
  adminFaculty?: any
}

export default function AddFacultyModal({ onClose, onSuccess, adminFaculty }: Props) {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'faculty' as 'faculty' | 'admin' | 'hod',
    department: adminFaculty?.department || '',
    mobile: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.password) {
      setError('Please fill all required fields')
      return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Use admin API via server
      const response = await fetch('/api/create-faculty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const result = await response.json()

      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(onSuccess, 1500)
    } catch {
      setError('Failed to create faculty member')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '500px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Add Faculty Member</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <CheckCircle size={48} style={{ color: '#10b981', margin: '0 auto 1rem' }} />
            <p style={{ color: '#34d399', fontWeight: '600' }}>Faculty member created successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {[
              { icon: User, label: 'Full Name *', key: 'full_name', type: 'text', placeholder: 'Dr. Priya Sharma' },
              { icon: Mail, label: 'Email *', key: 'email', type: 'email', placeholder: 'faculty@rngpit.ac.in' },
              { icon: Lock, label: 'Password *', key: 'password', type: 'password', placeholder: 'Min 6 characters' },
              { icon: Building, label: 'Department', key: 'department', type: 'text', placeholder: 'Engineering', hidden: adminFaculty?.role === 'hod' },
              { icon: Phone, label: 'Mobile', key: 'mobile', type: 'tel', placeholder: '+91 9876543210' },
            ].filter(f => !f.hidden).map(field => (
              <div key={field.key}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>{field.label}</label>
                <div style={{ position: 'relative' }}>
                  <field.icon size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                  <input
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(form as any)[field.key]}
                    onChange={e => setForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                  />
                </div>
              </div>
            ))}

            {adminFaculty?.role !== 'hod' && (
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  <Shield size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Role
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['faculty', 'admin', 'hod'].map(role => (
                    <button key={role} type="button"
                      onClick={() => setForm(prev => ({ ...prev, role: role as any }))}
                      style={{
                        flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: '600',
                        border: '1px solid', transition: 'all 0.2s',
                        background: form.role === role ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)',
                        borderColor: form.role === role ? 'rgba(99,102,241,0.5)' : 'var(--border)',
                        color: form.role === role ? 'var(--primary-light)' : 'var(--text-secondary)',
                        fontSize: '0.85rem', textTransform: 'capitalize'
                      }}
                    >
                      {role === 'admin' ? '👑 Admin' : role === 'hod' ? '👔 HOD' : '👨‍🏫 Faculty'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#f87171', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', paddingTop: '0.5rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={loading}>
                {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Creating...</> : 'Create Member'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
