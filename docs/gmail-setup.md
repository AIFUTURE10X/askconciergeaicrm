# Gmail Integration Setup Guide

This guide walks you through connecting Gmail to your CRM for automatic lead capture from incoming emails.

## Overview

Once configured, the CRM will:
- Check for new emails every 5 minutes
- Automatically create contacts and deals from business inquiries
- Skip no-reply and automated emails
- Mark processed emails as read and label them "CRM-Imported"

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top → **New Project**
3. Enter project name: `AskConciergeAI CRM`
4. Click **Create**
5. Wait for the project to be created, then select it

---

## Step 2: Enable Gmail API

1. In the left sidebar, go to **APIs & Services** → **Library**
2. Search for `Gmail API`
3. Click on **Gmail API** in the results
4. Click **Enable**

---

## Step 3: Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. Select **External** user type (unless you have Google Workspace)
3. Click **Create**

### App Information
| Field | Value |
|-------|-------|
| App name | `AskConciergeAI CRM` |
| User support email | Your email address |
| Developer contact | Your email address |

4. Click **Save and Continue**

### Scopes
1. Click **Add or Remove Scopes**
2. Find and select these scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
3. Click **Update**
4. Click **Save and Continue**

### Test Users (if in testing mode)
1. Click **Add Users**
2. Add your Gmail address
3. Click **Save and Continue**

4. Review summary and click **Back to Dashboard**

---

## Step 4: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Web application** as the application type
4. Enter name: `CRM Gmail Integration`

### Authorized Redirect URIs
Add this exact URI:
```
https://askconciergeaicrm.vercel.app/api/gmail/callback
```

5. Click **Create**
6. A popup will show your credentials - **copy both values**:
   - **Client ID** (ends with `.apps.googleusercontent.com`)
   - **Client Secret**

---

## Step 5: Add Environment Variables

Provide the following values to be added to Vercel:

| Variable | Description |
|----------|-------------|
| `GMAIL_CLIENT_ID` | The Client ID from Step 4 |
| `GMAIL_CLIENT_SECRET` | The Client Secret from Step 4 |
| `GMAIL_REDIRECT_URI` | `https://askconciergeaicrm.vercel.app/api/gmail/callback` |

---

## Step 6: Connect Gmail in CRM

1. Go to [CRM Settings](https://askconciergeaicrm.vercel.app/settings)
2. Find the **Gmail Integration** card
3. Click **Connect Gmail**
4. Sign in with your Google account
5. Grant the requested permissions
6. You'll be redirected back to Settings with a success message

---

## How It Works

### Email Sync Process

The cron job runs every 5 minutes and:

1. **Fetches unread emails** from your inbox
2. **Filters out** automated/no-reply addresses:
   - noreply, no-reply, donotreply
   - mailer-daemon, postmaster
   - notifications, alerts, system, automated
3. **Creates or finds contact** by email address
4. **Creates a new deal** in the "Lead" stage
5. **Logs an activity** with the email content
6. **Marks email as read** and adds "CRM-Imported" label

### What Gets Created

For each qualifying email:

| Entity | Details |
|--------|---------|
| **Contact** | Name from email header, email address, source: "inbound" |
| **Deal** | Stage: "lead", Probability: 10%, Follow-up: next day |
| **Activity** | Type: "email", includes subject and body preview |

---

## Optional: Filter by Label

To only sync emails with a specific Gmail label:

1. Create a label in Gmail (e.g., "Sales Leads")
2. Set up a Gmail filter to auto-label relevant emails
3. Add environment variable:
   ```
   GMAIL_LABEL_FILTER=Sales Leads
   ```

This is useful if you want to manually curate which emails become leads.

---

## Troubleshooting

### "Gmail not configured"
Environment variables are missing. Ensure `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REDIRECT_URI` are set in Vercel.

### "Gmail not connected"
OAuth tokens are not saved. Click **Connect Gmail** to authorize.

### OAuth Error: "redirect_uri_mismatch"
The redirect URI in Google Cloud doesn't match exactly. Ensure it's:
```
https://askconciergeaicrm.vercel.app/api/gmail/callback
```

### Emails not syncing
1. Check the Vercel function logs for `/api/cron/gmail-sync`
2. Ensure `CRON_SECRET` is set (Vercel uses this to authenticate cron calls)
3. Verify the cron job is registered: check Vercel dashboard → Project → Settings → Cron Jobs

### Token expired
Tokens auto-refresh, but if issues persist:
1. Go to Settings → Click **Disconnect**
2. Click **Connect Gmail** again to re-authorize

---

## Security Notes

- OAuth tokens are stored encrypted in the database
- Only your CRM instance can access your emails
- The app only requests read/modify access (cannot send emails)
- You can revoke access anytime at [Google Account Permissions](https://myaccount.google.com/permissions)

---

## Disconnecting Gmail

1. Go to [CRM Settings](https://askconciergeaicrm.vercel.app/settings)
2. Click **Disconnect** in the Gmail Integration card
3. Optionally, revoke access at [Google Account Permissions](https://myaccount.google.com/permissions)

Email sync will stop immediately. Existing contacts and deals are preserved.
