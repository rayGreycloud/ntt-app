# Quick Start: Mock Authentication

## Setup (30 seconds)

### Option 1: Minimal Setup (Fastest)

1. **Copy the minimal config:**

   ```bash
   cp .env.local.minimal .env.local
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

### Option 2: Full Setup

1. **Create `.env.local` file:**

   ```bash
   cp .env.local.example .env.local
   ```

2. **Add this line to enable mock mode:**

   ```env
   MOCK_AUTH=true
   JWT_SECRET=your-secret-key
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

## How to Login

1. Go to http://localhost:3000
2. Enter **any email** (e.g., `test@example.com`)
3. Click "Send Code"
4. **Check your terminal** for output like this:

```
========================================
🔐 MOCK AUTH MODE - OTP Generated
========================================
Email: test@example.com
OTP Code: 123456
Expires: 10/11/2025, 3:45:00 PM
========================================
```

5. The OTP also appears in a **yellow box** in the UI - click to auto-fill!
6. Click "Verify" to login

## Features

✅ No email service required  
✅ No Upstash Redis required (uses in-memory storage)  
✅ OTP shown in terminal console  
✅ OTP shown in UI (dev mode only)  
✅ Click to auto-fill OTP  
✅ Whitelist checking disabled  
✅ Auto-enabled if no SendGrid key

**Note:** In mock mode, OTPs are stored in memory and will be cleared if you restart the server.

## Switch to Production

When ready to use real emails:

1. Get SendGrid API key
2. Update `.env.local`:
   ```env
   MOCK_AUTH=false
   SENDGRID_API_KEY=SG.your-key-here
   SENDGRID_FROM_EMAIL=noreply@yourdomain.com
   WHITELISTED_EMAILS=user1@company.com,user2@company.com
   ```
3. Restart server

---

📖 For detailed documentation, see [MOCK_AUTH_SETUP.md](./MOCK_AUTH_SETUP.md)
