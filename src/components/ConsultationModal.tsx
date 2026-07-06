'use client'

import { useState, useRef } from 'react'
import { Student } from '@/lib/types'
import { submitConsultation } from '@/lib/actions/consultancy'
import {
  X, Mic, MicOff, Loader2, CheckCircle, Phone, User,
  BookOpen, Star, Calendar, ChevronRight, Sparkles, Volume2
} from 'lucide-react'

interface Props {
  student: Student
  facultyId: string
  onClose: () => void
  onComplete: (studentId: string, newStatus: string, interestedBranch?: string) => void
}

const BRANCH_OPTIONS = [
  'Chemical Engineering',
  'Mechanical Engineering',
  'Computer Science & Engineering',
  'Electrical Engineering',
  'Civil Engineering',
  'Information Technology',
  'B. Voc Software Development',
  'B. Voc Production Technology',
  'B. Voc Solar and Renewable Energy',
  'B. Voc Industrial Chemistry',
  'B. Voc Animation and VFX',
  'B. Voc Building and Construction Technology',
  'B. Voc Wealth Management',
  'B.Tech in Mechanical Engineering (D2D)',
  'B.Tech in Chemical Engineering (D2D)',
  'B.Tech in Computer Science & Engineering (D2D)',
  'B.Tech in Electrical Engineering (D2D)',
  'B.Tech in Civil Engineering (D2D)',
  'B.Tech in Information Technology (D2D)',
  'MBA in Logistics & Supply Chain Management',
  'Integrated M.Sc. IT',
  'MBA (Logistics and Supply Chain Management)',
  'Integrated MBA',
  'MBA (Online Mode)',
  'MCA (Online Mode)'
]

