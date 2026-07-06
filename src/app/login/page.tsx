'use client'

import { useState } from 'react'
import Link from 'next/link'
import { login } from '@/lib/actions/auth'
import { GraduationCap, Mail, Lock, Eye, EyeOff, Loader2, Sparkles } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const formData = new FormData(e.currentTarget)
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="gradient-bg min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background orbs */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%',
        width: '500px', height: '500px',
        background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} className="animate-float" />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%',
        width: '600px', height: '600px',
        background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)',
        borderRadius: '50%', pointerEvents: 'none'
      }} className="animate-float" />
      
      {/* Grid pattern */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
        backgroundSize: '50px 50px',
        pointerEvents: 'none'
      }} />

      <div className="animate-slide-up" style={{ width: '100%', maxWidth: '440px', padding: '1.5rem' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '90px', height: '90px', borderRadius: '24px',
            background: 'var(--bg-card)', border: '1px solid var(--border)',
            marginBottom: '1rem', boxShadow: '0 8px 30px rgba(0,0,0,0.5)', padding: '8px', overflow: 'hidden'
          }}>
            <img src="/RNGPIT.png" alt="RNGPIT Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: '900', background: 'linear-gradient(135deg, #f1f5f9, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            RNGPIT
          </h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1rem', fontWeight: '600' }}>
            Students Counselling Portal
          </p>
          <div style={{ marginTop: '0.4rem', border: '1px solid rgba(129,140,248,0.3)', borderRadius: '20px', padding: '2px 14px', display: 'inline-block', fontSize: '0.75rem', fontWeight: '700', color: '#818cf8', letterSpacing: '0.05em' }}>
            ADMISSION CAMPAIGN 2K26
          </div>
        </div>

        {/* Card */}
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={20} style={{ color: '#818cf8' }} />
              Welcome Back
            </h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '0.4rem', fontSize: '0.9rem' }}>
              Sign in to access your dashboard
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

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {/* Email */}
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
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600', marginBottom: '8px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: '44px', paddingRight: '44px' }}
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <Link href="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary-light)', textDecoration: 'none', fontWeight: '600' }}>
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1rem' }}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                  Signing in...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Contact your administrator for access credentials
            </p>
          </div>
        </div>

        {/* Footer badges */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {['Secure', 'Role-Based Access', 'Voice-Enabled'].map(badge => (
            <span key={badge} style={{
              background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)',
              borderRadius: '20px', padding: '4px 12px', fontSize: '0.75rem',
              color: 'var(--text-muted)'
            }}>{badge}</span>
          ))}
        </div>
      </div>
    </div>
  )
}
