'use client'
import { useState, useEffect, ReactNode, ChangeEvent, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { OnboardingProfile } from '@/lib/types'

// ─── TYPES ──────────────────────────────────────────────────────
type Profile = OnboardingProfile

interface TypewriterProps {
  onDone: () => void
}

interface StepProps {
  data: Profile
  onChange: (key: keyof Profile, value: any) => void
  onNext: () => void
  onBack?: () => void
}

// ─── TYPEWRITER COMPONENT ───────────────────────────────────────
function Typewriter({ onDone }: TypewriterProps) {
  const [display, setDisplay] = useState<string>('')
  const [phase, setPhase] = useState<string>('typing1')
  const [name, setName] = useState<string>('there')

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('auron_temp') || '{}')
    if (stored.name) setName(stored.name)
  }, [])

  const line1 = `Hi, ${name}!`
  const line2 = "Let's plan your route to a placement year."

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (phase === 'typing1') {
      if (display.length < line1.length) {
        timeout = setTimeout(() => {
          setDisplay(line1.slice(0, display.length + 1))
        }, 55)
      } else {
        timeout = setTimeout(() => setPhase('pause1'), 1200)
      }
    } else if (phase === 'pause1') {
      timeout = setTimeout(() => setPhase('erasing1'), 300)
    } else if (phase === 'erasing1') {
      if (display.length > 0) {
        timeout = setTimeout(() => {
          setDisplay(display.slice(0, -1))
        }, 30)
      } else {
        timeout = setTimeout(() => setPhase('typing2'), 300)
      }
    } else if (phase === 'typing2') {
      if (display.length < line2.length) {
        timeout = setTimeout(() => {
          setDisplay(line2.slice(0, display.length + 1))
        }, 45)
      } else {
        timeout = setTimeout(() => setPhase('pause2'), 600)
      }
    } else if (phase === 'pause2') {
      timeout = setTimeout(() => setPhase('erasing2'), 300)
    } else if (phase === 'erasing2') {
      if (display.length > 0) {
        timeout = setTimeout(() => {
          setDisplay(display.slice(0, -1))
        }, 30)
      } else {
        timeout = setTimeout(() => setPhase('done'), 300)
      }
    } else if (phase === 'done') {
      onDone()
    }

    return () => clearTimeout(timeout)
  }, [display, phase, onDone, line1, line2])

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F0E8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px', padding: '20px' }}>
        <h1 style={{
          fontSize: '42px',
          color: '#3D1F00',
          minHeight: '60px',
          lineHeight: '1.3'
        }}>
          {display}
          <span style={{
            borderRight: '3px solid #3D1F00',
            marginLeft: '2px',
            animation: 'blink 1s infinite'
          }} />
        </h1>
        <style>{`
          @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  )
}

// ─── STYLES ──────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#F5F0E8',
    fontFamily: 'Georgia, serif',
    display: 'flex' as const,
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: '40px 20px'
  },
  card: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '540px',
    boxShadow: '0 4px 24px hsla(0, 0%, 0%, 0.08)'
  },
  label: {
    display: 'block' as const,
    fontSize: '12px',
    color: '#8B6A50',
    marginBottom: '6px',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid hsla(0, 0%, 0%, 0.08)',
    borderRadius: '8px',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: '20px',
    color: '#3d1f00'     
  },
  select: {
    width: '100%',
    padding: '12px 14px',
    border: '1px solid hsla(0, 0%, 0%, 0.08)',
    borderRadius: '8px',
    fontSize: '15px',
    fontFamily: 'Georgia, serif',
    outline: 'none',
    boxSizing: 'border-box' as const,
    marginBottom: '20px',
    background: 'white',
    color: '#3d1f00'
  },
  btn: {
    width: '100%',
    background: '#3D1F00',
    color: 'white',
    border: 'none',
    padding: '14px',
    borderRadius: '10px',
    fontSize: '16px',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    marginTop: '8px'
  },
  btnBack: {
    width: '100%',
    background: 'transparent',
    color: '#8B6A50',
    border: '1px solid #DDD',
    padding: '12px',
    borderRadius: '10px',
    fontSize: '15px',
    cursor: 'pointer',
    fontFamily: 'Georgia, serif',
    marginTop: '10px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#3D1F00',
    marginBottom: '8px'
  },
  sub: {
    fontSize: '14px',
    color: '#8B6A50',
    marginBottom: '28px',
    lineHeight: '1.6'
  },
  progress: {
    display: 'flex' as const,
    gap: '6px',
    marginBottom: '32px'
  }
}

// ─── PROGRESS BAR ────────────────────────────────────────────────
function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div style={S.progress}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          flex: 1,
          height: '4px',
          borderRadius: '2px',
          background: i <= step ? '#3D1F00' : '#DDD',
          transition: 'background 0.3s'
        }} />
      ))}
    </div>
  )
}

// ─── STEP 1: ACADEMIC PROFILE ────────────────────────────────────
function StepAcademic({ data, onChange, onNext }: StepProps) {
  const thisYear = new Date().getFullYear()
  // Placements usually start the summer after second year. From August onwards the next summer is next year.
  const nextSummer = new Date().getMonth() >= 7 ? thisYear + 1 : thisYear
  const placementOptions = [
    `Summer ${nextSummer}`,
    `Autumn ${nextSummer}`,
    `Summer ${nextSummer + 1}`,
    'Not sure yet'
  ]

  return (
    <div style={S.page}>
      <div style={S.card}>
        <Progress step={0} total={5} />
        <div style={S.title}>Your academic profile</div>
        <div style={S.sub}>Tell Auron about where you are right now.</div>

        <label style={S.label}>Degree</label>
        <select
          style={S.select}
          value={data.degree}
          onChange={e => onChange('degree', e.target.value)}>
          <option value="">Select your degree</option>
          <option>Accounting and Finance</option>
          <option>Accounting</option>
          <option>Finance</option>
          <option>Banking and Finance</option>
          <option>Economics and Finance</option>
          <option>Business or Management (finance focus)</option>
          <option>Other</option>
        </select>

        <label style={S.label}>Year of study</label>
        <select
          style={S.select}
          value={data.yearOfStudy}
          onChange={e => onChange('yearOfStudy', e.target.value)}>
          <option value="">Select year</option>
          <option>Year 1</option>
          <option>Year 2</option>
          <option>Final year</option>
        </select>

        <label style={S.label}>Current average mark (%)</label>
        <input
          style={S.input}
          type="number"
          step="1"
          min="0"
          max="100"
          placeholder="e.g. 64"
          value={data.average}
          onChange={e => onChange('average', e.target.value)}
        />

        <label style={S.label}>When do you want your placement to start?</label>
        <select
          style={S.select}
          value={data.placementStart}
          onChange={e => onChange('placementStart', e.target.value)}>
          <option value="">Select start</option>
          {placementOptions.map(o => <option key={o}>{o}</option>)}
        </select>

        <label style={S.label}>Expected graduation year</label>
        <select
          style={S.select}
          value={data.graduationYear}
          onChange={e => onChange('graduationYear', e.target.value)}>
          <option value="">Year</option>
          {[thisYear, thisYear + 1, thisYear + 2, thisYear + 3, thisYear + 4].map(y => (
            <option key={y}>{y}</option>
          ))}
        </select>

        <button style={S.btn} onClick={() => {
          if (!data.degree || !data.yearOfStudy || !data.average || !data.placementStart || !data.graduationYear) {
            alert('Please fill all fields')
            return
          }
          onNext()
        }}>
          Continue →
        </button>
      </div>
    </div>
  )
}

// ─── STEP 2: SKILLS ──────────────────────────────────────────────
const SKILL_OPTIONS = [
  'Excel (formulas and pivot tables)', 'Financial modelling', 'Financial accounting',
  'Management accounting', 'Corporate finance', 'Audit and assurance',
  'Taxation', 'Numerical reasoning tests', 'Verbal reasoning tests',
  'Situational judgement tests', 'Commercial awareness', 'SQL or Power BI',
  'Python or VBA', 'Communication', 'Teamwork and leadership',
  'Presentation skills', 'Interview technique', 'CV and cover letter writing'
]

function StepSkills({ data, onChange, onNext, onBack }: StepProps) {
  const [selected, setSelected] = useState<Record<string, number>>(data.skills || {})

  const toggleSkill = (skill: string): void => {
    const updated = { ...selected }
    if (updated[skill]) {
      delete updated[skill]
    } else {
      updated[skill] = 3
    }
    setSelected(updated)
    onChange('skills', updated)
  }

  const setConfidence = (skill: string, val: string): void => {
    const updated = { ...selected, [skill]: parseInt(val) }
    setSelected(updated)
    onChange('skills', updated)
  }

  const confidenceLabels = ['', 'Heard of it', 'Basics only', 'Can use it', 'Comfortable', 'Can teach it']

  return (
    <div style={{ ...S.page, justifyContent: 'flex-start', paddingTop: '60px' }}>
      <div style={{ ...S.card, maxWidth: '600px' }}>
        <Progress step={1} total={5} />
        <div style={S.title}>Where are your skills right now?</div>
        <div style={S.sub}>
          Click the skills that apply, then rate how confident you are in each one.
          Auron uses this to find the gaps to close before assessments.
        </div>

        {/* Skill chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '28px' }}>
          {SKILL_OPTIONS.map(skill => (
            <div
              key={skill}
              onClick={() => toggleSkill(skill)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: selected[skill] ? '2px solid #3D1F00' : '1px solid #DDD',
                background: selected[skill] ? '#F5F0E8' : 'white',
                cursor: 'pointer',
                fontSize: '14px',
                color: selected[skill] ? '#3D1F00' : '#666',
                fontWeight: selected[skill] ? 'bold' : 'normal',
                transition: 'all 0.2s'
              }}>
              {selected[skill] ? '✓ ' : ''}{skill}
            </div>
          ))}
        </div>

        {/* Confidence sliders for selected skills */}
        {Object.keys(selected).length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', color: '#8B6A50', marginBottom: '16px', fontWeight: 'bold' }}>
              Rate your confidence in each selected skill:
            </div>
            {Object.keys(selected).map(skill => (
              <div key={skill} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', color: '#3D1F00' }}>{skill}</span>
                  <span style={{ fontSize: '13px', color: '#8B6A50' }}>
                    {confidenceLabels[selected[skill]]}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={selected[skill]}
                  onChange={e => setConfidence(skill, e.target.value)}
                  style={{ width: '100%', accentColor: '#3D1F00' } as React.CSSProperties}
                />
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  color: '#BBB',
                  marginTop: '2px'
                }}>
                  <span>Beginner</span>
                  <span>Expert</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <button style={S.btn} onClick={() => {
          if (Object.keys(selected).length === 0) {
            alert('Please select at least one skill')
            return
          }
          onNext()
        }}>
          Continue →
        </button>
        <button style={S.btnBack} onClick={onBack}>← Back</button>
      </div>
    </div>
  )
}

// ─── STEP 3: PLACEMENT GOALS ─────────────────────────────────────
const EXPERIENCE_OPTIONS = [
  'Spring week or insight day', 'Internship', 'Part-time job',
  'Society or leadership role', 'Volunteering', 'None yet'
]

const SECTOR_OPTIONS = [
  'Audit', 'Tax', 'Advisory and consulting',
  'Transaction services and corporate finance', 'Banking',
  'Insurance and pensions', 'In-house corporate finance', 'Not sure yet'
]

function StepDream({ data, onChange, onNext, onBack }: StepProps) {
  const toggle = (key: 'experience' | 'targetSectors', value: string): void => {
    const current = data[key]
    onChange(key, current.includes(value) ? current.filter(v => v !== value) : [...current, value])
  }

  const chipStyle = (active: boolean) => ({
    padding: '8px 16px',
    borderRadius: '20px',
    border: active ? '2px solid #3D1F00' : '1px solid #DDD',
    background: active ? '#F5F0E8' : 'white',
    cursor: 'pointer',
    fontSize: '14px',
    color: active ? '#3D1F00' : '#666',
    fontWeight: active ? 'bold' : 'normal',
    transition: 'all 0.2s'
  } as const)

  return (
    <div style={{ ...S.page, justifyContent: 'flex-start', paddingTop: '60px' }}>
      <div style={{ ...S.card, maxWidth: '600px' }}>
        <Progress step={2} total={5} />
        <div style={S.title}>Your placement goals</div>
        <div style={S.sub}>
          Be honest. Auron will build your plan around where you really are.
        </div>

        <label style={S.label}>Where are you with applications?</label>
        <select
          style={S.select}
          value={data.applicationStatus}
          onChange={e => onChange('applicationStatus', e.target.value)}>
          <option value="">Select one</option>
          <option>Haven't started applying</option>
          <option>Applied to some, waiting to hear back</option>
          <option>In assessments or interviews</option>
          <option>I already have an offer</option>
        </select>

        <label style={S.label}>Experience so far</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          {EXPERIENCE_OPTIONS.map(opt => (
            <div key={opt} onClick={() => toggle('experience', opt)}
              style={chipStyle(data.experience.includes(opt))}>
              {data.experience.includes(opt) ? '✓ ' : ''}{opt}
            </div>
          ))}
        </div>

        <label style={S.label}>Areas of finance you are interested in</label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '20px' }}>
          {SECTOR_OPTIONS.map(opt => (
            <div key={opt} onClick={() => toggle('targetSectors', opt)}
              style={chipStyle(data.targetSectors.includes(opt))}>
              {data.targetSectors.includes(opt) ? '✓ ' : ''}{opt}
            </div>
          ))}
        </div>

        <label style={S.label}>Target employers (optional)</label>
        <input
          style={S.input}
          placeholder="e.g. Deloitte, BDO, a bank or corporate in Manchester..."
          value={data.targetEmployers}
          onChange={e => onChange('targetEmployers', e.target.value)}
        />

        <label style={S.label}>Professional qualification you are considering</label>
        <select
          style={S.select}
          value={data.qualificationPlan}
          onChange={e => onChange('qualificationPlan', e.target.value)}>
          <option value="">Select one</option>
          <option>ACA (ICAEW)</option>
          <option>ACCA</option>
          <option>CIMA</option>
          <option>CFA</option>
          <option>Not sure yet</option>
        </select>

        <label style={S.label}>In 5 years, I want to be...</label>
        <textarea
          style={{
            ...S.input,
            minHeight: '90px',
            resize: 'vertical' as const,
            lineHeight: '1.6'
          }}
          placeholder="e.g. A newly qualified chartered accountant in audit, or working in corporate finance at a bank..."
          value={data.dreamFuture}
          onChange={e => onChange('dreamFuture', e.target.value)}
        />

        <button style={S.btn} onClick={() => {
          if (!data.applicationStatus || data.targetSectors.length === 0 || !data.dreamFuture) {
            alert('Please choose your application status, at least one area of finance, and describe where you want to be')
            return
          }
          onNext()
        }}>
          Continue →
        </button>
        <button style={S.btnBack} onClick={onBack}>← Back</button>
      </div>
    </div>
  )
}

// ─── STEP 4: EMAIL FOR REMINDERS ─────────────────────────────────
function StepReminders({ data, onChange, onNext, onBack }: StepProps) {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <Progress step={3} total={5} />
        <div style={S.title}>Stay on track</div>
        <div style={S.sub}>
          Auron will email you when milestones are approaching.
          This is what makes the plan actually work.
        </div>

        <label style={S.label}>Your email</label>
        <input
          style={S.input}
          type="email"
          placeholder="you@example.com"
          value={data.reminderEmail}
          onChange={e => onChange('reminderEmail', e.target.value)}
        />

        <label style={S.label}>How often do you want reminders?</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {[
            { val: 'weekly', label: 'Weekly digest', desc: 'One email every Sunday with your upcoming week' },
            { val: 'milestone', label: 'Milestone alerts only', desc: 'Only when a deadline is 7 days or 1 day away' },
            { val: 'daily', label: 'Daily check-in', desc: 'Short daily nudge (best when application deadlines are close)' }
          ].map(opt => (
            <div
              key={opt.val}
              onClick={() => onChange('reminderFreq', opt.val)}
              style={{
                padding: '14px 16px',
                borderRadius: '10px',
                border: data.reminderFreq === opt.val ? '2px solid #3D1F00' : '1px solid #DDD',
                background: data.reminderFreq === opt.val ? '#F5F0E8' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}>
              <div style={{
                fontWeight: 'bold',
                color: data.reminderFreq === opt.val ? '#3D1F00' : '#333',
                fontSize: '14px',
                marginBottom: '3px'
              }}>
                {opt.label}
              </div>
              <div style={{ fontSize: '12px', color: '#8B6A50' }}>{opt.desc}</div>
            </div>
          ))}
        </div>

        <button style={S.btn} onClick={() => {
          if (!data.reminderEmail || !data.reminderFreq) {
            alert('Please enter your email and reminder preference')
            return
          }
          onNext()
        }}>
          Generate my roadmap →
        </button>
        <button style={S.btnBack} onClick={onBack}>← Back</button>
      </div>
    </div>
  )
}

// ─── STEP 5: GENERATING (loading screen) ─────────────────────────
function StepGenerating() {
  const messages = [
    'Analysing your profile...',
    'Mapping your skill gaps...',
    'Working back from your placement start date...',
    'Building your personalised roadmap...',
    'Almost there...'
  ]
  const [msgIndex, setMsgIndex] = useState<number>(0)
  const [showFeatures, setShowFeatures] = useState(false)

  // Rotate messages every 2 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex(i => (i + 1) % messages.length)
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  // Show features after 7 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFeatures(true)
    }, 7000)
    return () => clearTimeout(timer)
  }, [])

  const features = [
    { icon: '🗺️', title: 'Personalized Roadmap', desc: 'Tailored to your skills & goals' },
    { icon: '📊', title: 'Skill Gap Analysis', desc: 'Know exactly what to improve' },
    { icon: '💼', title: 'Employer Insights', desc: 'What finance employers look for' },
    { icon: '🎓', title: 'Smart Recommendations', desc: 'Practice tests, courses & resources' },
    { icon: '🚀', title: 'Application Milestones', desc: 'Clear steps to your placement' },
    { icon: '💡', title: 'AI-Powered Advice', desc: 'Real guidance, real results' }
  ]

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F5F0E8',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Georgia, serif',
      padding: '40px 20px'
    }}>
      {/* Left side - Loading spinner */}
      <div style={{ flex: showFeatures ? 0.5 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #DDD',
          borderTop: '3px solid #3D1F00',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ color: '#3D1F00', fontSize: '18px', textAlign: 'center', fontWeight: 600 }}>
          {messages[msgIndex]}
        </p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: showFeatures ? 1 : 0 }}
          transition={{ delay: 0.3 }}
          style={{ color: '#8B6A50', fontSize: '14px', textAlign: 'center', fontStyle: 'italic' }}
        >
          Seems like Auron is thinking quite seriously about your future...
        </motion.p>
      </div>

      {/* Right side - Features list (appears after 7 seconds) */}
      {showFeatures && (
        <div style={{ flex: 0.5, paddingLeft: '40px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            {features.map((feature, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.12 }}
                style={{
                  padding: '16px',
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #ede9e3',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '24px' }}>{feature.icon}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#3D1F00', marginBottom: '4px' }}>
                      {feature.title}
                    </div>
                    <div style={{ fontSize: '12px', color: '#8B6A50' }}>
                      {feature.desc}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
  


// ─── MAIN ONBOARDING ORCHESTRATOR ────────────────────────────────
export default function Onboarding() {
  const router = useRouter()
  const [phase, setPhase] = useState<string>('typewriter')
  const [step, setStep] = useState<number>(0)
  const [generating, setGenerating] = useState<boolean>(false)

  const tempData = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('auron_temp') || '{}')
    : {}

  const [profile, setProfile] = useState<Profile>({
    name: tempData.name || '',
    college: tempData.college || '',
    average: tempData.average || '',
    degree: '',
    yearOfStudy: '',
    placementStart: '',
    graduationYear: '',
    applicationStatus: '',
    experience: [],
    targetSectors: [],
    targetEmployers: '',
    qualificationPlan: '',
    skills: {},
    dreamFuture: '',
    reminderEmail: '',
    reminderFreq: ''
  })

  const update = (key: keyof Profile, val: any): void => {
    setProfile(prev => ({ ...prev, [key]: val }))
  }

  const handleFinish = async (): Promise<void> => {
    setGenerating(true)

    try {
      // 1. Get current logged-in user from Supabase Auth
      const { data: { user } } = await supabase.auth.getUser()

      const userEmail = user?.email || profile.reminderEmail
      const userId = user?.id || crypto.randomUUID()

      const { data: savedUser, error: userError } = await supabase
        .from('users')
        .upsert({
          id: userId,
          email: userEmail,
          name: profile.name,
          college: profile.college,
          // Existing columns are reused: branch holds the degree, cgpa holds the average mark (%)
          branch: profile.degree,
          cgpa: parseFloat(profile.average),
          passout_date: `${profile.graduationYear}-06-01`,
          chosen_path: 'pending'
        })
        .select()
        .single()

      if (userError) {
        console.error('User save error:', userError)
        throw userError
      }

      // 2b. Save the reminder frequency chosen in onboarding (the email goes on the users row above)
      const { error: prefsError } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: userId,
          reminder_frequency: profile.reminderFreq,
          updated_at: new Date().toISOString()
        })

      if (prefsError) {
        // Not fatal: the reminder emails fall back to a weekly digest and Settings can change it
        console.error('Preferences save error:', prefsError)
      }

      // 3. Save skills to user_skills table
      const skillInserts = Object.entries(profile.skills).map(([skillName, confidence]: [string, number]) => ({
        user_id: userId,
        skill_name: skillName,
        confidence: confidence
      }))

      if (skillInserts.length > 0) {
        await supabase.from('user_skills').insert(skillInserts)
      }

      // 4. Call our API route to generate roadmap with Claude
      const response = await fetch('/api/generate-roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, profile })
      })

      if (!response.ok) {
        console.error('API failed, message:', response.statusText)
      }

      // 5. Clear temp data and go to dashboard
      localStorage.removeItem('auron_temp')
      router.push('/dashboard')

    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
      setGenerating(false)
    }
  }

  if (generating) return <StepGenerating />

  if (phase === 'typewriter') {
    return <Typewriter onDone={() => setPhase('steps')} />
  }

  const steps: ReactNode[] = [
    <StepAcademic
      key="academic"
      data={profile}
      onChange={update}
      onNext={() => setStep(1)}
    />,
    <StepSkills
      key="skills"
      data={profile}
      onChange={update}
      onNext={() => setStep(2)}
      onBack={() => setStep(0)}
    />,
    <StepDream
      key="dream"
      data={profile}
      onChange={update}
      onNext={() => setStep(3)}
      onBack={() => setStep(1)}
    />,
    <StepReminders
      key="reminders"
      data={profile}
      onChange={update}
      onNext={handleFinish}
      onBack={() => setStep(2)}
    />
  ]

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        {steps[step]}
      </motion.div>
    </AnimatePresence>
  )
}
