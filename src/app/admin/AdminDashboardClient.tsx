'use client'

import { useState, useMemo, useRef } from 'react'
import * as XLSX from 'xlsx'
import { logout } from '@/lib/actions/auth'
import { importStudents, deleteFaculty, updateFacultyPoints } from '@/lib/actions/consultancy'
import {
  GraduationCap, Users, Award, Phone, TrendingUp, BarChart3, Filter,
  Upload, Download, Search, LogOut, Star, Crown, ChevronDown, ChevronUp,
  Plus, Settings, Database, FileSpreadsheet, Eye, X, CheckCircle, Loader2, AlertCircle, Menu, Lock,
  Trash2, SlidersHorizontal
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import AddFacultyModal from '@/components/AddFacultyModal'
import EditFacultyModal from '@/components/EditFacultyModal'
import AdjustPointsModal from '@/components/AdjustPointsModal'
import AddStudentModal from '@/components/AddStudentModal'
import PasteDataModal from '@/components/PasteDataModal'
import ReassignModal from '@/components/ReassignModal'
import PasteFacultyModal from '@/components/PasteFacultyModal'
import ResetPasswordModal from '@/components/ResetPasswordModal'

interface Stats {
  totalStudents: number
  newStudents: number
  consultedStudents: number
  convertedStudents: number
  totalConsultations: number
  totalFaculty: number
  conversionRate: number
}

interface Props {
  adminFaculty: any
  initialStudents: any[]
  allFaculty: any[]
  stats: Stats
}

const STATUS_COLORS: Record<string, string> = {
  New: '#94a3b8',
  Contacted: '#60a5fa',
  Interested: '#fbbf24',
  Registered: '#a78bfa',
  Admitted: '#34d399',
}

const CHART_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminDashboardClient({ adminFaculty, initialStudents, allFaculty, stats }: Props) {
  const [students, setStudents] = useState(initialStudents)
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'faculty' | 'settings'>('overview')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [streamFilter, setStreamFilter] = useState('')
  const [facultyFilter, setFacultyFilter] = useState('')
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success?: boolean; message?: string } | null>(null)
  const [showAddFaculty, setShowAddFaculty] = useState(false)
  const [importData, setImportData] = useState<any[] | null>(null)
  const [importPreview, setImportPreview] = useState<any[] | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const displayName = adminFaculty.full_name?.replace(/INNOCREW/i, 'RNGPIT') || 'RNGPIT Admin'

  const [facultySearch, setFacultySearch] = useState('')
  const [facultyDeptFilter, setFacultyDeptFilter] = useState('')
  const [facultyLoginFilter, setFacultyLoginFilter] = useState('')
  const [expandedFaculty, setExpandedFaculty] = useState<string | null>(null)
  const [editingFaculty, setEditingFaculty] = useState<any | null>(null)
  const [resettingPasswordFaculty, setResettingPasswordFaculty] = useState<any | null>(null)
  const [adjustingPointsFaculty, setAdjustingPointsFaculty] = useState<any | null>(null)
  const [deletingFacultyId, setDeletingFacultyId] = useState<string | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  async function handleDeleteFaculty(facultyId: string) {
    setDeleteLoading(true)
    setDeleteError('')
    const res = await deleteFaculty(facultyId)
    if (res.error) {
      setDeleteError(res.error)
      setDeleteLoading(false)
    } else {
      window.location.reload()
    }
  }

  const [showAddSingleStudent, setShowAddSingleStudent] = useState(false)
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [showPasteFacultyModal, setShowPasteFacultyModal] = useState(false)
  const [showReassignModal, setShowReassignModal] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 100

  function toggleStudent(id: string) {
    const newSet = new Set(selectedStudents)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedStudents(newSet)
  }

  function toggleAll() {
    if (selectedStudents.size === filteredStudents.length) setSelectedStudents(new Set())
    else setSelectedStudents(new Set(filteredStudents.map(s => s.id)))
  }

  const filteredStudents = useMemo(() => {
    setCurrentPage(1) // Reset page when filters change
    return students.filter(s => {
      const matchSearch = !search || [s.full_name, s.school_name, s.student_mobile, s.interested_branch]
        .some((f: any) => String(f || '').toLowerCase().includes(search.toLowerCase()))
      const matchStatus = !statusFilter || s.status === statusFilter
      const matchStream = !streamFilter || String(s.stream || '').toUpperCase().includes(streamFilter.toUpperCase())
      const matchFaculty = !facultyFilter
        ? true
        : facultyFilter === '__unassigned__'
          ? !s.assigned_faculty_id
          : s.assigned_faculty_id === facultyFilter
      return matchSearch && matchStatus && matchStream && matchFaculty
    })
  }, [students, search, statusFilter, streamFilter, facultyFilter])

  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredStudents.slice(start, start + itemsPerPage)
  }, [filteredStudents, currentPage])

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage)

  const filteredFaculty = useMemo(() => {
    return allFaculty.filter(f => {
      const matchSearch = !facultySearch || [f.full_name, f.email, f.department].some((field: any) => String(field || '').toLowerCase().includes(facultySearch.toLowerCase()))
      const matchDept = !facultyDeptFilter || f.department === facultyDeptFilter
      const matchLogin = !facultyLoginFilter
        ? true
        : facultyLoginFilter === 'Logged In'
          ? f.password_changed
          : facultyLoginFilter === 'Not Logged In'
            ? !f.password_changed
            : facultyLoginFilter === 'No Students'
              ? (f.total_assigned === 0 || f.total_assigned == null)
              : true
      return matchSearch && matchDept && matchLogin
    })
  }, [allFaculty, facultySearch, facultyDeptFilter, facultyLoginFilter])

  // Charts data
  const facultyChartData = allFaculty.map(f => ({
    name: f.full_name.split(' ')[0],
    consultations: f.total_consultations,
    converted: f.leads_converted,
    points: f.reward_points,
  }))

  const statusDistribution = [
    { name: 'New', value: students.filter(s => s.status === 'New').length, color: STATUS_COLORS.New },
    { name: 'Contacted', value: students.filter(s => s.status === 'Contacted').length, color: STATUS_COLORS.Contacted },
    { name: 'Interested', value: students.filter(s => s.status === 'Interested').length, color: STATUS_COLORS.Interested },
    { name: 'Registered', value: students.filter(s => s.status === 'Registered').length, color: STATUS_COLORS.Registered },
    { name: 'Admitted', value: students.filter(s => s.status === 'Admitted').length, color: STATUS_COLORS.Admitted },
  ].filter(s => s.value > 0)

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet)
      setImportData(rows)
      setImportPreview(rows.slice(0, 5))
    } catch {
      setImportResult({ success: false, message: 'Failed to read file. Please use .xlsx or .csv format.' })
    } finally {
      e.target.value = '' // Clear input so the same file can be selected again
    }
  }

  async function confirmImport() {
    if (!importData) return
    setImporting(true)
    
    try {
      const mapped = importData.map((row: any) => {
        // Find keys case-insensitively
        const getVal = (possibleKeys: string[]) => {
          const key = Object.keys(row).find(k => possibleKeys.includes(k.toLowerCase().trim()))
          return key ? row[key] : ''
        }

        return {
          full_name: getVal(['full name', 'fullname', 'name', 'student name', 'candidate name']),
          school_name: getVal(['school name', 'school', 'college', 'institution']),
          student_mobile: String(getVal(['student mobile', 'mobile', 'phone', 'contact', 'student contact'])),
          parent_mobile: String(getVal(['parent mobile', 'parent contact', 'alternate number'])),
          caste_category: getVal(['caste category', 'caste', 'category', 'social category']),
          stream: String(getVal(['stream', 'group', 'major'])).toUpperCase(),
          interested_branch: getVal(['interested branch', 'branch', 'course', 'interest']),
          assigned_faculty_name: getVal(['assigned faculty', 'faculty', 'assigned to', 'counselor']),
        }
      }).filter(r => r.full_name)

      if (mapped.length === 0) {
        const headersFound = importData.length > 0 ? Object.keys(importData[0]).join(', ') : 'None'
        setImportResult({ 
          success: false, 
          message: `No valid students found. The file headers found were: [${headersFound}]. Please ensure you have a "Name" or "Full Name" column.` 
        })
        setImporting(false)
        return
      }

      const result = await importStudents(mapped)
      if (result.error) {
        setImportResult({ success: false, message: result.error })
      } else {
        setImportResult({ success: true, message: `Successfully imported ${result.count} students! Reloading...` })
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (err: any) {
      setImportResult({ success: false, message: err.message || 'Import failed' })
    } finally {
      setImporting(false)
      setImportData(null)
      setImportPreview(null)
    }
  }

  function handleCancelImport() {
    setImportData(null)
    setImportPreview(null)
  }

  function exportStudents() {
    const data = filteredStudents.map(s => ({
      'Full Name': s.full_name,
      'School Name': s.school_name || '',
      'Student Mobile': s.student_mobile || '',
      'Parent Mobile': s.parent_mobile || '',
      'Caste Category': s.caste_category || '',
      'Stream': s.stream || '',
      'Interested Branch': s.interested_branch || '',
      'Assigned Faculty': s.faculty?.full_name || '',
      'Status': s.status,
      'Total Consultations': s.total_consultations,
      'Last Consulted': s.last_consulted_at ? new Date(s.last_consulted_at).toLocaleDateString('en-IN') : '',
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Students')
    XLSX.writeFile(wb, `students_export_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  function exportFaculty() {
    const data = filteredFaculty.map(f => ({
      'Faculty Name': f.full_name,
      'Email Address': f.email,
      'Mobile Number': f.mobile || '',
      'Department': f.department || '',
      'Role': f.role,
      'Total Assigned Students': f.total_assigned,
      'Total Consultations': f.total_consultations,
      'Leads Converted': f.leads_converted,
      'Conversion Rate': f.total_assigned ? `${Math.round((f.leads_converted / f.total_assigned) * 100)}%` : '0%',
      'Reward Points': f.reward_points,
    }))
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty')
    XLSX.writeFile(wb, `faculty_export_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  function exportFacultyCredentials() {
    const data = allFaculty.map(f => {
      const cleanNameParts = f.full_name.toLowerCase().replace(/^(dr\.|mr\.|mrs\.|ms\.|prof\.)\s*/, '').split(' ')
      const firstName = cleanNameParts[0] || 'faculty'

      return {
        'Faculty Name': f.full_name,
        'Department': f.department || '-',
        'Mobile Number': f.mobile || '-',
        'Email / User ID': f.email,
        'Login Password': f.password_changed ? '[Password Changed by User]' : (f.mobile ? `${firstName}@1234` : '[Manually Set by Admin]'),
        'Account Status': f.password_changed ? 'Active / Logged In' : 'Pending First Login'
      }
    })
    const ws = XLSX.utils.json_to_sheet(data)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Faculty_Credentials')
    XLSX.writeFile(wb, `faculty_credentials_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const NAV_ITEMS = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'students', label: 'Students', icon: Users },
    { id: 'faculty', label: 'Faculty', icon: Award },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]
  
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
          <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>ADMIN</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: '700', color: 'white' }}>
            {displayName[0]}
          </div>
        </div>
      </div>

      {/* ── Sidebar overlay (mobile) ── */}
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={closeSidebar} />

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
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
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '4px', overflow: 'hidden' }}>
              <img src="/RNGPIT.png" alt="RNGPIT Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--text-primary)' }}>RNGPIT</div>
              <div style={{ fontSize: '0.7rem', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: '800' }}>
                {adminFaculty.role === 'hod' ? `HOD PORTAL - ${adminFaculty.department}` : 'ADMIN PORTAL'}
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #ef4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: '700', color: 'white' }}>
              {displayName[0]}
            </div>
            <div>
              <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.9rem' }}>{displayName}</div>
              <div style={{ color: '#f59e0b', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Crown size={10} /> {adminFaculty.role === 'hod' ? `HOD - ${adminFaculty.department}` : 'Administrator'}
              </div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0' }}>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); closeSidebar(); }}
              className={`sidebar-link ${activeTab === item.id ? 'active' : ''}`}
              style={{ background: activeTab === item.id ? undefined : 'none', border: activeTab === item.id ? undefined : 'none', cursor: 'pointer', width: 'calc(100% - 16px)', textAlign: 'left' }}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
          <form action={logout}>
            <button type="submit" className="btn-danger" style={{ width: '100%', justifyContent: 'center', fontSize: '0.85rem' }}>
              <LogOut size={16} /> Sign Out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="main-content">
        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #f1f5f9, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Admin Overview
              </h1>
              <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Complete system performance at a glance</p>
            </div>

            {/* Stats grid */}
            <div className="stats-grid" style={{ marginBottom: '2rem' }}>
              {[
                { label: 'Total Students', value: stats.totalStudents, color: '#818cf8', icon: Users },
                { label: 'New Leads', value: stats.newStudents, color: '#94a3b8', icon: Database },
                { label: 'Consultations', value: stats.totalConsultations, color: '#60a5fa', icon: Phone },
                { label: 'Converted', value: stats.convertedStudents, color: '#34d399', icon: CheckCircle },
                { label: 'Total Faculty', value: stats.totalFaculty, color: '#f59e0b', icon: Award },
                { label: 'Conversion Rate', value: `${stats.conversionRate}%`, color: '#06b6d4', icon: TrendingUp },
              ].map(stat => (
                <div key={stat.label} className="stat-card">
                  <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${stat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
                    <stat.icon size={18} style={{ color: stat.color }} />
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
              {/* Faculty Consultations Bar Chart */}
              <div className="glass-card" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Consultations per Faculty
                </h3>
                <div style={{ minWidth: '250px' }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={facultyChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                      <Bar dataKey="consultations" fill="#6366f1" radius={[4,4,0,0]} name="Consultations" />
                      <Bar dataKey="converted" fill="#10b981" radius={[4,4,0,0]} name="Converted" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Status Distribution Pie Chart */}
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                      {statusDistribution.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {statusDistribution.map(s => (
                    <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color }} />
                      {s.name}: {s.value}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '1.5rem', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={14} style={{ color: '#f59e0b' }} /> Faculty Leaderboard
              </h3>
              <div className="table-scroll">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Faculty</th>
                      <th>Students</th>
                      <th>Consultations</th>
                      <th>Converted</th>
                      <th>Rate</th>
                      <th>Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allFaculty.map((f, i) => (
                      <tr key={f.id}>
                        <td>
                          <span style={{ fontWeight: '700', color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#d97706' : 'var(--text-muted)' }}>
                            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{f.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{f.department || 'Faculty'}</div>
                        </td>
                        <td>{f.total_assigned}</td>
                        <td>{f.total_consultations}</td>
                        <td style={{ color: '#34d399' }}>{f.leads_converted}</td>
                        <td>
                          <span style={{ color: '#60a5fa' }}>
                            {f.total_assigned ? Math.round((f.leads_converted / f.total_assigned) * 100) : 0}%
                          </span>
                        </td>
                        <td>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b', fontWeight: '700' }}>
                            <Star size={12} /> {f.reward_points}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {allFaculty.length === 0 && (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No faculty members yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* STUDENTS */}
        {activeTab === 'students' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #f1f5f9, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Student Management
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>{students.length} total students</p>
              </div>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button className="btn-secondary" style={{ fontSize: '0.85rem' }} onClick={exportStudents}>
                  <Download size={16} /> Export
                </button>
                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                <button className="btn-secondary" style={{ fontSize: '0.85rem', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderColor: 'rgba(99,102,241,0.3)' }} onClick={() => setShowPasteModal(true)}>
                  <FileSpreadsheet size={16} /> Paste CSV
                </button>
                <button className="btn-secondary" style={{ fontSize: '0.85rem' }} onClick={() => fileInputRef.current?.click()}>
                  <Upload size={16} /> Excel Import
                </button>
                <button className="btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => setShowAddSingleStudent(true)}>
                  <Plus size={16} /> Add Single
                </button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
              </div>
            </div>

            {/* Reassign Selection Action */}
            {selectedStudents.size > 0 && (
              <div className="animate-slide-up" style={{ padding: '12px 16px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '10px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', color: '#818cf8', fontWeight: '600' }}>
                  {selectedStudents.size} student({selectedStudents.size > 1 ? 's' : ''}) selected
                </span>
                <button className="btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }} onClick={() => setShowReassignModal(true)}>
                  <Users size={14} /> Reassign Faculty
                </button>
              </div>
            )}

            {/* Import result */}
            {importResult && (
              <div style={{
                background: importResult.success ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${importResult.success ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                borderRadius: '10px', padding: '12px 16px', marginBottom: '1rem',
                display: 'flex', alignItems: 'center', gap: '10px', color: importResult.success ? '#34d399' : '#f87171'
              }}>
                {importResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                {importResult.message}
                <button onClick={() => setImportResult(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', marginLeft: 'auto', padding: '2px' }}><X size={16} /></button>
              </div>
            )}

            {/* Import Preview Modal */}
            {importPreview && (
              <div className="modal-overlay">
                <div className="glass-card animate-slide-up" style={{ maxWidth: '700px', width: '100%', padding: '2rem' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
                    Import Preview (first 5 rows)
                  </h3>
                  <div className="table-scroll" style={{ marginBottom: '1.5rem' }}>
                    <table className="data-table">
                      <thead>
                        <tr>{Object.keys(importPreview[0] || {}).slice(0, 6).map(k => <th key={k}>{k}</th>)}</tr>
                      </thead>
                      <tbody>
                        {importPreview.map((row, i) => (
                          <tr key={i}>{Object.values(row).slice(0, 6).map((v: any, j) => <td key={j}>{String(v)}</td>)}</tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button className="btn-secondary" onClick={handleCancelImport}>Cancel</button>
                    <button className="btn-primary" onClick={confirmImport} disabled={importing}>
                      {importing ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Importing...</> : <><CheckCircle size={16} /> Confirm Import</>}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="filters-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input className="input-field" style={{ paddingLeft: '42px' }} placeholder="Search students..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <select className="input-field" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">All Status</option>
                {['New', 'Contacted', 'Interested', 'Registered', 'Admitted'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select className="input-field" style={{ width: 'auto' }} value={streamFilter} onChange={e => setStreamFilter(e.target.value)}>
                <option value="">All Streams</option>
                <option value="A">Stream A</option>
                <option value="B">Stream B</option>
              </select>
              <select className="input-field" style={{ width: 'auto' }} value={facultyFilter} onChange={e => setFacultyFilter(e.target.value)}>
                <option value="">All Faculty</option>
                <option value="__unassigned__">⚠️ Unassigned Students</option>
                {allFaculty.map(f => <option key={f.id} value={f.id}>{f.full_name}</option>)}
              </select>
            </div>

            <div style={{ marginBottom: '0.8rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Showing <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{filteredStudents.length}</span> of {students.length}
            </div>

            {/* Students table */}
            <div className="glass-card table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40px', textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={paginatedStudents.length > 0 && paginatedStudents.every(s => selectedStudents.has(s.id))} 
                        onChange={() => {
                          const allSelected = paginatedStudents.every(s => selectedStudents.has(s.id))
                          const newSet = new Set(selectedStudents)
                          paginatedStudents.forEach(s => {
                            if (allSelected) newSet.delete(s.id)
                            else newSet.add(s.id)
                          })
                          setSelectedStudents(newSet)
                        }} 
                      />
                    </th>
                    <th>Student</th>
                    <th>School</th>
                    <th>Stream</th>
                    <th>Branch</th>
                    <th>Status</th>
                    <th>Faculty</th>
                    <th>Consults</th>
                    <th>Last Contacted</th>
                    <th>Mobile</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedStudents.map(student => (
                    <tr key={student.id} style={{ background: selectedStudents.has(student.id) ? 'rgba(99,102,241,0.05)' : 'transparent' }}>
                      <td style={{ textAlign: 'center' }}>
                        <input 
                          type="checkbox" 
                          checked={selectedStudents.has(student.id)} 
                          onChange={() => toggleStudent(student.id)} 
                        />
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{student.full_name}</div>
                        {student.caste_category && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{student.caste_category}</div>}
                      </td>
                      <td>{student.school_name || '-'}</td>
                      <td>{student.stream ? <span style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa', padding: '2px 8px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '600' }}>Str {student.stream}</span> : '-'}</td>
                      <td>{student.interested_branch || '-'}</td>
                      <td>
                        <span style={{
                          fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '20px',
                          background: `${STATUS_COLORS[student.status]}20`,
                          color: STATUS_COLORS[student.status],
                          border: `1px solid ${STATUS_COLORS[student.status]}40`,
                          whiteSpace: 'nowrap'
                        }}>
                          {student.status}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{student.faculty?.full_name || <span style={{ color: 'var(--text-muted)' }}>Unassigned</span>}</td>
                      <td style={{ textAlign: 'center', color: '#60a5fa', fontWeight: '600' }}>{student.total_consultations}</td>
                      <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{student.last_consulted_at ? new Date(student.last_consulted_at).toLocaleDateString('en-IN') : '-'}</td>
                      <td>
                        {student.student_mobile ? (
                          <a href={`tel:${student.student_mobile}`} style={{ color: 'var(--primary-light)', textDecoration: 'none', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                            <Phone size={12} /> {student.student_mobile}
                          </a>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                  {filteredStudents.length === 0 && (
                    <tr><td colSpan={10} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No students found</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '1.5rem', marginBottom: '1rem' }}>
                <button 
                  className="btn-secondary" 
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Previous
                </button>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  Page <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{currentPage}</span> of {totalPages}
                </div>
                <button 
                  className="btn-secondary" 
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}

        {/* FACULTY */}
        {activeTab === 'faculty' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #f1f5f9, #f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Faculty Management
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>{allFaculty.length} team members</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button className="btn-secondary" onClick={exportFaculty}>
                  <Download size={16} /> Export Data
                </button>
                <button className="btn-secondary" onClick={() => setShowPasteFacultyModal(true)}>
                  <Upload size={16} /> Paste Data
                </button>
                <button className="btn-primary" onClick={() => setShowAddFaculty(true)}>
                  <Plus size={16} /> Add Faculty
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: '300px', maxWidth: '400px' }}>
                <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input className="input-field" style={{ paddingLeft: '42px', width: '100%' }} placeholder="Search faculty by name, email..." value={facultySearch} onChange={e => setFacultySearch(e.target.value)} />
              </div>
              <select 
                className="input-field" 
                style={{ width: 'auto', minWidth: '180px' }} 
                value={facultyDeptFilter} 
                onChange={e => setFacultyDeptFilter(e.target.value)}
                disabled={adminFaculty.role === 'hod'}
              >
                <option value="">{adminFaculty.role === 'hod' ? adminFaculty.department : 'All Departments'}</option>
                {adminFaculty.role !== 'hod' && ['CSE', 'Chemical', 'Mechanical', 'IT', 'Civil', 'MBA', 'MSCIT', 'Electrical', 'Librarian', 'CLERK', 'Pharmacy', 'S&H', 'Admin'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <select className="input-field" style={{ width: 'auto', minWidth: '180px' }} value={facultyLoginFilter} onChange={e => setFacultyLoginFilter(e.target.value)}>
                <option value="">All Login Status</option>
                <option value="Logged In">Logged In</option>
                <option value="Not Logged In">Not Logged In</option>
                <option value="No Students">⚠️ No Students Assigned</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredFaculty.map((f, i) => {
                const assignedStudents = students.filter(s => s.assigned_faculty_id === f.id)
                const isExpanded = expandedFaculty === f.id
                
                return (
                  <div key={f.id} className="glass-card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flex: 1, minWidth: '300px' }}>
                        <div style={{
                          width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
                          background: `linear-gradient(135deg, ${CHART_COLORS[i % CHART_COLORS.length]}, ${CHART_COLORS[(i + 1) % CHART_COLORS.length]})`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '1.3rem', fontWeight: '700', color: 'white'
                        }}>
                          {f.full_name[0]}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)' }}>{f.full_name}</span>
                            {i === 0 && !facultySearch && !facultyDeptFilter && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(245,158,11,0.2)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', whiteSpace: 'nowrap' }}>🏆 Top Performer</span>}
                            {f.password_changed && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(52,211,153,0.15)', color: '#34d399', border: '1px solid rgba(52,211,153,0.3)', whiteSpace: 'nowrap' }}>✅ Account Active / Logged In</span>}
                            {f.last_login && new Date().getTime() - new Date(f.last_login).getTime() < 15 * 60 * 1000 && <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '10px', background: 'rgba(96,165,250,0.15)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.3)', whiteSpace: 'nowrap' }}>🟢 Online</span>}
                          </div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                            <span>{f.email}</span>
                            {f.mobile && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ color: 'var(--text-secondary)' }}>• {f.mobile}</span>
                                <a href={`tel:${f.mobile}`} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px', borderRadius: '50%', background: 'rgba(96,165,250,0.1)', color: '#60a5fa', textDecoration: 'none', transition: 'all 0.2s', marginLeft: '4px' }} title="Call Faculty">
                                  <Phone size={12} />
                                </a>
                              </div>
                            )}
                            {f.department && <span style={{ color: 'var(--text-secondary)' }}>• {f.department}</span>}
                          </div>
                          
                          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                            {[
                              { label: 'Students', value: f.total_assigned, color: '#818cf8' },
                              { label: 'Consults', value: f.total_consultations, color: '#60a5fa' },
                              { label: 'Converted', value: f.leads_converted, color: '#34d399' },
                              { label: 'Rate', value: `${f.total_assigned ? Math.round((f.leads_converted / f.total_assigned) * 100) : 0}%`, color: '#06b6d4' },
                              { label: 'Points', value: f.reward_points, color: '#f59e0b' },
                            ].map(stat => (
                              <div key={stat.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '1.1rem', fontWeight: '800', color: stat.color }}>{stat.value}</div>
                                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{stat.label}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                        <button 
                          onClick={() => setEditingFaculty(f)}
                          style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            color: 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Edit Details</span>
                        </button>

                        {/* Adjust Points button */}
                        <button
                          onClick={() => setAdjustingPointsFaculty(f)}
                          style={{
                            background: 'rgba(245,158,11,0.07)',
                            border: '1px solid rgba(245,158,11,0.25)',
                            borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            color: '#f59e0b', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <Star size={14} />
                          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Adjust Points</span>
                        </button>

                        <button 
                          onClick={() => setResettingPasswordFaculty(f)}
                          style={{
                            background: 'rgba(239,68,68,0.05)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            color: '#f87171', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <Lock size={14} />
                          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Reset Password</span>
                        </button>

                        {/* Delete Faculty — with inline confirmation */}
                        {deletingFacultyId === f.id ? (
                          <div style={{ borderRadius: '8px', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', padding: '10px 12px' }}>
                            {deleteError && <p style={{ color: '#f87171', fontSize: '0.78rem', marginBottom: '6px' }}>{deleteError}</p>}
                            <p style={{ color: '#f87171', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px', textAlign: 'center' }}>
                              ⚠️ Delete {f.full_name}? Their students will be unassigned.
                            </p>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => { setDeletingFacultyId(null); setDeleteError('') }}
                                style={{ flex: 1, padding: '7px', borderRadius: '6px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleDeleteFaculty(f.id)}
                                disabled={deleteLoading}
                                style={{ flex: 1, padding: '7px', borderRadius: '6px', border: 'none', background: '#ef4444', color: 'white', cursor: deleteLoading ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                              >
                                {deleteLoading ? <Loader2 size={13} className="animate-spin" /> : <><Trash2 size={13} /> Confirm Delete</>}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setDeletingFacultyId(f.id); setDeleteError('') }}
                            style={{
                              background: 'rgba(239,68,68,0.04)',
                              border: '1px solid rgba(239,68,68,0.15)',
                              borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                              color: '#f87171', cursor: 'pointer', transition: 'all 0.2s', opacity: 0.7
                            }}
                          >
                            <Trash2 size={14} />
                            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Delete Faculty</span>
                          </button>
                        )}

                        <button 
                          onClick={() => setExpandedFaculty(isExpanded ? null : f.id)}
                          style={{
                            background: isExpanded ? 'rgba(99,102,241,0.1)' : 'transparent',
                            border: `1px solid ${isExpanded ? 'rgba(99,102,241,0.3)' : 'var(--border)'}`,
                            borderRadius: '8px', padding: '8px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                            color: isExpanded ? 'var(--primary-light)' : 'var(--text-primary)', cursor: 'pointer', transition: 'all 0.2s'
                          }}
                        >
                          <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>View Students</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Achievements row below stats */}
                    {f.achievements && f.achievements.length > 0 && (
                      <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {f.achievements.map((a: any) => (
                          <span key={a.id} style={{
                            fontSize: '0.75rem', padding: '4px 10px', borderRadius: '20px',
                            background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)', whiteSpace: 'nowrap'
                          }}>
                            🏆 {a.milestone_name}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Expandable Students List */}
                    {isExpanded && (
                      <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px dashed var(--border)' }} className="animate-slide-up">
                        <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-primary)' }}>
                          Assigned Students ({assignedStudents.length})
                        </h4>
                        
                        {assignedStudents.length > 0 ? (
                          <div className="table-scroll" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            <table className="data-table" style={{ fontSize: '0.85rem' }}>
                              <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                  <th>Name</th>
                                  <th>Status</th>
                                  <th>Consults</th>
                                  <th>Last Contact</th>
                                  <th>Mobile</th>
                                  <th>Stream</th>
                                  <th>Branch</th>
                                </tr>
                              </thead>
                              <tbody>
                                {assignedStudents.map(student => (
                                  <tr key={student.id}>
                                    <td style={{ fontWeight: '600' }}>{student.full_name}</td>
                                    <td>
                                      <span style={{
                                        fontSize: '0.7rem', fontWeight: '700', padding: '2px 8px', borderRadius: '12px',
                                        background: `${STATUS_COLORS[student.status]}20`, color: STATUS_COLORS[student.status]
                                      }}>
                                        {student.status}
                                      </span>
                                    </td>
                                    <td style={{ textAlign: 'center', fontWeight: '600', color: '#60a5fa' }}>{student.total_consultations}</td>
                                    <td style={{ color: 'var(--text-muted)' }}>{student.last_consulted_at ? new Date(student.last_consulted_at).toLocaleDateString('en-IN') : '-'}</td>
                                    <td>{student.student_mobile || '-'}</td>
                                    <td>{student.stream || '-'}</td>
                                    <td>{student.interested_branch || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                            <Users size={32} style={{ opacity: 0.2, margin: '0 auto 0.5rem' }} />
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No students assigned to this faculty yet.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
              {allFaculty.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  <Users size={48} style={{ opacity: 0.3, margin: '0 auto 1rem' }} />
                  <p>No faculty members yet. Add your first faculty member!</p>
                </div>
              )}
            </div>
            {editingFaculty && (
              <EditFacultyModal faculty={editingFaculty} onClose={() => setEditingFaculty(null)} />
            )}
            {adjustingPointsFaculty && (
              <AdjustPointsModal faculty={adjustingPointsFaculty} onClose={() => setAdjustingPointsFaculty(null)} />
            )}
          </div>
        )}

        {/* SETTINGS */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: '600px' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: '800', background: 'linear-gradient(135deg, #f1f5f9, #818cf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '2rem' }}>
              Settings
            </h1>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>Import Student Data</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                  Upload an Excel (.xlsx) or CSV file. Required columns: Full Name, School Name, Student Mobile, Parent Mobile, Caste Category, Stream (A/B), Interested Branch, Assigned Faculty.
                </p>
                <button className="btn-primary" onClick={() => { fileInputRef.current?.click(); setActiveTab('students'); }}>
                  <FileSpreadsheet size={16} /> Import from Excel
                </button>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>Export Data</h3>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button className="btn-secondary" onClick={() => { setActiveTab('students'); setTimeout(exportStudents, 100); }}>
                    <Download size={16} /> Export Students
                  </button>
                  <button className="btn-secondary" onClick={exportFacultyCredentials}>
                    <Download size={16} /> Export Faculty Credentials
                  </button>
                </div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>Manage Faculty</h3>
                <button className="btn-primary" onClick={() => { setShowAddFaculty(true) }}>
                  <Plus size={16} /> Add New Faculty/Admin
                </button>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Point System</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Current rewards configuration</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {[
                    { action: 'Outbound Call', points: '1 Point' },
                    { action: 'Counseling Success', points: '2 Points' },
                    { action: 'Adm (Mother Dept)', points: '25 Points' },
                    { action: 'Adm (Other Dept)', points: '15 Points' },
                  ].map(item => (
                    <div key={item.action} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{item.action}</span>
                      <span style={{ color: '#f59e0b', fontWeight: '700', fontSize: '0.85rem' }}>{item.points}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modals */}
      {showAddFaculty && <AddFacultyModal adminFaculty={adminFaculty} onClose={() => setShowAddFaculty(false)} onSuccess={() => { setShowAddFaculty(false); window.location.reload(); }} />}
      {showAddSingleStudent && <AddStudentModal onClose={() => setShowAddSingleStudent(false)} allFaculty={allFaculty} />}
      {showPasteModal && <PasteDataModal onClose={() => setShowPasteModal(false)} />}
      {showPasteFacultyModal && <PasteFacultyModal adminFaculty={adminFaculty} onClose={() => setShowPasteFacultyModal(false)} onSuccess={() => { setShowPasteFacultyModal(false); window.location.reload(); }} />}
      {showReassignModal && <ReassignModal onClose={() => { setShowReassignModal(false); setSelectedStudents(new Set()) }} studentIds={Array.from(selectedStudents)} allFaculty={allFaculty} />}
      {resettingPasswordFaculty && <ResetPasswordModal faculty={resettingPasswordFaculty} onClose={() => setResettingPasswordFaculty(null)} />}
    </div>
  )
}
