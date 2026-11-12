import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const MODEL = 'claude-sonnet-5-5'
const MAX_HISTORY_MESSAGES = 20
const MAX_MESSAGE_CHARS = 4000

const SYSTEM_PROMPT = `You are Auron, a placement-year adviser for UK undergraduates studying accounting and finance. You help students win a sandwich placement (a 9-12 month paid placement between second and final year), mainly with employers in or around Greater Manchester: accountancy firms, banks, insurers, asset managers and corporate finance teams.

You can help with: CVs and cover letters, application forms, online tests (numerical, verbal and situational judgement), video interviews and assessment centres, commercial awareness, Excel and financial modelling, choosing between areas of finance (audit, tax, advisory, corporate finance, investment analysis, banking), professional qualifications (ACA, ACCA, CIMA, CFA), networking, and planning the weeks ahead.

Rules:
- Be practical, specific and honest. Give concrete next actions, not generic encouragement.
- Keep answers short unless the student asks for detail. Use plain language.
- Do not invent employer deadlines, salaries or requirements. Tell the student to check the employer's own careers page for dates.
- You are not a financial adviser. Do not tell the student what to buy or sell; you can explain how to analyse a company or a market.
- If the student asks about something unrelated to their career or studies, answer briefly and steer back.`

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// Claude's API needs the conversation to start with a user message and to alternate roles.
// The chat pages can send an assistant greeting first, or two messages from the same side in a row.
function tidyMessages(raw: unknown[]): ChatMessage[] {
  const cleaned: ChatMessage[] = []

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const { role, content } = item as { role?: unknown; content?: unknown }
    if (typeof content !== 'string' || !content.trim()) continue

    const normalisedRole: ChatMessage['role'] = role === 'user' ? 'user' : 'assistant'
    const text = content.trim().slice(0, MAX_MESSAGE_CHARS)
    const last = cleaned[cleaned.length - 1]

    if (last && last.role === normalisedRole) {
      last.content += `\n\n${text}`
    } else {
      cleaned.push({ role: normalisedRole, content: text })
    }
  }

  while (cleaned.length > 0 && cleaned[0].role !== 'user') cleaned.shift()

  const recent = cleaned.slice(-MAX_HISTORY_MESSAGES)
  while (recent.length > 0 && recent[0].role !== 'user') recent.shift()

  return recent
}

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'Invalid messages format' }, { status: 400 })
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const conversation = tidyMessages(messages)
    if (conversation.length === 0 || conversation[conversation.length - 1].role !== 'user') {
      return NextResponse.json({ error: 'No message content provided' }, { status: 400 })
    }

    const system =
      typeof context === 'string' && context.trim()
        ? `${SYSTEM_PROMPT}\n\nContext from the app: ${context.trim().slice(0, 500)}`
        : SYSTEM_PROMPT

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1000,
      system,
      messages: conversation
    })

    const text = response.content
      .map(block => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim()

    if (!text) {
      return NextResponse.json({ error: 'Claude returned an empty reply' }, { status: 502 })
    }

    return NextResponse.json({ role: 'assistant', content: text })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to process chat message'
    console.error('Chat error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
