# Transcript Tool - Next.js App

A modern, secure transcript formatting tool built with Next.js, featuring AI-powered caption detection, email OTP authentication, and DOCX generation.

## Features

- 🔐 **Email OTP Authentication** - Secure access with whitelisted emails
- 🤖 **AI Caption Detection** - Automatic boundary detection using Vercel AI SDK
- 📄 **DOCX Generation** - Professional Word document output with templates
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- ⚡ **Fast Processing** - Real-time transcript formatting
- 🔒 **Secure** - JWT-based sessions and encrypted storage

## Architecture

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Authentication**: Email OTP with Vercel KV storage
- **AI Integration**: Vercel AI SDK with OpenAI for caption detection
- **Email Service**: SendGrid for OTP delivery
- **Document Generation**: docx library for Word document creation
- **Deployment**: Optimized for Vercel platform

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your variables:

```bash
cp .env.local.example .env.local
```

**🧪 Quick Start with Mock Auth (No Email Setup Required)**

For development without email service setup, see [QUICKSTART_MOCK_AUTH.md](./QUICKSTART_MOCK_AUTH.md)

Required environment variables:

#### Vercel KV Database

```env
KV_URL=your_kv_url
KV_REST_API_URL=your_kv_rest_api_url
KV_REST_API_TOKEN=your_kv_rest_api_token
KV_REST_API_READ_ONLY_TOKEN=your_kv_read_only_token
```

#### SendGrid Email Service

```env
SENDGRID_API_KEY=your_sendgrid_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Note:** If you don't have SendGrid set up yet, you can use mock authentication mode. See [QUICKSTART_MOCK_AUTH.md](./QUICKSTART_MOCK_AUTH.md) for details.

#### OpenAI for AI Caption Detection

```env
OPENAI_API_KEY=your_openai_api_key
```

#### App Configuration

```env
WHITELISTED_EMAILS=user1@company.com,user2@company.com
JWT_SECRET=your-secure-jwt-secret
OTP_EXPIRY_MINUTES=10
```

### 3. Development

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### 4. Deployment to Vercel

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Initial transcript tool setup"
   git push origin main
   ```

2. **Connect to Vercel**:

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository

3. **Configure Environment Variables**:

   - In Vercel project settings, add all environment variables
   - Make sure to use production values for APIs

4. **Deploy**:
   - Vercel will automatically deploy on push to main
   - Domain will be provided (e.g., `your-app.vercel.app`)

## Service Setup

### Vercel KV Database

1. Go to Vercel Dashboard → Storage
2. Create new KV database
3. Copy connection strings to environment variables

### SendGrid Email

1. Sign up at SendGrid
2. Verify sender email address
3. Create API key with Mail Send permissions
4. Update sender email in `src/lib/otp-service.ts`

### OpenAI API

1. Get API key from OpenAI Platform
2. Add to environment variables
3. Monitor usage in OpenAI dashboard

## Usage

1. **Authentication**: Users enter their email (must be whitelisted)
2. **OTP Verification**: 6-digit code sent via email
3. **File Upload**: Drag & drop or select .txt transcript files
4. **AI Processing**: Automatic caption boundary detection
5. **Manual Editing**: Fine-tune formatting options
6. **Download**: Generate .txt or .docx formatted output

## File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   └── transcript/    # Processing endpoints
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx          # Main app component
├── components/
│   ├── AuthForm.tsx      # Email OTP authentication
│   ├── TranscriptUploader.tsx  # File upload interface
│   └── TranscriptProcessor.tsx # Main processing UI
├── lib/
│   ├── otp-service.ts    # Email OTP functionality
│   ├── transcript-ai.ts  # AI caption detection
│   └── docx-service.ts   # Word document generation
└── types/
    └── transcript.ts     # TypeScript interfaces
```

## Security Features

- Email whitelist for authorized users only
- JWT-based secure sessions
- HTTP-only cookies for token storage
- OTP expiration and cleanup
- Environment-based configuration

## Troubleshooting

### Common Issues

1. **OTP not received**: Check SendGrid configuration and sender email
2. **AI detection fails**: Verify OpenAI API key and usage limits
3. **DOCX generation errors**: Check file content and template formatting
4. **Authentication issues**: Verify JWT secret and KV database connection

### Logs

Check Vercel function logs for API errors and debugging information.

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push branch: `git push origin feature-name`
5. Submit pull request

## License

© 2024 Naegeli Deposition & Trial. All rights reserved.
