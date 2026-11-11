import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import type { OnboardingProfile } from '@/lib/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' })

const MODEL = 'claude-sonnet-5-5'

// Use service role key for server-side operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface RoadmapGenerationBody {
  userId: string
  profile: OnboardingProfile
}

interface RoadmapAIResponse {
  recommendation: string
  reasoning: string
  milestones: Array<{
    milestone_title: string
    description: string
    due_date: string
    category: string
  }>
}

// The dashboard colours milestones by these six categories, so keep them stable.
const ALLOWED_CATEGORIES = ['technical', 'project', 'career', 'soft', 'exam', 'application']

const SKILL_LABELS = ['', 'heard of it', 'basics only', 'can use it', 'comfortable', 'can teach it']

const SYSTEM_PROMPT = `You are Auron, a placement-year adviser for UK undergraduates studying accounting and finance. You help students win a sandwich placement (a 9-12 month paid industrial placement between their second and final year) with employers based in or around Greater Manchester.

What you know about this market:
- Typical employers: Big Four and mid-tier accountancy firms (Deloitte, EY, KPMG, PwC, BDO, Grant Thornton, Mazars and similar) with Manchester offices, plus banks, insurers and corporates with finance teams in the region. Common placement areas are audit, tax, advisory/transaction services, corporate finance and in-house finance.
- Many firms recruit on a rolling basis and can close a programme early once it fills, so applying early matters more than applying perfectly. Never invent specific closing dates. If you mention an employer deadline, tell the student to confirm it on the employer's own careers page.
- A typical application has these stages: online application form, online assessment (situational judgement and behavioural questions, plus numerical and verbal reasoning), a job simulation or recorded video responses, then a final stage with an interview and often a discussion with an assessor, usually in person at the office.
- Strong applications combine: a clean CV and tailored answers, evidence of commercial awareness, solid Excel and numeracy, practice on psychometric tests, and relevant experience (even part-time work, society roles or spring weeks).

How to write the roadmap:
- Be practical and specific, not motivational. Refer to this student's actual situation.
- Work backwards from the date the placement should start. Put urgent, time-sensitive application work first.
- Every milestone needs a concrete action and a measurable output (for example "submit 5 applications", "score 70%+ on three timed numerical reasoning practice tests", "write a one-page STAR bank covering 6 competencies").
- Name specific resources where useful, preferring free or university-provided ones (careers service CV checks, employer practice tests, Financial Times or BBC Business for commercial awareness, ICAEW or ACCA student content, Excel and financial modelling tutorials).
- Cover, as relevant to the student: CV and cover letter, applications and tracking, psychometric tests, video and job-simulation practice, assessment centre or interview preparation, commercial awareness, technical skills gaps, networking (careers fairs, employer events, university societies), and preparing for the first weeks of the placement.
- Do not mention Indian colleges, CGPA, NPTEL or studying abroad. Marks are UK percentages.
- Categories must be one of: technical, project, career, soft, exam, application. Use "exam" for psychometric and technical tests, "application" for submitting and tracking applications, "career" for CV, networking and employer research, "soft" for interview and communication practice, "technical" for finance and Excel skills, and "project" for portfolio-style evidence such as a stock pitch or financial model.
- Each due_date must be a real date in YYYY-MM-DD format, on or after today's date and no later than the placement start date. Space milestones 1 to 4 weeks apart.

Return ONLY this JSON, with no markdown, no backticks and no explanation:
{
  "recommendation": "A short headline of the best route for this student, e.g. Audit placement at a mid-tier or Big Four firm in Manchester",
  "reasoning": "2-3 sentences specific to this student's profile, marks, experience and timing",
  "milestones": [
    {
      "milestone_title": "Short action title",
      "description": "What to do, how, and the measurable output",
      "due_date": "YYYY-MM-DD",
      "category": "application"
    }
  ]
}

Produce 8 to 10 milestones.`

function buildStudentProfile(profile: OnboardingProfile, today: string): string {
  const skillSummary =
    Object.entries(profile.skills || {})
      .map(([skill, confidence]) => `${skill}: ${SKILL_LABELS[confidence as number] || confidence}`)
      .join(', ') || 'No skills listed'

  const list = (items?: string[]) => (items && items.length ? items.join(', ') : 'None given')

  return `Today's date: ${today}

STUDENT PROFILE
- Name: ${profile.name}
- University: ${profile.college || 'Not given'}
- Degree: ${profile.degree}
- Year of study: ${profile.yearOfStudy}
- Current average mark: ${profile.average ? profile.average + '%' : 'Not given'}
- Expected graduation: ${profile.graduationYear}
- Wants placement to start: ${profile.placementStart}
- Where they are in this application cycle: ${profile.applicationStatus || 'Not given'}
- Experience so far: ${list(profile.experience)}
- Areas of finance interested in: ${list(profile.targetSectors)}
- Target employers: ${profile.targetEmployers || 'Not specified'}
- Professional qualification plan: ${profile.qualificationPlan || 'Not sure'}
- Skills: ${skillSummary}
- Where they want to be in 5 years: ${profile.dreamFuture}
- Location: Manchester and the surrounding area`
}

