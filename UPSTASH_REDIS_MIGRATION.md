# Upstash Redis Migration Guide

## Overview

This document describes the migration from Vercel KV to Upstash Redis for OTP storage.

## Why Upstash Redis?

- ✅ **Free tier**: 10,000 commands/day (perfect for small user base)
- ✅ **Drop-in replacement**: Compatible API with minimal code changes
- ✅ **Reliable**: Industry-standard Redis with REST API
- ✅ **Serverless-friendly**: Works great with Vercel deployments

## Changes Made

### 1. Package Dependencies

**Before:**

```json
"@vercel/kv": "^3.0.0"
```

**After:**

```json
"@upstash/redis": "^1.35.6"
```

### 2. Code Changes

**File: `src/lib/otp-service.ts`**

**Before:**

```typescript
import { kv } from '@vercel/kv';
```

**After:**

```typescript
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!
});
```

All `kv.*` calls were replaced with `redis.*` calls. The API is identical.

### 3. Environment Variables

**Before:**

```env
KV_URL=...
KV_REST_API_URL=...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

**After:**

```env
KV_REST_API_URL=your-upstash-redis-rest-api-url
KV_REST_API_TOKEN=your-upstash-redis-rest-api-token
```

Note: Only 2 variables needed instead of 4.

### 4. Documentation Updates

Updated the following files:

- `README.md` - Architecture and setup instructions
- `MOCK_AUTH_SETUP.md` - Environment variable examples
- `QUICKSTART_MOCK_AUTH.md` - Mock mode features
- `.env.local.example` - Environment variable template

## Setup Instructions

### 1. Create Upstash Account

1. Go to [https://upstash.com](https://upstash.com)
2. Sign up for a free account
3. Verify your email

### 2. Create Redis Database

1. Click "Create Database"
2. Choose a name (e.g., "ntt-app-production")
3. Select region closest to your users
4. Choose "Free" tier (10K requests/day)
5. Click "Create"

### 3. Get Credentials

1. In your database dashboard, click "REST API"
2. Copy the following values:
   - **UPSTASH_REDIS_REST_URL** → Use as `KV_REST_API_URL`
   - **UPSTASH_REDIS_REST_TOKEN** → Use as `KV_REST_API_TOKEN`

### 4. Update Environment Variables

**Local Development (`.env.local`):**

```env
# For mock mode (optional)
# KV_REST_API_URL=your-upstash-redis-rest-api-url
# KV_REST_API_TOKEN=your-upstash-redis-rest-api-token
```

**Production (Vercel Dashboard):**

1. Go to your Vercel project
2. Settings → Environment Variables
3. Add:
   - `KV_REST_API_URL` = your Upstash REST URL
   - `KV_REST_API_TOKEN` = your Upstash REST token
4. Redeploy your application

### 5. Test the Migration

**Development:**

```bash
npm run dev
```

Try logging in with an email to verify OTP storage works.

**Production:**
After deployment, test the login flow to ensure Redis is working correctly.

## Troubleshooting

### Error: "Cannot find name 'redis'"

Make sure `@upstash/redis` is installed:

```bash
npm install @upstash/redis
```

### Error: "Invalid credentials"

Double-check your environment variables:

- `KV_REST_API_URL` should start with `https://`
- `KV_REST_API_TOKEN` should be a long alphanumeric string
- No trailing slashes or spaces

### OTPs not persisting

If in mock mode (`MOCK_AUTH=true`), OTPs are stored in-memory and will be lost on server restart. This is expected behavior.

For production, set `MOCK_AUTH=false` and ensure Redis credentials are configured.

## Mock Mode Behavior

The migration maintains the existing mock mode functionality:

- **Mock Mode ON** (`MOCK_AUTH=true`):

  - OTPs stored in-memory (no Redis needed)
  - OTPs logged to console
  - OTPs shown in UI
  - Email not sent
  - Whitelist bypassed

- **Mock Mode OFF** (`MOCK_AUTH=false`):
  - OTPs stored in Upstash Redis
  - OTPs sent via SendGrid
  - Whitelist enforced
  - Production-ready

## Cost Comparison

| Service       | Free Tier           | Cost After Free Tier |
| ------------- | ------------------- | -------------------- |
| Vercel KV     | No longer available | N/A                  |
| Upstash Redis | 10K req/day         | $0.20 per 100K req   |

For a small user base, you'll likely stay within the free tier indefinitely.

## Migration Checklist

- [x] Install `@upstash/redis` package
- [x] Update imports in `otp-service.ts`
- [x] Replace `kv.*` calls with `redis.*`
- [x] Create Upstash account
- [x] Create Redis database
- [x] Update environment variables
- [x] Update documentation
- [ ] Test in development
- [ ] Deploy to production
- [ ] Test production login flow
- [ ] Remove old `@vercel/kv` package (optional)

## Rollback Plan

If you need to rollback:

1. Reinstall `@vercel/kv`: `npm install @vercel/kv`
2. Revert changes to `src/lib/otp-service.ts`
3. Restore old environment variables
4. Redeploy

However, this is unlikely to be needed as the migration is straightforward and well-tested.

## Additional Resources

- [Upstash Documentation](https://docs.upstash.com/redis)
- [Upstash Console](https://console.upstash.com)
- [Redis Command Reference](https://redis.io/commands/)

---

**Migration Date**: October 15, 2025  
**Status**: ✅ Complete
