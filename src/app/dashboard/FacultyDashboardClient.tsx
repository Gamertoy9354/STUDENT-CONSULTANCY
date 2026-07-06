'use client'

import { useState, useMemo } from 'react'
import { Faculty, Student, Achievement, RewardMilestone } from '@/lib/types'
import { logout } from '@/lib/actions/auth'
import StudentCard from '@/components/StudentCard'
import RewardsSidebar from '@/components/RewardsSidebar'
import ConsultationModal from '@/components/ConsultationModal'
import {
  GraduationCap, LogOut, Search, Users, Award, Star,
  Phone, Bell, TrendingUp, Menu, X, Download
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'
import EditStudentModal from '@/components/EditStudentModal'

interface Props {
  faculty: Faculty
  initialStudents: Student[]
  achievements: Achievement[]
  milestones: RewardMilestone[]
}

export default function FacultyDashboardClient({ faculty, initialStudents, achievements, milestones }: Props) {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [streamFilter, setStreamFilter] = useState('')
  const [activeTab, setActiveTab] = useState<'students' | 'rewards'>('students')
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null)
  const [showConsultModal, setShowConsultModal] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [exporting, setExporting] = useState(false)

  async function exportStudentsData() {
    setExporting(true)
    try {
      const supabase = createClient()
      const { data: consultations } = await supabase.from('consultations').select('*').eq('faculty_id', faculty.id)
      
      const consMap: any = {}
      if (consultations) {
        consultations.forEach(c => {
           if (!consMap[c.student_id]) consMap[c.student_id] = []
           consMap[c.student_id].push(c)
        })
      }

      const data = filteredStudents.map(s => {
        const history = consMap[s.id] || []
        const historySorted = history.sort((a: any, b: any) => new Date(b.consulted_at).getTime() - new Date(a.consulted_at).getTime())
        const remarksString = historySorted.map((h: any) => `[${new Date(h.consulted_at).toLocaleDateString('en-IN')}] ${h.old_status} -> ${h.new_status}: ${h.remarks}`).join(' | ')
        
        return {
          'Student Name': s.full_name,
          'School Name': s.school_name || '-',
          'Student Mobile': s.student_mobile || '-',
          'Parent Mobile': s.parent_mobile || '-',
          'Category': s.caste_category || '-',
          'Stream': s.stream || '-',
          'Interested Branch': s.interested_branch || '-',
          'Status': s.status,
          'Total Consultations': s.total_consultations,
          'Consultation Remarks': remarksString
        }
      })
      
      const ws = XLSX.utils.json_to_sheet(data)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'My Students')
      XLSX.writeFile(wb, `my_students_export.xlsx`)
    } finally {
      setExporting(false)
    }
  }

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = !search || [s.full_name, s.school_name, s.student_mobile, s.interested_branch]
        .some(f => f?.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = !statusFilter || s.status === statusFilter
      const matchStream = !streamFilter || s.stream === streamFilter
      return matchSearch && matchStatus && matchStream
    })
  }, [students, search, statusFilter, streamFilter])

  const stats = useMemo(() => ({
    total: students.length,
    new: students.filter(s => s.status === 'New').length,
    consulted: students.filter(s => s.status !== 'New').length,
    converted: students.filter(s => ['Registered', 'Admitted'].includes(s.status)).length,
  }), [students])

  const nextMilestone = milestones.find(m => m.points_required > faculty.reward_points)

  function onConsultationComplete(studentId: string, newStatus: string) {
    setStudents(prev => prev.map(s =>
      s.id === studentId ? { ...s, status: newStatus as Student['status'], total_consultations: s.total_consultations + 1, last_consulted_at: new Date().toISOString() } : s
    ))
    setShowConsultModal(false)
    setSelectedStudent(null)
  }

  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>

      {/* ── Mobile Top Bar ── */}
      <div className="mobile-topbar">
        <button
          onClick={() => setSidebarOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)', padding: '8px', display: 'flex', alignItems: 'center' }}
        >
          <Menu size={22} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', padding: '2px' }}>
            <img src="/RNGPIT.png" alt="RNGPIT Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>RNGPIT</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Star size={14} style={{ color: '#f59e0b' }} />
          <span style={{ fontSize: '0.85rem', color: '#f59e0b', fontWeight: '700' }}>{faculty.reward_points}</span>
        </div>
      </div>

      {/* ── Sidebar overlay (mobile) ── */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Close btn (mobile only) */}
        <button
          onClick={closeSidebar}
          style={{
            display: 'none', position: 'absolute', top: '12px', right: '12px',
            background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px',
            cursor: 'pointer', color: 'var(--text-muted)', padding: '6px'
          }}
          className="sidebar-close-btn"
        >
          <X size={18} />
        </button>

        {/* Logo */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px', overflow: 'hidden' }}>
              <img src="/RNGPIT.png" alt="RNGPIT Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1rem', color: 'var(--text-primary)' }}>RNGPIT</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Consultancy Portal</div>
            </div>
          </div>
        </div>

        {/* Faculty Info */}
        <div style={{ padding: '1.2rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,.15),rgba(6,182,212,.08))', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(99,102,241,.2)' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', fontWeight: '700', color: 'white', marginBottom: '0.7rem' }}>
              {faculty.full_name[0].toUpperCase()}
            </div>
            <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>{faculty.full_name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' }}>{faculty.department || 'Faculty'}</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245,158,11,.15)', border: '1px solid rgba(245,158,11,.3)', borderRadius: '20px', padding: '4px 10px', marginTop: '8px' }}>
              <Star size={12} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontWeight: '600' }}>{faculty.reward_points} pts</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {[
            { tab: 'students' as const, icon: Users, label: 'My Students', badge: students.length, badgeColor: 'rgba(99,102,241,0.2)', badgeText: 'var(--primary-light)' },
            { tab: 'rewards' as const, icon: Award, label: 'Rewards & Badges', badge: achievements.length || null, badgeColor: 'rgba(245,158,11,0.2)', badgeText: '#f59e0b' },
          ].map(item => (
            <button
              key={item.tab}
              onClick={() => { setActiveTab(item.tab); closeSidebar(); }}
              className={`sidebar-link ${activeTab === item.tab ? 'active' : ''}`}
              style={{ background: activeTab === item.tab ? undefined : 'none', border: activeTab === item.tab ? undefined : 'none', cursor: 'pointer', width: 'calc(100% - 16px)', textAlign: 'left' }}
            >
              <item.icon size={18} /> {item.label}
              {item.badge ? (
                <span style={{ marginLeft: 'auto', background: item.badgeColor, borderRadius: '12px', padding: '2px 8px', fontSize: '0.75rem', color: item.badgeText }}>
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </nav>

        {/* Next milestone */}
        {nextMilestone && (
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
              <TrendingUp size={12} style={{ display: 'inline', marginRight: '4px' }} />
              Next: {nextMilestone.milestone_name}
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min((faculty.reward_points / nextMilestone.points_required) * 100, 100)}%` }} />
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {faculty.reward_points} / {nextMilestone.points_required} pts
            </div>
          </div>
        )}

        {/* Logout */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <form action={logout}>
            <button type="submit" className="btn-danger" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content" style={{ flex: 1, background: 'var(--bg-dark)' }}>
        {activeTab === 'students' ? (
          <>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg,#f1f5f9,#818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                My Students
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Stats */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
              {[
                { label: 'Total', value: stats.total, color: '#818cf8', icon: Users },
                { label: 'New Leads', value: stats.new, color: '#94a3b8', icon: Bell },
                { label: 'Consulted', value: stats.consulted, color: '#60a5fa', icon: Phone },
                { label: 'Converted', value: stats.converted, color: '#34d399', icon: Award },
              ].map(stat => (
                <div key={stat.label} className="stat-card">
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.6rem' }}>
                    <stat.icon size={16} style={{ color: stat.color }} />
                  </div>
                  <div style={{ fontSize: '1.8rem', fontWeight: '800', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Filters */}
            <div className="filters-row" style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.2rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  className="input-field"
                  style={{ paddingLeft: '42px' }}
                  placeholder="Search name, school, mobile..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              <select className="input-field" style={{ width: 'auto', minWidth: '130px' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                {['New','Contacted','Interested','Registered','Admitted'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="input-field" style={{ width: 'auto', minWidth: '120px' }} value={streamFilter} onChange={e => setStreamFilter(e.target.value)}>
                <option value="">All Streams</option>
                <option value="A">Stream A</option>
                <option value="B">Stream B</option>
              </select>
              {(search || statusFilter || streamFilter) && (
                <button className="btn-secondary" style={{ fontSize: '0.85rem', padding: '10px 14px' }} onClick={() => { setSearch(''); setStatusFilter(''); setStreamFilter(''); }}>
                  Clear
                </button>
              )}
            </div>

            {/* Count */}
            <div style={{ marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Showing <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{filteredStudents.length}</span> of {students.length} students
            </div>

            {/* Student cards */}
            {filteredStudents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '4rem 1rem', color: 'var(--text-muted)' }}>
                <Users size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                <p style={{ fontSize: '1rem' }}>No students found</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>Try adjusting your filters</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {filteredStudents.map(student => (
                  <StudentCard
                    key={student.id}
                    student={student}
                    onConsult={(s) => { setSelectedStudent(s); setShowConsultModal(true); }}
                    onEditClick={(s) => setEditingStudent(s)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <RewardsSidebar faculty={faculty} achievements={achievements} milestones={milestones} />
        )}
      </main>

      {/* Consultation Modal */}
      {showConsultModal && selectedStudent && (
        <ConsultationModal
          student={selectedStudent}
          facultyId={faculty.id}
          onClose={() => { setShowConsultModal(false); setSelectedStudent(null); }}
          onComplete={onConsultationComplete}
        />
      )}
      {/* Edit Modal */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => { setEditingStudent(null); window.location.reload(); }}
        />
      )}
    </div>
  )
}
