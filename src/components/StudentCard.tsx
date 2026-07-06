'use client'

import { useState } from 'react'
import { Student, Consultation } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import {
  ChevronDown, ChevronUp, Phone, User, School, BookOpen,
  Clock, MapPin, Star, MessageSquare, MessagesSquare
} from 'lucide-react'

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  New: { label: 'New', class: 'badge-new' },
  Contacted: { label: 'Contacted', class: 'badge-contacted' },
  Interested: { label: 'Interested', class: 'badge-interested' },
  Registered: { label: 'Registered', class: 'badge-registered' },
  Admitted: { label: 'Admitted', class: 'badge-admitted' },
}

interface Props {
  student: Student
  onConsult: (student: Student) => void
  onEditClick?: (student: Student) => void
}

export default function StudentCard({ student, onConsult, onEditClick }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  const status = STATUS_CONFIG[student.status] || STATUS_CONFIG.New

  async function loadHistory() {
    if (!expanded) {
      setLoadingHistory(true)
      const supabase = createClient()
      const { data } = await supabase
        .from('consultations')
        .select('*, faculty:faculty_id(full_name)')
        .eq('student_id', student.id)
        .order('consulted_at', { ascending: false })
      setConsultations(data || [])
      setLoadingHistory(false)
    }
    setExpanded(!expanded)
  }

  return (
    <div className="glass-card animate-slide-up" style={{ overflow: 'hidden', transition: 'all 0.3s' }}>
      {/* Collapsed row */}
      <div style={{ padding: '1rem 1.2rem', cursor: 'pointer' }} onClick={loadHistory}>
        {/* Top row: avatar + name + expand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Avatar */}
          <div style={{
            width: '44px', height: '44px', borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.1rem', fontWeight: '700', color: 'white', flexShrink: 0
          }}>
            {student.full_name[0].toUpperCase()}
          </div>

          {/* Name + badges */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                {student.full_name}
              </span>
              <span className={status.class} style={{ fontSize: '0.65rem', fontWeight: '700', padding: '2px 8px', borderRadius: '20px', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                {status.label}
              </span>
              {student.stream && (
                <span style={{ background: 'rgba(139,92,246,.15)', color: '#a78bfa', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '20px', border: '1px solid rgba(139,92,246,.2)', fontWeight: '600', whiteSpace: 'nowrap' }}>
                  Str {student.stream}
                </span>
              )}
            </div>

            {/* Sub-info */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '3px', flexWrap: 'wrap' }}>
              {student.school_name && student.school_name !== '**' && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <School size={11} /> {student.school_name}
                </span>
              )}
              {student.last_consulted_at && (
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Clock size={11} /> {new Date(student.last_consulted_at).toLocaleDateString('en-IN')}
                </span>
              )}
            </div>
          </div>

          <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>

        {/* Consult button row — below on mobile, always visible */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }} onClick={e => e.stopPropagation()}>
          <button
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
            onClick={() => onConsult(student)}
          >
            <Phone size={14} /> Consult
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '1.2rem' }} className="animate-slide-up">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {/* Student Details */}
            <div>
              <h3 style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
                Student Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {[
                  { icon: User, label: 'Full Name', value: student.full_name },
                  { icon: School, label: 'School', value: student.school_name !== '**' ? student.school_name : null },
                  { icon: BookOpen, label: 'Interested Branch', value: student.interested_branch !== '**' ? student.interested_branch : null },
                  { icon: MapPin, label: 'Caste Category', value: student.caste_category !== '**' ? student.caste_category : null },
                  { icon: Star, label: 'Stream', value: student.stream ? `Stream ${student.stream}` : null },
                ].map(({ icon: Icon, label, value }) => value ? (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '26px', height: '26px', borderRadius: '7px', background: 'rgba(var(--primary-rgb),.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={13} style={{ color: 'var(--primary-light)' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                      <div style={{ color: 'var(--text-primary)', fontSize: '0.88rem', fontWeight: '500' }}>{value}</div>
                    </div>
                  </div>
                ) : null)}
              </div>

              {/* Call buttons */}
              <div style={{ marginTop: '1rem', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {student.student_mobile && (
                    <a href={`tel:${student.student_mobile}`} className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem', textDecoration: 'none' }}>
                      <Phone size={13} /> {student.student_mobile}
                    </a>
                  )}
                  {student.parent_mobile && (
                    <a href={`tel:${student.parent_mobile}`} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem', textDecoration: 'none' }}>
                      <Phone size={13} /> Parent
                    </a>
                  )}
                </div>
                {onEditClick && (
                  <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.82rem' }} onClick={() => onEditClick(student)}>
                    Edit Details
                  </button>
                )}
              </div>
            </div>

            {/* Consultation History */}
            <div>
              <h3 style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MessagesSquare size={13} />
                History ({student.total_consultations})
              </h3>
              {loadingHistory ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Loading...</div>
              ) : consultations.length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '1rem', background: 'rgba(255,255,255,.03)', borderRadius: '10px', textAlign: 'center' }}>
                  <MessageSquare size={24} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                  No consultations yet
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                  {consultations.map(c => (
                    <div key={c.id} style={{ background: 'rgba(255,255,255,.03)', borderRadius: '10px', padding: '10px', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px', flexWrap: 'wrap', gap: '4px' }}>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {new Date(c.consulted_at).toLocaleString('en-IN')}
                        </span>
                        {c.call_status && (
                          <span style={{ fontSize: '0.68rem', padding: '2px 7px', borderRadius: '10px', background: 'rgba(var(--primary-rgb),.15)', color: 'var(--primary-light)', border: '1px solid rgba(var(--primary-rgb),.2)' }}>
                            {c.call_status}
                          </span>
                        )}
                      </div>
                      {c.remarks && <div style={{ fontSize: '0.83rem', color: 'var(--text-secondary)' }}>{c.remarks}</div>}
                      {c.interest_level && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                          Interest: <span style={{ color: c.interest_level === 'High' ? '#34d399' : c.interest_level === 'Medium' ? '#fbbf24' : '#f87171' }}>{c.interest_level}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
