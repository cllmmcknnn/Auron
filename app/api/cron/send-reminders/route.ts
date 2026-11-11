import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import { buildReminder, type ReminderFrequency, type ReminderMilestone } from '@/lib/reminders'

// Runs once a day (see vercel.json). Vercel sends `Authorization: Bearer <CRON_SECRET>`.
export const dynamic = 'force-dynamic'

const VALID_FREQUENCIES: ReminderFrequency[] = ['daily', 'weekly', 'milestone', 'never']

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase is not configured' }, { status: 500 })
  }
  const supabase = createClient(supabaseUrl, serviceKey)

  // Allow ?date=YYYY-MM-DD and ?dry=1 for testing without waiting for a real run or sending mail.
  const dateParam = request.nextUrl.searchParams.get('date')
  const today =
    dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam)
      ? dateParam
      : new Date().toISOString().slice(0, 10)
  const dryRun = request.nextUrl.searchParams.get('dry') === '1'
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''

  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, email')
    .not('email', 'is', null)

  if (usersError) {
    console.error('Reminder cron: could not load users', usersError)
    return NextResponse.json({ error: 'Could not load users' }, { status: 500 })
  }

  const { data: prefs } = await supabase
    .from('user_preferences')
    .select('user_id, reminder_frequency')

  const frequencyByUser = new Map<string, ReminderFrequency>()
  for (const p of prefs || []) {
    if (VALID_FREQUENCIES.includes(p.reminder_frequency)) {
      frequencyByUser.set(p.user_id, p.reminder_frequency)
    }
  }

  let sent = 0
  let skipped = 0
  const failures: Array<{ userId: string; error: string }> = []
  const preview: Array<{ userId: string; subject: string }> = []

  for (const user of users || []) {
    // Students who never chose a frequency get the weekly digest, matching the Settings default.
    const frequency = frequencyByUser.get(user.id) || 'weekly'
    if (frequency === 'never') {
      skipped++
      continue
    }

    const { data: milestones, error: milestoneError } = await supabase
      .from('roadmap')
      .select('milestone_title, description, due_date, category, status')
      .eq('user_id', user.id)
      .neq('status', 'completed')

    if (milestoneError) {
      failures.push({ userId: user.id, error: milestoneError.message })
      continue
    }

    const email = buildReminder(frequency, (milestones || []) as ReminderMilestone[], today, {
      name: user.name,
      appUrl
    })
    if (!email) {
      skipped++
      continue
    }

    if (dryRun) {
      preview.push({ userId: user.id, subject: email.subject })
      continue
    }

    try {
      await sendEmail({ to: user.email, ...email })
      sent++
    } catch (err) {
      failures.push({ userId: user.id, error: err instanceof Error ? err.message : String(err) })
    }

    // Stay under Resend's default rate limit of 2 requests per second.
    await new Promise(res => setTimeout(res, 600))
  }

  return NextResponse.json({
    date: today,
    dryRun,
    sent,
    skipped,
    failed: failures.length,
    failures,
    ...(dryRun ? { wouldSend: preview } : {})
  })
}
