# Mock Auth OTP Display Fix

## Issue

The mock OTP code was not displaying in the login UI on deployed environments (even development deployments), despite `MOCK_AUTH=true` being set.

## Root Cause

The OTP service was checking `process.env.NODE_ENV === 'development'` to decide whether to return the OTP in the API response. In deployed environments (including dev deployments on Vercel), `NODE_ENV` is typically set to `production`, which prevented the OTP from being sent to the frontend.

## Solution

Changed the condition to check the `MOCK_AUTH` environment variable directly instead of `NODE_ENV`:

**Before:**

```typescript
return {
  success: true,
  message: 'MOCK MODE: Check server console for OTP code',
  otp: process.env.NODE_ENV === 'development' ? otp : undefined
};
```

**After:**

```typescript
return {
  success: true,
  message: 'MOCK MODE: OTP displayed below (server console also logged)',
  otp: otp // Return OTP in response when MOCK_AUTH is enabled
};
```

## How It Works Now

### When `MOCK_AUTH=true`:

1. User enters email address
2. System generates 6-digit OTP code
3. OTP is stored in memory (no database required)
4. **OTP is returned in the API response**
5. Frontend displays OTP in a yellow dev mode box
6. OTP is also logged to server console
7. User can click to auto-fill the OTP

### UI Display

The OTP appears in a prominent yellow box with:

- 🧪 DEV MODE indicator
- Large, monospaced OTP display
- Click-to-auto-fill button

### Security Considerations

- ✅ Only works when `MOCK_AUTH=true` environment variable is set
- ✅ UI clearly indicates this is DEV MODE
- ✅ Yellow warning styling makes it obvious this is not production
- ⚠️ **Never enable `MOCK_AUTH` in true production environments**

## Configuration

Set in `.env.local` or environment variables:

```bash
# Enable mock authentication (displays OTP in UI)
MOCK_AUTH=true

# Optional: Whitelisted emails still work in mock mode
WHITELISTED_EMAILS='user1@example.com,user2@example.com'
```

## Testing

To verify the fix works:

1. Ensure `.env.local` has `MOCK_AUTH=true`
2. Start the app or deploy to development environment
3. Navigate to login page
4. Enter any email address
5. Click "Send Code"
6. **OTP should appear in yellow box below the input field**
7. Can click the auto-fill button or manually enter the OTP
8. Click "Verify" to authenticate

## Files Modified

- `src/lib/otp-service.ts` - Changed OTP return condition from `NODE_ENV` check to `MOCK_AUTH` check
- Updated message to indicate OTP is displayed in UI, not just console

## Related Files

- `src/components/AuthForm.tsx` - Already had the UI display logic for `devOtp`
- `src/app/api/auth/send-otp/route.ts` - Passes through the OTP from service

## Production Deployment

Before deploying to production:

1. ❌ Remove or set `MOCK_AUTH=false`
2. ✅ Configure SendGrid API key
3. ✅ Configure Vercel KV database
4. ✅ Set whitelisted emails
5. ✅ Verify email sending works

The system will automatically switch to real email-based OTP when:

- `MOCK_AUTH` is not set or is `false`, AND
- `SENDGRID_API_KEY` is configured
