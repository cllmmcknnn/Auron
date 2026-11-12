'use client'
import { useState, FormEvent, ChangeEvent } from 'react'
import FeatureCards from '@/components/ui/FeatureCards'
import ProblemSection from '@/components/ui/ProblemSection'

interface FormData {
  name: string
  college: string
  average: string
}

export default function Home() {
  const [showForm, setShowForm] = useState<boolean>(false)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    college: '',
    average: ''
  })

  const handleScroll = (): void => {
    setShowForm(true)
    setTimeout(() => {
      document.getElementById('quick-form')?.scrollIntoView({ 
        behavior: 'smooth' 
      })
    }, 100)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.currentTarget
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleContinue = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    // Save to localStorage temporarily, then go to login
    localStorage.setItem('auron_temp', JSON.stringify(formData))
    window.location.href = '/login'
  }

  return (
    <main style={{
      minHeight: '100vh',
      background: '#F5F0E8',
      fontFamily: 'Georgia, serif'
    }}>
      
      {/* NAV */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 40px',
        borderBottom: '1px solid rgba(0,0,0,0.08)'
      }}>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#3D1F00' }}>
          Auron
        </div>
        <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
          <a href="#" style={{ color: '#5C4033', textDecoration: 'none' }}>
            How it works
          </a>
          <a href="/login" style={{ color: '#5C4033', textDecoration: 'none' }}>
            Sign in
          </a>
          <button
            onClick={handleScroll}
            style={{
              background: '#3D1F00',
              color: 'white',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontFamily: 'Georgia, serif',
              fontSize: '15px'
            }}>
            Get started free
          </button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{
        textAlign: 'center',
        padding: '100px 20px 60px',
        maxWidth: '700px',
        margin: '0 auto'
      }}>
        <p style={{ color: '#8B6A50', fontSize: '20px', marginBottom: '16px' }}>
          Hi there.
        </p>
        <h1 style={{
          fontSize: '52px',
          fontWeight: 'bold',
          color: '#3D1F00',
          lineHeight: '1.15',
          marginBottom: '24px'
        }}>
          Your career, mapped properly.
        </h1>
        <p style={{
          color: '#6B5040',
          fontSize: '18px',
          lineHeight: '1.7',
          marginBottom: '40px'
        }}>
          Analyse your profile against your dream company's hiring bar. 
          Map skill gaps. Build a semester roadmap. Actually execute.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button
            onClick={handleScroll}
            style={{
              background: '#3D1F00',
              color: 'white',
              border: 'none',
              padding: '14px 32px',
              borderRadius: '10px',
              fontSize: '16px',
              cursor: 'pointer',
              fontFamily: 'Georgia, serif'
            }}>
            Build my roadmap
          </button>
          <button style={{
            background: 'transparent',
            color: '#3D1F00',
            border: '1px solid #3D1F00',
            padding: '14px 28px',
            borderRadius: '10px',
            fontSize: '16px',
            cursor: 'pointer',
            fontFamily: 'Georgia, serif'
          }}>
            See how it works
          </button>
        </div>
      </div>

      {/* QUICK FORM — appears when button clicked */}
      {showForm && (
        <div id="quick-form" style={{
          maxWidth: '480px',
          margin: '0 auto',
          padding: '40px 20px 80px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '36px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
          }}>
            <h2 style={{
              color: '#3D1F00',
              marginBottom: '8px',
              fontSize: '22px'
            }}>
              Let's get started
            </h2>
            <p style={{ color: '#8B6A50', marginBottom: '28px', fontSize: '14px' }}>
              Takes 30 seconds. No commitment.
            </p>
            
            <form onSubmit={handleContinue}>
              {[
                { label: 'Your name', name: 'name' as const, type: 'text', placeholder: 'e.g. Sithaara' },
                { label: 'College / University', name: 'college' as const, type: 'text', placeholder: 'e.g. Manchester Metropolitan University' },
                { label: 'Current average mark (%)', name: 'average' as const, type: 'number', placeholder: 'e.g. 64' }
              ].map(field => (
                <div key={field.name} style={{ marginBottom: '20px' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '12px',
                    color: '#8B6A50',
                    marginBottom: '6px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase'
                  }}>
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    name={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name]}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      border: '1px solid #DDD',
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontFamily: 'Georgia, serif',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              ))}
              
              <button type="submit" style={{
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
              }}>
                Continue →
              </button>
            </form>
          </div>
        </div>
      )}

      {/* PROBLEM SECTION */}
      <ProblemSection />

      {/* FEATURE CARDS */}
      <FeatureCards />

      {/* CTA FOOTER */}
      <div style={{
        background: '#3D1F00',
        color: 'white',
        padding: '60px 40px',
        textAlign: 'center',
        marginTop: '40px'
      }}>
        <h2 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '16px' }}>
          Ready to build your roadmap?
        </h2>
        <p style={{ fontSize: '16px', marginBottom: '32px', opacity: 0.9 }}>
          Start today. It takes just 5 minutes.
        </p>
        <button
          onClick={handleScroll}
          style={{
            background: 'white',
            color: '#3D1F00',
            border: 'none',
            padding: '14px 32px',
            borderRadius: '10px',
            fontSize: '16px',
            cursor: 'pointer',
            fontFamily: 'Georgia, serif',
            fontWeight: 'bold'
          }}>
          Get started free
        </button>
      </div>
    </main>
  )
}
