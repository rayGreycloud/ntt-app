# Mock Authentication Setup

This document explains how to use the mock authentication mode for development and testing.

## Overview

The mock authentication mode allows you to test the login flow without requiring a SendGrid account or email delivery. The OTP (One-Time Password) is displayed in the server console and optionally in the UI during development.

## When Mock Mode is Enabled

Mock mode is automatically enabled when:

1. `MOCK_AUTH=true` is set in your `.env.local` file, OR
2. `SENDGRID_API_KEY` is not configured

## Setting Up Mock Mode

### 1. Create Environment File

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

### 2. Configure Mock Mode

In `.env.local`, ensure one of these conditions is true:

**Option A: Explicit Mock Mode**

```env
MOCK_AUTH=true
```

**Option B: No SendGrid Key (implicit mock mode)**

```env
# SENDGRID_API_KEY not set or commented out
# SENDGRID_API_KEY=your-key-here
```

### 3. Set Required Environment Variables

Even in mock mode, you still need:

```env
# JWT Secret for session tokens
JWT_SECRET=your-secret-key-change-this
```

**Optional (only needed for production):**

```env
# Vercel KV for OTP storage (not required in mock mode)
KV_URL=your-kv-url
KV_REST_API_URL=your-kv-rest-api-url
KV_REST_API_TOKEN=your-kv-rest-api-token
KV_REST_API_READ_ONLY_TOKEN=your-kv-rest-api-read-only-token
```

**Note:** In mock mode, OTPs are stored in-memory instead of Vercel KV, so you don't need to configure KV for development.

## Using Mock Mode

### Development Workflow

1. **Start the development server:**

   ```bash
   npm run dev
   ```

2. **Navigate to the app:**
   Open http://localhost:3000

3. **Enter any email address:**

   - In mock mode, the whitelist check is bypassed
   - You can use any valid email format (e.g., `test@example.com`)

4. **Get the OTP:**

   **Server Console:**

   ```
   ========================================
   🔐 MOCK AUTH MODE - OTP Generated
   ========================================
   Email: test@example.com
   OTP Code: 123456
   Expires: 10/11/2025, 3:45:00 PM
   ========================================
   ```

   **UI (Development Only):**
   The OTP will also appear in a yellow box on the verification screen with an auto-fill button.

5. **Enter the OTP:**
   - Copy the 6-digit code from the console or UI
   - Paste it into the verification code field
   - Click "Verify"

### Security Notes

- **Development Only:** The OTP is only returned in the API response when `NODE_ENV === 'development'`
- **Console Logging:** OTP codes are always logged to the server console in mock mode
- **UI Display:** The UI only shows the OTP if it's returned in the API response

## Transitioning to Production

### 1. Set Up SendGrid

1. Create a SendGrid account at https://sendgrid.com
2. Generate an API key with "Mail Send" permissions
3. Verify your sender email address

### 2. Update Environment Variables

```env
# Disable mock mode
MOCK_AUTH=false

# Add SendGrid credentials
SENDGRID_API_KEY=SG.your-actual-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Configure email whitelist
WHITELISTED_EMAILS=user1@company.com,user2@company.com
```

### 3. Test Email Delivery

1. Restart your application
2. Try logging in with a whitelisted email
3. Check your inbox for the OTP email

## Troubleshooting

### OTP Not Appearing in Console

**Check:**

- Is `MOCK_AUTH=true` in your `.env.local`?
- Did you restart the dev server after changing `.env.local`?
- Are you looking at the server console (terminal), not browser console?

### OTP Not Showing in UI

**This is expected if:**

- You're in production mode (`NODE_ENV=production`)
- The API is not returning the OTP in the response

**Solution:**

- Check the server console instead
- Verify `NODE_ENV=development` in your environment

### Can't Verify OTP

**Possible causes:**

1. **Expired OTP** - Default expiry is 10 minutes
2. **Wrong email** - Make sure you're using the exact email you entered
3. **Server restart** - In mock mode, in-memory storage is cleared on restart

**Note:** Mock mode uses in-memory storage, so OTPs are lost if you restart the dev server.

### Whitelist Errors in Production

If you get "Email not authorized" errors:

1. Check `WHITELISTED_EMAILS` in `.env.local`
2. Ensure emails are comma-separated with no spaces
3. Verify `MOCK_AUTH=false` for production

## Configuration Reference

| Variable              | Mock Mode | Production | Description              |
| --------------------- | --------- | ---------- | ------------------------ |
| `MOCK_AUTH`           | `true`    | `false`    | Enable/disable mock mode |
| `SENDGRID_API_KEY`    | Optional  | Required   | SendGrid API key         |
| `SENDGRID_FROM_EMAIL` | Optional  | Required   | Verified sender email    |
| `WHITELISTED_EMAILS`  | Bypassed  | Required   | Comma-separated list     |
| `OTP_EXPIRY_MINUTES`  | `10`      | `10`       | OTP validity period      |
| `JWT_SECRET`          | Required  | Required   | Session token secret     |
| `KV_*`                | Required  | Required   | Vercel KV credentials    |

## Example .env.local Files

### Development (Mock Mode)

```env
MOCK_AUTH=true
JWT_SECRET=dev-secret-key
OTP_EXPIRY_MINUTES=10
# Add your Vercel KV credentials
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### Production

```env
MOCK_AUTH=false
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@naegeli.com
WHITELISTED_EMAILS=john@naegeli.com,jane@naegeli.com
JWT_SECRET=strong-random-production-secret
OTP_EXPIRY_MINUTES=10
# Add your Vercel KV credentials
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```