async function callClaudeWithRetry(userPrompt: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const message = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 4000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userPrompt }]
      })

      return message.content
        .map(block => (block.type === 'text' ? block.text : ''))
        .join('')
    } catch (err) {
      console.log(`Claude attempt ${i + 1} failed`)

      if (i === retries - 1) throw err

      // wait before retry (1s, 2s, 3s)
      await new Promise(res => setTimeout(res, 1000 * (i + 1)))
    }
  }
  throw new Error('All Claude retries failed')
}

function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value).getTime())
}

function normaliseCategory(raw: string): string {
  let category = (raw || '').toLowerCase().trim()

  if (category.includes('tech')) category = 'technical'
  else if (category.includes('proj')) category = 'project'
  else if (category.includes('career')) category = 'career'
  else if (category.includes('soft')) category = 'soft'
  else if (category.includes('exam') || category.includes('test')) category = 'exam'
  else if (category.includes('appl')) category = 'application'

  return ALLOWED_CATEGORIES.includes(category) ? category : 'career'
}

export async function POST(request: NextRequest) {
  let userId: string | null = null

  try {
    const body = (await request.json()) as RoadmapGenerationBody
    userId = body.userId
    const profile = body.profile

    if (!userId) {
      throw new Error('No userId provided in request body')
    }
    if (!profile) {
      throw new Error('No profile provided in request body')
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured')
    }

    const today = new Date().toISOString().slice(0, 10)

    // Save/update user in DB first (before AI call).
    // Existing columns are reused: cgpa holds the average mark (%), branch holds the degree,
    // and passout_date holds the graduation date.
    const { error: userError } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          name: profile.name,
          college: profile.college,
          branch: profile.degree,
          cgpa: parseFloat(profile.average) || 0,
          passout_date: `${profile.graduationYear || new Date().getFullYear() + 2}-06-01`,
          chosen_path: 'pending'
        },
        { onConflict: 'id' }
      )

    if (userError) {
      console.error('User save error details:', JSON.stringify(userError))
      // Don't throw — continue even if user save fails
    }

    const text = await callClaudeWithRetry(buildStudentProfile(profile, today))

    // Parse JSON — strip any markdown backticks if present
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim()

    const jsonStart = cleaned.indexOf('{')
    const jsonEnd = cleaned.lastIndexOf('}') + 1

    if (jsonStart === -1 || jsonEnd === 0) {
      throw new Error('Claude did not return valid JSON. Raw: ' + text.slice(0, 300))
    }

    const parsed = JSON.parse(cleaned.slice(jsonStart, jsonEnd)) as RoadmapAIResponse

    if (!Array.isArray(parsed.milestones) || parsed.milestones.length === 0) {
      throw new Error('Claude returned no milestones')
    }

    // Update user's chosen path
    await supabase
      .from('users')
      .update({ chosen_path: parsed.recommendation })
      .eq('id', userId)

    // Drop milestones with unusable dates rather than saving broken rows
    const milestones = parsed.milestones
      .filter(m => m.milestone_title && isValidDate(m.due_date))
      .map(m => ({
        milestone_title: m.milestone_title,
        description: m.description,
        due_date: m.due_date,
        category: normaliseCategory(m.category),
        status: 'pending',
        version: 1,
        user_id: userId
      }))

    if (milestones.length === 0) {
      throw new Error('No milestones had a valid due date')
    }

    // Delete old roadmap and insert new one
    await supabase.from('roadmap').delete().eq('user_id', userId)
    const { error: insertError } = await supabase.from('roadmap').insert(milestones)

    if (insertError) {
      console.error('Roadmap insert error:', JSON.stringify(insertError))
      throw new Error('Failed to save roadmap: ' + insertError.message)
    }

    return NextResponse.json({
      success: true,
      recommendation: parsed.recommendation,
      reasoning: parsed.reasoning
    })
  } catch (error) {
    console.error('=== ROUTE ERROR ===')
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('userId at time of error:', userId)

    // Try fallback insert if we have a userId
    if (userId) {
      const fallbackDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
      const { error: fallbackError } = await supabase.from('roadmap').insert([
        {
          user_id: userId,
          milestone_title: 'Start your journey',
          description: 'Auron is setting up your personalised roadmap. Check back shortly.',
          due_date: fallbackDate,
          category: 'career',
          status: 'pending',
          version: 1
        }
      ])

      if (fallbackError) {
        console.error('Fallback also failed:', JSON.stringify(fallbackError))
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      },
      { status: 500 }
    )
  }
}
