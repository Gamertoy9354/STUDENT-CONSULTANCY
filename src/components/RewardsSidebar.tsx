'use client'

import { Faculty, Achievement, RewardMilestone } from '@/lib/types'
import { Award, Star, Download, Lock, CheckCircle, Trophy, Zap } from 'lucide-react'
import jsPDF from 'jspdf'

interface Props {
  faculty: Faculty
  achievements: Achievement[]
  milestones: RewardMilestone[]
}

const BADGE_COLORS: Record<string, { bg: string; border: string; glow: string; label: string }> = {
  bronze: { bg: 'rgba(217,119,6,0.15)', border: 'rgba(217,119,6,0.4)', glow: 'rgba(217,119,6,0.3)', label: '🥉 Bronze' },
  silver: { bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.4)', glow: 'rgba(148,163,184,0.3)', label: '🥈 Silver' },
  gold: { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)', glow: 'rgba(245,158,11,0.3)', label: '🥇 Gold' },
  platinum: { bg: 'rgba(27,50,128,0.15)', border: 'rgba(27,50,128,0.4)', glow: 'rgba(27,50,128,0.3)', label: '💎 Platinum' },
}

export default function RewardsSidebar({ faculty, achievements, milestones }: Props) {
  function downloadCertificate(achievement: Achievement) {
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

    // Background
    doc.setFillColor(255, 255, 255)
    doc.rect(0, 0, 297, 210, 'F')

    // Border
    doc.setDrawColor(45, 45, 122)
    doc.setLineWidth(3)
    doc.rect(10, 10, 277, 190)
    doc.setLineWidth(1)
    doc.setDrawColor(232, 200, 124)
    doc.rect(14, 14, 269, 182)

    // Title
    doc.setTextColor(45, 45, 122)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('R . N . G . P . I . T', 148.5, 30, { align: 'center' })
    doc.text('STUDENTS COUNSELLING PORTAL', 148.5, 38, { align: 'center' })

    // Certificate of Achievement
    doc.setTextColor(45, 45, 122)
    doc.setFontSize(28)
    doc.text('Certificate of Achievement', 148.5, 60, { align: 'center' })

    // Presented to
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text('This certificate is proudly presented to', 148.5, 80, { align: 'center' })

    // Name
    doc.setFontSize(32)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(232, 200, 124)
    doc.text(faculty.full_name, 148.5, 100, { align: 'center' })

    // Achievement
    doc.setFontSize(13)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(71, 85, 105)
    doc.text('for achieving the milestone of', 148.5, 115, { align: 'center' })

    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(232, 200, 124)
    doc.text(achievement.milestone_name || 'Achievement', 148.5, 130, { align: 'center' })

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 116, 139)
    doc.text(`with ${achievement.points_required} points earned through dedicated consultancy work`, 148.5, 142, { align: 'center' })

    // Date
    doc.setFontSize(10)
    doc.setTextColor(100, 116, 139)
    const dateStr = new Date(achievement.unlocked_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    doc.text(`Awarded on ${dateStr}`, 148.5, 165, { align: 'center' })

    // INNOCREW signature
    doc.setFontSize(9)
    doc.setTextColor(45, 45, 122)
    doc.text('R.N.G. Patel Institute of Technology', 148.5, 182, { align: 'center' })

    doc.save(`${faculty.full_name.replace(/\s+/g, '_')}_${achievement.milestone_name?.replace(/\s+/g, '_') || 'Certificate'}.pdf`)
  }

  const unlockedIds = new Set(achievements.map(a => a.milestone_name))

  return (
    <div style={{ maxWidth: '900px' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, var(--primary-dark), var(--primary-light))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Rewards & Achievements
        </h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Track your milestones and download certificates</p>
      </div>

      {/* Points overview card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(var(--primary-rgb),0.15), rgba(var(--accent-rgb),0.08))',
        border: '1px solid rgba(var(--primary-rgb),0.3)', borderRadius: '20px', padding: '2rem',
        marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '2rem', flexWrap: 'wrap'
      }}>
        <div style={{ flex: '1', minWidth: '200px' }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Star size={14} style={{ color: '#f59e0b' }} /> Total Points Earned
          </div>
          <div style={{ fontSize: '4rem', fontWeight: '900', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', lineHeight: 1 }}>
            {faculty.reward_points}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '8px' }}>reward points</div>
        </div>
        <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { label: 'Consultations', value: faculty.total_consultations, icon: Zap, color: 'var(--primary-light)' },
            { label: 'Converted', value: faculty.leads_converted, icon: Trophy, color: '#34d399' },
            { label: 'Badges', value: achievements.length, icon: Award, color: '#f59e0b' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: `${color}20`, border: `1px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px' }}>
                <Icon size={22} style={{ color }} />
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '800', color }}>{value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Milestones */}
      <h2 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Achievement Milestones
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
        {milestones.map(milestone => {
          const isUnlocked = unlockedIds.has(milestone.milestone_name)
          const achievement = achievements.find(a => a.milestone_name === milestone.milestone_name)
          const colorKey = milestone.badge_color || 'bronze'
          const colors = BADGE_COLORS[colorKey] || BADGE_COLORS.bronze
          const progress = Math.min((faculty.reward_points / milestone.points_required) * 100, 100)

          return (
            <div key={milestone.id} style={{
              background: isUnlocked ? colors.bg : 'rgba(255,255,255,0.03)',
              border: `1px solid ${isUnlocked ? colors.border : 'var(--border)'}`,
              borderRadius: '16px', padding: '1.5rem',
              boxShadow: isUnlocked ? `0 0 20px ${colors.glow}` : 'none',
              transition: 'all 0.3s'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '2rem' }}>
                  {isUnlocked ? '🏆' : <Lock size={24} style={{ color: 'var(--text-muted)' }} />}
                </div>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: '700', color: isUnlocked ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: '1rem' }}>
                      {milestone.milestone_name}
                    </span>
                    <span style={{
                      fontSize: '0.7rem', padding: '2px 10px', borderRadius: '20px',
                      background: isUnlocked ? colors.bg : 'transparent',
                      border: `1px solid ${isUnlocked ? colors.border : 'var(--border)'}`,
                      color: isUnlocked ? 'var(--text-primary)' : 'var(--text-muted)'
                    }}>
                      {colors.label}
                    </span>
                    {isUnlocked && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: '#34d399' }}>
                        <CheckCircle size={12} /> Unlocked
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                    {milestone.description} • {milestone.points_required} points required
                  </div>
                  {!isUnlocked && (
                    <>
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {faculty.reward_points} / {milestone.points_required} points
                        {' '}({milestone.points_required - faculty.reward_points} more needed)
                      </div>
                    </>
                  )}
                  {isUnlocked && achievement && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Unlocked {new Date(achievement.unlocked_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </div>
                  )}
                </div>
                {isUnlocked && achievement && (
                  <button
                    className="btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                    onClick={() => downloadCertificate(achievement)}
                  >
                    <Download size={14} /> Download
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Points info */}
      <div className="glass-card" style={{ padding: '1.5rem' }}>
        <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          How Points Are Earned
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
          {[
            { label: 'Outbound Call', points: '1 pt', color: 'var(--primary-light)' },
            { label: 'Counseling Success', points: '2 pts', color: '#fbbf24' },
            { label: 'Adm (Mother Dept)', points: '25 pts', color: '#34d399' },
            { label: 'Adm (Other Dept)', points: '15 pts', color: '#10b981' },
          ].map(item => (
            <div key={item.label} style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '12px',
              border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{item.label}</span>
              <span style={{ fontWeight: '700', color: item.color, fontSize: '0.9rem' }}>{item.points}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