export default function ConsultationModal({ student, facultyId, onClose, onComplete }: Props) {
  const [callStatus, setCallStatus] = useState('')
  const [selectedBranch, setSelectedBranch] = useState(student.interested_branch || '')
  const [interestLevel, setInterestLevel] = useState('')
  const [remarks, setRemarks] = useState('')
  const [language, setLanguage] = useState('English')
  const [followupDate, setFollowupDate] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pointsEarned, setPointsEarned] = useState(0)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [error, setError] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [verifying, setVerifying] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      setRecordingDuration(0)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        await transcribeAudio()
      }

      mediaRecorder.start()
      setIsRecording(true)
      timerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000)
    } catch {
      setError('Microphone access denied. Please allow microphone access and try again.')
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  async function transcribeAudio() {
    setIsTranscribing(true)
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('language', language)

      const response = await fetch('/api/transcribe', { method: 'POST', body: formData })
      const result = await response.json()

      if (result.text) {
        setRemarks(prev => prev ? `${prev} ${result.text}` : result.text)
      } else {
        setError('Transcription failed. Please type your remarks manually.')
      }
    } catch {
      setError('Transcription error. Please type your remarks manually.')
    } finally {
      setIsTranscribing(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!callStatus) { setError('Please select a call status.'); return }
    if (!interestLevel) { setError('Please select an interest level.'); return }
    if (callStatus === 'Interested' && !selectedBranch) {
      setError('Please select an interested branch.');
      return
    }
    if (callStatus === 'Admitted' && !receiptFile) {
      setError('Please upload the admission fee receipt image/pdf.')
      return
    }

    setSubmitting(true)
    setError('')

    if (callStatus === 'Admitted' && receiptFile) {
      setVerifying(true)
      try {
        const reader = new FileReader()
        const b64 = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(receiptFile)
        })

        const res = await fetch('/api/verify-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ receiptDataUrl: b64 })
        })
        const data = await res.json()
        if (!data.success) {
           setError('AI Verification Failed: ' + (data.error || 'Missing Signature on Receipt'))
           setSubmitting(false)
           setVerifying(false)
           return
        }
      } catch (err: any) {
         setError('Failed to process receipt: ' + err.message)
         setSubmitting(false)
         setVerifying(false)
         return
      }
      setVerifying(false)
    }

    const result = await submitConsultation({
      student_id: student.id,
      call_status: callStatus,
      interest_level: interestLevel,
      remarks,
      language_used: language,
      next_followup_date: followupDate || undefined,
      interested_branch: callStatus === 'Interested' ? selectedBranch : undefined,
    })

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
      return
    }

    setPointsEarned(result.points_earned || 10)
    setSubmitted(true)
    setTimeout(() => onComplete(student.id, callStatus, callStatus === 'Interested' ? selectedBranch : undefined), 2500)
  }

  const formatDuration = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, '0')}:${(secs % 60).toString().padStart(2, '0')}`

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="glass-card animate-slide-up"
        style={{ width: '100%', maxWidth: '580px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--primary), var(--primary-light))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', fontWeight: '700', color: 'white'
            }}>
              {student.full_name[0]}
            </div>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                Consultation Record
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.full_name}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
            <X size={22} />
          </button>
        </div>

        {submitted ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 1rem',
              background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CheckCircle size={40} style={{ color: '#10b981' }} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              Consultation Saved!
            </h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Great job! Your consultation has been recorded.
            </p>
            <div style={{
              background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: '16px', padding: '1rem 1.5rem', display: 'inline-flex', alignItems: 'center', gap: '10px'
            }}>
              <Sparkles size={20} style={{ color: '#f59e0b' }} />
              <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f59e0b' }}>+{pointsEarned} Points Earned!</span>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Student mini-info */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              {[
                { icon: Phone, label: student.student_mobile, href: `tel:${student.student_mobile}` },
                { icon: BookOpen, label: student.interested_branch },
                { icon: Star, label: student.stream ? `Stream ${student.stream}` : null },
              ].filter(i => i.label).map((item, idx) => (
                item.href ? (
                  <a key={idx} href={item.href} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(var(--primary-rgb),0.1)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', color: 'var(--primary-light)', textDecoration: 'none', border: '1px solid rgba(var(--primary-rgb),0.2)' }}>
                    <item.icon size={13} /> {item.label}
                  </a>
                ) : (
                  <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8rem', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                    <item.icon size={13} /> {item.label}
                  </span>
                )
              ))}
            </div>

            {/* Call Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Call Status *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '8px' }}>
                {['Interested', 'Not Interested', 'Callback', 'Registered', 'Admitted', 'No Answer', 'Other'].map(status => (
                  <button
                    key={status} type="button"
                    onClick={() => setCallStatus(status)}
                    style={{
                      padding: '10px 12px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: '600',
                      cursor: 'pointer', transition: 'all 0.2s', border: '1px solid',
                      background: callStatus === status ? 'rgba(var(--primary-rgb),0.1)' : '#f8fafc',
                      borderColor: callStatus === status ? 'rgba(var(--primary-rgb),0.5)' : 'var(--border)',
                      color: callStatus === status ? 'var(--primary-light)' : 'var(--text-secondary)',
                    }}
                  >
                    {status === 'Interested' ? 'Interested in RNGPIT' : status}
                  </button>
                ))}
              </div>

              {callStatus === 'Interested' && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(var(--primary-rgb),0.05)', borderRadius: '12px', border: '1px dashed rgba(var(--primary-rgb),0.3)' }} className="animate-slide-up">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary-light)', marginBottom: '8px' }}>
                    Select Interested Branch *
                  </label>
                  <select
                    className="input-field"
                    style={{ width: '100%', padding: '10px', borderRadius: '10px', background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                    value={selectedBranch}
                    onChange={e => setSelectedBranch(e.target.value)}
                  >
                    <option value="">-- Choose a Branch --</option>
                    {BRANCH_OPTIONS.map(branch => (
                      <option key={branch} value={branch}>{branch}</option>
                    ))}
                  </select>
                </div>
              )}

              {callStatus === 'Admitted' && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: '12px', border: '1px dashed rgba(16,185,129,0.3)' }} className="animate-slide-up">
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#10b981', marginBottom: '8px' }}>
                    Upload Admission Fee Receipt Image *
                  </label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Must contain a manual signature. Handled via NVIDIA NIM Llama Vision AI. Only images (JPG, PNG) are supported.
                  </p>
                  <input type="file" accept="image/png, image/jpeg, image/webp, image/jpg" className="form-input" onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      if (file.type === 'application/pdf') {
                        setError('PDFs are not supported by the AI Vision Model. Please take a screenshot or upload an Image (JPG/PNG).')
                        setReceiptFile(null)
                        e.target.value = ''
                        return
                      }
                      setReceiptFile(file)
                      setError('')
                    }
                  }} />
                </div>
              )}
            </div>

            {/* Interest Level */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                Interest Level *
              </label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[
                  { label: 'High', color: '#10b981' },
                  { label: 'Medium', color: '#f59e0b' },
                  { label: 'Low', color: '#ef4444' },
                ].map(({ label, color }) => (
                  <button
                    key={label} type="button"
                    onClick={() => setInterestLevel(label)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '10px', fontSize: '0.9rem', fontWeight: '700',
                      cursor: 'pointer', transition: 'all 0.2s', border: '1px solid',
                      background: interestLevel === label ? `${color}20` : '#f8fafc',
                      borderColor: interestLevel === label ? `${color}60` : 'var(--border)',
                      color: interestLevel === label ? color : 'var(--text-secondary)',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Remarks with Voice */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  Remarks
                </label>
                {/* Language selector */}
                <select
                  className="input-field"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                  value={language}
                  onChange={e => setLanguage(e.target.value)}
                >
                  <option>English</option>
                  <option>Hindi</option>
                  <option>Gujarati</option>
                </select>
              </div>

              <textarea
                className="input-field"
                style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                placeholder="Type or use voice input for remarks..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
              />

              {/* Voice controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                {isRecording ? (
                  <>
                    <button type="button" onClick={stopRecording} className="btn-danger" style={{ padding: '8px 16px' }}>
                      <MicOff size={16} className="animate-recording" style={{ animation: 'recording-pulse 1.5s ease-in-out infinite' }} />
                      Stop Recording
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', height: '24px', alignItems: 'flex-end', gap: '3px' }}>
                        {[1,2,3,4,5].map(i => (
                          <div key={i} className="wave-bar" style={{ height: '100%', animationDelay: `${i * 0.1}s`, backgroundColor: '#ef4444' }} />
                        ))}
                      </div>
                      <span style={{ color: '#f87171', fontWeight: '600', fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums' }}>
                        {formatDuration(recordingDuration)}
                      </span>
                    </div>
                  </>
                ) : isTranscribing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                    Transcribing audio...
                  </div>
                ) : (
                  <button type="button" onClick={startRecording} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
                    <Mic size={16} />
                    Voice Input ({language})
                  </button>
                )}
                {remarks && (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {remarks.length} chars
                  </span>
                )}
              </div>
            </div>

            {/* Follow-up Date */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                <Calendar size={14} style={{ display: 'inline', marginRight: '6px' }} />
                Next Follow-up Date (optional)
              </label>
              <input
                className="input-field"
                type="date"
                value={followupDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setFollowupDate(e.target.value)}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '12px 16px', color: '#f87171', fontSize: '0.85rem' }}>
                {error}
              </div>
            )}

            {/* Submit */}
            <div style={{ display: 'flex', gap: '10px', paddingTop: '0.5rem' }}>
              <button type="button" className="btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" style={{ flex: 2, justifyContent: 'center' }} disabled={submitting || verifying}>
                {verifying ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Verifying Receipt...</>
                ) : submitting ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>
                ) : (
                  <><CheckCircle size={16} /> Save Consultation</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
