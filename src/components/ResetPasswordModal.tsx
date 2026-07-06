'use client'

import { useState } from 'react'
import { X, Lock, Eye, EyeOff, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface Props {
  faculty: any
  onClose: () => void
}

export default function ResetPasswordModal({ faculty, onClose }: Props) {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [newPassword, setNewPassword] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/reset-faculty-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: faculty.auth_user_id,
          newPassword
        }),
      })
      
      const result = await response.json()
      if (result.error) {
        setError(result.error)
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(onClose, 2000)
    } catch {
      setError('Failed to reset password')
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="glass-card animate-slide-up" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--text-primary)' }}>Reset Password</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ 
              width: '48px', height: '48px', borderRadius: '50%', 
              background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem'
            }}>
              <CheckCircle size={24} style={{ color: '#34d399' }} />
            </div>
            <p style={{ color: '#34d399', fontWeight: '600' }}>Password reset successfully!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Resetting password for:</p>
              <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{faculty.full_name}</p>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{faculty.email}</p>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: '40px', paddingRight: '40px' }}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', color: '#f87171', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px', paddingTop: '0.5rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={loading}>
                {loading ? <><Loader2 size={16} className="animate-spin" /> Resetting...</> : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
