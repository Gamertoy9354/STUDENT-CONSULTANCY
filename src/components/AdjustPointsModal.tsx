'use client'

import { useState } from 'react'
import { X, Star, Loader2, Plus, Minus, Target } from 'lucide-react'
import { updateFacultyPoints } from '@/lib/actions/consultancy'

interface Props {
  faculty: any
  onClose: () => void
}

const MODES = [
  { value: 'add',      label: 'Add Points',      icon: Plus,   color: '#34d399', bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)'  },
  { value: 'subtract', label: 'Remove Points',   icon: Minus,  color: '#f87171', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.3)'   },
  { value: 'set',      label: 'Set Exact Value', icon: Target, color: '#818cf8', bg: 'rgba(99,102,241,0.1)',  border: 'rgba(99,102,241,0.3)'  },
] as const

export default function AdjustPointsModal({ faculty, onClose }: Props) {
  const [mode, setMode]     = useState<'add' | 'subtract' | 'set'>('add')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const current = faculty.reward_points ?? 0

  function preview(): number {
    const n = parseInt(amount) || 0
    if (mode === 'set')      return n
    if (mode === 'add')      return current + n
    if (mode === 'subtract') return Math.max(0, current - n)
    return current
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const n = parseInt(amount)
    if (!n || n <= 0) { setError('Enter a valid positive number.'); return }

    setLoading(true)
    setError('')
    const res = await updateFacultyPoints(faculty.id, mode, n)
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      window.location.reload()
    }
  }

  const selectedMode = MODES.find(m => m.value === mode)!

  return (
    <div className="modal-overlay">
      <div className="glass-card animate-slide-up" style={{ maxWidth: '440px', width: '100%', padding: '2rem' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: 'var(--text-primary)' }}>
              Adjust Points
            </h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '3px' }}>
              {faculty.full_name} · <span style={{ color: '#f59e0b', fontWeight: '600' }}>{current} pts current</span>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.8rem', background: 'rgba(239,68,68,0.1)', color: '#f87171', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

          {/* Mode selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Operation
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {MODES.map(m => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMode(m.value)}
                  style={{
                    flex: 1, padding: '10px 6px', borderRadius: '10px', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px',
                    border: `1px solid ${mode === m.value ? m.border : 'var(--border)'}`,
                    background: mode === m.value ? m.bg : 'rgba(255,255,255,0.02)',
                    color: mode === m.value ? m.color : 'var(--text-muted)',
                    transition: 'all 0.18s',
                  }}
                >
                  <m.icon size={16} />
                  <span style={{ fontSize: '0.72rem', fontWeight: '600', textAlign: 'center', lineHeight: 1.2 }}>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              {mode === 'set' ? 'New Point Value' : 'Points Amount'}
            </label>
            <div style={{ position: 'relative' }}>
              <Star size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#f59e0b', pointerEvents: 'none' }} />
              <input
                type="number"
                min="0"
                className="form-input"
                style={{ paddingLeft: '42px', fontSize: '1.1rem', fontWeight: '700' }}
                placeholder="e.g. 50"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                autoFocus
                required
              />
            </div>
          </div>

          {/* Live preview */}
          {amount && parseInt(amount) > 0 && (
            <div style={{
              padding: '12px 16px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              background: `${selectedMode.bg}`,
              border: `1px solid ${selectedMode.border}`,
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                New total after change:
              </span>
              <span style={{ fontSize: '1.3rem', fontWeight: '800', color: selectedMode.color, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Star size={16} /> {preview()}
              </span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
            <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !amount}
              style={{
                flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                padding: '12px', borderRadius: '10px', border: `1px solid ${selectedMode.border}`,
                background: selectedMode.bg, color: selectedMode.color,
                fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '0.9rem', opacity: !amount ? 0.5 : 1, transition: 'all 0.2s'
              }}
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <><selectedMode.icon size={16} /> {selectedMode.label}</>
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
