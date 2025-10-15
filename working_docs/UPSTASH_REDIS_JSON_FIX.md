# Upstash Redis JSON Serialization Fix

## Issue

Error when verifying OTP:

```
SyntaxError: "[object Object]" is not valid JSON
    at JSON.parse (<anonymous>)
    at OTPService.verifyOTP
```

## Root Cause

Upstash Redis **automatically handles JSON serialization/deserialization**. When we stored data using `JSON.stringify()`, Redis stored it as a string, but when retrieved, it was already deserialized back to an object. Calling `JSON.parse()` on an already-parsed object caused the error.

## Solution

### Before (Incorrect)

```typescript
// Storing - stringifying the object
await redis.set(`otp:${email}`, JSON.stringify(otpData), { px: expiry });

// Retrieving - trying to parse an already-parsed object
const redisData = await redis.get(`otp:${email}`);
const storedData = redisData ? String(redisData) : null; // ❌ Converts object to "[object Object]"
const otpData = JSON.parse(storedData); // ❌ Fails!
```

### After (Correct)

```typescript
// Storing - let Redis handle serialization
await redis.set(`otp:${email}`, otpData, { px: expiry });

// Retrieving - use TypeScript generic for type safety
const otpData = await redis.get<OTPData>(`otp:${email}`);
// ✅ Returns typed object directly, no parsing needed
```

## Changes Made

### 1. `sendOTP()` - Store object directly

```typescript
// Store OTP in Upstash Redis or mock storage
if (MOCK_MODE) {
  // Mock mode: store as JSON string (in-memory Map needs strings)
  mockStorage.set(`otp:${email}`, JSON.stringify(otpData));
} else {
  // Production: store as object (Redis handles serialization)
  await redis.set(`otp:${email}`, otpData, {
    px: parseInt(process.env.OTP_EXPIRY_MINUTES || '10') * 60 * 1000
  });
}
```

### 2. `verifyOTP()` - Retrieve with type safety

```typescript
let otpData: OTPData | null = null;

if (MOCK_MODE) {
  // Mock mode: parse JSON string from in-memory storage
  const storedData = mockStorage.get(`otp:${email}`) || null;
  if (storedData) {
    otpData = JSON.parse(storedData);
  }
} else {
  // Production: get typed object directly from Redis
  const redisData = await redis.get<OTPData>(`otp:${email}`);
  otpData = redisData;
}
```

## Key Takeaways

1. **Upstash Redis auto-handles JSON**: No need to manually stringify/parse
2. **Use TypeScript generics**: `redis.get<Type>()` for type safety
3. **Mock storage differs**: In-memory Map still needs JSON strings
4. **Cleaner code**: Less manual serialization = fewer errors

## Testing

The fix maintains compatibility with both modes:

- ✅ **Mock mode**: Uses JSON.stringify/parse for in-memory storage
- ✅ **Production mode**: Uses Redis automatic serialization
- ✅ **Type safety**: TypeScript generic ensures correct typing
- ✅ **No breaking changes**: API remains the same

## Related Files

- `src/lib/otp-service.ts` - Fixed OTP storage and retrieval
- `UPSTASH_REDIS_MIGRATION.md` - Original migration documentation
