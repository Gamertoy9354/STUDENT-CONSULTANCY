'use client'

import { useState } from 'react'
import Link from 'next/link'
import { forgotPassword } from '@/lib/actions/auth'
import { Mail, ArrowLeft, Loader2, CheckCircle, Sparkles } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const formData = new FormData(e.currentTarget)
    const result = await forgotPassword(formData)
    
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    } else {
      setSuccess(true)
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(var(--primary-rgb),0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} className="animate-float" />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(var(--accent-rgb),0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} className="animate-float" />
      
      <div className="animate-slide-up" style={{ width: '100%', maxWidth: '440px', padding: '1.5rem' }}>
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          {success ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '64px', height: '64px', borderRadius: '50%', 
                background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem'
              }}>
                <CheckCircle size={32} style={{ color: '#34d399' }} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                Check your email
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '2rem' }}>
                We've sent a password reset link to your email address. Please follow the instructions to reset your password.
              </p>
              <Link href="/login" className="btn-primary" style={{ display: 'inline-flex', width: '100%', justifyContent: 'center', textDecoration: 'none' }}>
                Return to Login
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '2rem' }}>
                <Link href="/login" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem', marginBottom: '1.5rem', fontWeight: '500' }}>
                  <ArrowLeft size={16} /> Back to login
                </Link>
                <h2 style={{ fontSize: '1.6rem', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sparkles size={24} style={{ color: 'var(--accent)' }} />
                  Forgot Password?
                </h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.6rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              {error && (
                <div style={{ 
                  background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                  borderRadius: '10px', padding: '12px 16px', marginBottom: '1.5rem',
                  color: '#f87171', fontSize: '0.9rem'
                }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                    Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                    <input
                      className="input-field"
                      style={{ paddingLeft: '44px' }}
                      type="email"
                      name="email"
                      placeholder="faculty@rngpit.ac.in"
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem' }}>
                  {loading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending Link...
                    </>
                  ) : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
