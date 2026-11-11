// Pure reminder logic: decides whether a student gets an email today and what it says.
// No network or database calls here, so it is easy to test.

export type ReminderFrequency = 'daily' | 'weekly' | 'milestone' | 'never'

export interface ReminderMilestone {
  milestone_title: string
  description: string | null
  due_date: string // YYYY-MM-DD
  category: string | null
  status: string | null
}

export interface ReminderEmail {
  subject: string
  text: string
  html: string
}

const DAY_MS = 24 * 60 * 60 * 1000

// Whole days from `today` to `due`. Negative means overdue.
export function daysUntil(due: string, today: string): number {
  const d = Date.parse(`${due}T00:00:00Z`)
  const t = Date.parse(`${today}T00:00:00Z`)
  return Math.round((d - t) / DAY_MS)
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function formatDate(due: string): string {
  return new Date(`${due}T00:00:00Z`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC'
  })
}

function dueLabel(days: number): string {
  if (days < 0) return `${Math.abs(days)} day${days === -1 ? '' : 's'} overdue`
  if (days === 0) return 'due today'
  if (days === 1) return 'due tomorrow'
  return `due in ${days} days`
}

// Which milestones belong in today's email for this frequency.
export function selectMilestones(
  frequency: ReminderFrequency,
  milestones: ReminderMilestone[],
  today: string
): ReminderMilestone[] {
  const open = milestones
    .filter(m => m.status !== 'completed' && /^\d{4}-\d{2}-\d{2}$/.test(m.due_date))
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  const todayDow = new Date(`${today}T00:00:00Z`).getUTCDay() // 0 = Sunday

  switch (frequency) {
    case 'milestone':
      // Only fire exactly 7 days and 1 day before a deadline.
      return open.filter(m => {
        const d = daysUntil(m.due_date, today)
        return d === 7 || d === 1
      })
    case 'weekly':
      // Sunday digest: anything overdue plus the coming week.
      if (todayDow !== 0) return []
      return open.filter(m => daysUntil(m.due_date, today) <= 7)
    case 'daily':
      // Daily nudge: anything overdue plus the next 7 days.
      return open.filter(m => daysUntil(m.due_date, today) <= 7)
    default:
      return []
  }
}

export function buildReminder(
  frequency: ReminderFrequency,
  milestones: ReminderMilestone[],
  today: string,
  opts: { name?: string; appUrl?: string } = {}
): ReminderEmail | null {
  const due = selectMilestones(frequency, milestones, today)
  if (due.length === 0) return null

  const firstName = (opts.name || '').trim().split(/\s+/)[0] || 'there'
  const overdue = due.filter(m => daysUntil(m.due_date, today) < 0).length
  const settingsUrl = opts.appUrl ? `${opts.appUrl.replace(/\/$/, '')}/dashboard/settings` : ''
  const dashboardUrl = opts.appUrl ? `${opts.appUrl.replace(/\/$/, '')}/dashboard/roadmap` : ''

  const subject =
    frequency === 'milestone'
      ? `Auron: ${due.length === 1 ? due[0].milestone_title : `${due.length} placement milestones coming up`}`
      : overdue > 0
        ? `Auron: ${due.length} placement task${due.length === 1 ? '' : 's'} to action (${overdue} overdue)`
        : `Auron: ${due.length} placement task${due.length === 1 ? '' : 's'} coming up`

  const lines = due.map(m => {
    const d = daysUntil(m.due_date, today)
    return `- ${m.milestone_title} (${dueLabel(d)}, ${formatDate(m.due_date)})${m.description ? `\n  ${m.description}` : ''}`
  })

  const text = [
    `Hi ${firstName},`,
    '',
    'Here is what is coming up on your placement roadmap:',
    '',
    ...lines,
    '',
    dashboardUrl ? `Open your roadmap: ${dashboardUrl}` : '',
    settingsUrl ? `Change how often you get these emails: ${settingsUrl}` : ''
  ]
    .filter((l, i, arr) => l !== '' || arr[i - 1] !== '')
    .join('\n')

  const items = due
    .map(m => {
      const d = daysUntil(m.due_date, today)
      const colour = d < 0 ? '#B3261E' : d <= 1 ? '#B26A00' : '#3D1F00'
      return `<li style="margin-bottom:14px">
  <strong>${escapeHtml(m.milestone_title)}</strong><br>
  <span style="color:${colour};font-size:13px">${escapeHtml(dueLabel(d))} &middot; ${escapeHtml(formatDate(m.due_date))}</span>
  ${m.description ? `<br><span style="color:#555;font-size:14px">${escapeHtml(m.description)}</span>` : ''}
</li>`
    })
    .join('\n')

  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;color:#222">
  <h2 style="color:#3D1F00;margin-bottom:4px">Your placement roadmap</h2>
  <p>Hi ${escapeHtml(firstName)}, here is what is coming up:</p>
  <ul style="padding-left:20px">${items}</ul>
  ${dashboardUrl ? `<p><a href="${escapeHtml(dashboardUrl)}" style="color:#3D1F00">Open your roadmap</a></p>` : ''}
  ${settingsUrl ? `<p style="font-size:12px;color:#888">You can change how often you get these emails in <a href="${escapeHtml(settingsUrl)}" style="color:#888">Settings</a>.</p>` : ''}
</div>`

  return { subject, text, html }
}
