This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Milestone email reminders

Auron emails students about the milestones in their roadmap. A daily job calls
`/api/cron/send-reminders` (scheduled in `vercel.json` for 08:00 UTC). What each student receives
depends on the frequency saved in `user_preferences.reminder_frequency`:

| Frequency | Email is sent |
| --- | --- |
| `daily` | every day, if anything is overdue or due within 7 days |
| `weekly` | Sundays, covering anything overdue or due within 7 days |
| `milestone` | exactly 7 days and 1 day before a milestone is due |
| `never` | never |

Students with no saved preference get the weekly digest. Completed milestones are never included.

### Setup

1. Create a free [Resend](https://resend.com) account and copy the API key into `RESEND_API_KEY`.
2. Copy `.env.example` to `.env.local` and fill in the rest. Set the same variables in Vercel.
3. Deploy to Vercel. Vercel cron calls the route with `Authorization: Bearer <CRON_SECRET>`.

Until you verify your own domain in Resend, the default sender only delivers to the address on your
Resend account, which is fine for testing on yourself.

### Testing without sending

```bash
# Shows who would be emailed on a given date, without sending anything
curl -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron/send-reminders?dry=1&date=2026-12-06"
```

Remove `dry=1` to send for real.
