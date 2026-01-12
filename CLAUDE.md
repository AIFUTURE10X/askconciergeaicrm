# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Info

- **App Name**: AskConciergeAI CRM
- **Local Path**: `C:\Projects\Ask Concierge Ai CRM`
- **Purpose**: Sales CRM for tracking leads, deals, and communications for the main AskConciergeAI product
- **Related App**: `C:\Projects\AskConciergeAI` (the main SaaS product this CRM sells)

## Build & Development Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run lint         # ESLint check
npm run db:push      # Push schema changes to database (Drizzle)
npm run db:generate  # Generate migration files
npm run db:studio    # Open Drizzle Studio for database inspection
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router + Turbopack) |
| Language | TypeScript |
| Database | PostgreSQL (Neon) + Drizzle ORM |
| UI | Radix UI + Tailwind CSS |
| AI | Google Gemini 2.0 Flash (email drafting) |
| Email | Gmail API (OAuth) |
| Drag & Drop | @hello-pangea/dnd |

## Environment Variables

**Required:**
- `DATABASE_URL` - Neon PostgreSQL connection string
- `GEMINI_API_KEY` - For AI email draft generation
- `CRM_API_KEY` - API key for inbound webhooks from main app

**Gmail Integration (optional):**
- `GMAIL_CLIENT_ID` - Google OAuth client ID
- `GMAIL_CLIENT_SECRET` - Google OAuth client secret
- `GMAIL_REDIRECT_URI` - OAuth callback URL (default: `http://localhost:3000/api/gmail/callback`)

## Architecture Overview

### This is a Sales CRM

The CRM tracks sales pipeline for the AskConciergeAI product:
- **Contacts**: Hotels, vacation rental managers, property managers
- **Deals**: Pipeline from lead to closed (won/lost)
- **Activities**: Calls, emails, demos, meetings, notes
- **Reminders**: Follow-up tasks with due dates
- **Inbox**: Gmail integration with AI-generated draft responses

### Directory Structure

```
src/
├── app/
│   ├── (dashboard)/           # Main CRM views
│   │   ├── page.tsx           # Dashboard home
│   │   ├── contacts/          # Contact list & detail
│   │   ├── pipeline/          # Kanban deal board
│   │   ├── inbox/             # Gmail inbox & AI drafts
│   │   ├── reminders/         # Follow-up tasks
│   │   └── settings/          # Gmail connection, settings
│   └── api/
│       ├── contacts/          # Contact CRUD
│       ├── deals/             # Deal CRUD
│       ├── activities/        # Activity logging
│       ├── reminders/         # Reminder CRUD
│       ├── drafts/            # AI email draft management
│       ├── gmail/             # Gmail OAuth flow
│       ├── cron/gmail-sync/   # Sync unread emails
│       └── webhooks/inbound/  # Receive events from main app
├── components/
│   ├── inbox/                 # DraftCard, DraftDetailSheet
│   ├── pipeline/              # PipelineBoard, DealCard, AddDealDialog
│   ├── activities/            # ActivityTimeline, ActivityLogDialog
│   ├── email/                 # EmailComposeDialog
│   ├── layout/                # Header, Sidebar
│   └── ui/                    # Radix/shadcn primitives
└── lib/
    ├── db/
    │   ├── schema.ts          # Drizzle schema (all tables)
    │   └── index.ts           # Database connection
    ├── ai/
    │   └── email-drafter.ts   # Gemini email draft generation
    ├── gmail/
    │   ├── client.ts          # Gmail API client & OAuth
    │   └── send.ts            # Send emails via Gmail
    ├── auth/
    │   └── api-key.ts         # API key validation for webhooks
    └── constants/
        ├── pipeline.ts        # Stages, tiers, sources, etc.
        └── email-drafts.ts    # Draft tone options
```

### Database Schema

```
contacts           # Companies/individuals (leads)
  └── deals        # Sales opportunities (pipeline)
        ├── activities    # Interaction history
        └── reminders     # Follow-up tasks

processedEmails    # Synced Gmail messages
  └── emailDrafts  # AI-generated draft responses

settings           # Key-value config (Gmail tokens, etc.)
```

**Key Tables:**

| Table | Purpose |
|-------|---------|
| `contacts` | Name, email, company, property type, source, tags |
| `deals` | Pipeline stage, tier, value, probability, next step, follow-up date |
| `activities` | Type (call/email/demo/meeting/note), subject, outcome |
| `reminders` | Title, due date, priority, completion status |
| `emailDrafts` | Original email context, AI-generated response, status (pending/sent) |

### Pipeline Stages

| Stage | Probability | Color |
|-------|-------------|-------|
| Lead | 10% | Gray |
| Qualified | 25% | Blue |
| Demo Scheduled | 50% | Purple |
| Proposal Sent | 65% | Amber |
| Negotiation | 80% | Orange |
| Closed Won | 100% | Green |
| Closed Lost | 0% | Red |

### Pricing Tiers (AskConciergeAI Product)

| Tier | Monthly | Annual |
|------|---------|--------|
| Ruby Studio | $24.90 | $249 |
| Sapphire Suite | $59 | $590 |
| Emerald Boutique | $199 | $1,990 |
| Diamond Presidential | $499 | $4,990 |

## Key Features

### 1. Pipeline Board (`/pipeline`)
- Kanban-style deal management
- Drag-and-drop between stages
- Deal value and probability tracking
- Lost reason capture

### 2. AI Email Inbox (`/inbox`)
- Syncs unread emails from Gmail
- AI generates draft responses using Gemini
- Tone options: professional, friendly, concise, follow-up
- Review, edit, regenerate, and send drafts
- Links drafts to contacts/deals automatically

### 3. Contact Management (`/contacts`)
- Track companies and individuals
- Property type classification (hotel, vacation rental, property manager)
- Source tracking (inbound, cold outreach, LinkedIn, referral)
- Activity timeline per contact

### 4. Reminders (`/reminders`)
- Follow-up task management
- Priority levels (low, medium, high)
- Due date tracking
- Link to deals and contacts

## Webhook Integration

The main AskConciergeAI app sends events to this CRM via `POST /api/webhooks/inbound`.

**Webhook Sources:**
- `signup` - New trial signups
- `stripe` - Subscription events (created, cancelled)
- `contact_form` - Website contact form submissions
- `ticket` - Support ticket creation
- `guest_contact` - Guest email collection

**Payload Format:**
```json
{
  "source": "signup",
  "event": "trial_started",
  "data": {
    "email": "user@example.com",
    "name": "John Smith",
    "company": "Beach Resort",
    "accountType": "hotel",
    "tier": "sapphire"
  }
}
```

**Authentication:**
Include header `X-API-Key: <CRM_API_KEY>`

## Gmail Integration Flow

1. User clicks "Connect Gmail" in Settings
2. Redirects to Google OAuth (`/api/gmail/authorize`)
3. User grants permissions
4. Callback stores tokens (`/api/gmail/callback`)
5. Cron job syncs unread emails (`/api/cron/gmail-sync`)
6. AI generates draft responses for new emails
7. User reviews/sends from Inbox

## AI Email Drafter

**Location:** `src/lib/ai/email-drafter.ts`

Uses Gemini 2.0 Flash to generate contextual email responses:
- Considers contact/deal context if available
- Multiple tone options
- Regenerate with feedback
- JSON output format

## Development Notes

- This is a single-user CRM (no multi-tenant auth)
- Gmail tokens stored in `settings` table
- Use `npm run db:studio` to inspect data
- Webhook endpoint requires `CRM_API_KEY` header
