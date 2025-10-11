'use client';

import { useState } from 'react';

interface AuthFormProps {
  onAuthenticated: () => void;
}

export default function AuthForm({ onAuthenticated }: AuthFormProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const sendOTP = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (data.success) {
        setStep('otp');
        setMessage('Verification code sent to your email');
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      });

      const data = await response.json();

      if (data.success) {
        onAuthenticated();
      } else {
        setMessage(data.message);
      }
    } catch {
      setMessage('Failed to verify code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'email') {
      sendOTP();
    } else {
      verifyOTP();
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
      <div className='max-w-md w-full space-y-8 p-8'>
        <div className='text-center'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white'>
            Transcript Tool
          </h1>
          <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
            © {new Date().getFullYear()} Naegeli Deposition & Trial
          </p>
        </div>

        <div className='bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg'>
          <h2 className='text-xl font-semibold mb-4 text-center text-gray-900 dark:text-white'>
            {step === 'email' ? 'Enter your email' : 'Enter verification code'}
          </h2>

          <form onSubmit={handleSubmit} className='space-y-4'>
            {step === 'email' ? (
              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Email Address
                </label>
                <input
                  id='email'
                  type='email'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white'
                  placeholder='your.email@company.com'
                />
              </div>
            ) : (
              <div>
                <label
                  htmlFor='otp'
                  className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'
                >
                  Verification Code
                </label>
                <input
                  id='otp'
                  type='text'
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  maxLength={6}
                  className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white text-center text-lg tracking-widest'
                  placeholder='000000'
                />
                <p className='mt-2 text-xs text-gray-500 dark:text-gray-400'>
                  Code sent to {email}
                </p>
              </div>
            )}

            {message && (
              <div
                className={`p-3 rounded text-sm ${
                  message.includes('sent') || message.includes('success')
                    ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}
              >
                {message}
              </div>
            )}

            <div className='flex space-x-3'>
              {step === 'otp' && (
                <button
                  type='button'
                  onClick={() => {
                    setStep('email');
                    setOtp('');
                    setMessage('');
                  }}
                  className='flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors'
                >
                  Back
                </button>
              )}

              <button
                type='submit'
                disabled={
                  loading ||
                  (step === 'email' && !email) ||
                  (step === 'otp' && !otp)
                }
                className='flex-1 py-2 px-4 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
              >
                {loading
                  ? 'Processing...'
                  : step === 'email'
                  ? 'Send Code'
                  : 'Verify'}
              </button>
            </div>
          </form>

          <div className='mt-4 text-xs text-center text-gray-500 dark:text-gray-400'>
            Only authorized email addresses can access this tool
          </div>
        </div>
      </div>
    </div>
  );
}
