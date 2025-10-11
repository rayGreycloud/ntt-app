'use client';

import { useState, useEffect } from 'react';
import AuthForm from '@/components/AuthForm';
import TranscriptUploader from '@/components/TranscriptUploader';
import TranscriptProcessor from '@/components/TranscriptProcessor';
import { TranscriptData } from '@/types/transcript';

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [transcriptData, setTranscriptData] = useState<TranscriptData | null>(
    null
  );
  const [, setProcessedData] = useState<TranscriptData | null>(null);

  // Check if user is already authenticated (has valid cookie)
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/check', {
          method: 'GET',
          credentials: 'include'
        });
        if (response.ok) {
          setIsAuthenticated(true);
        }
        // 401 is expected when not authenticated, don't log it
      } catch (error) {
        // Only log unexpected errors (network issues, etc.)
        console.error('Auth check error:', error);
      }
    };

    checkAuth();
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      setIsAuthenticated(false);
      setTranscriptData(null);
      setProcessedData(null);
    } catch (error) {
      console.error('Logout failed:', error);
      // Still log out locally even if API call fails
      setIsAuthenticated(false);
    }
  };

  const handleFileUpload = (data: TranscriptData) => {
    setTranscriptData(data);
    setProcessedData(null);
  };

  const handleClear = () => {
    setTranscriptData(null);
    setProcessedData(null);
  };

  const handleProcessed = (data: TranscriptData) => {
    setProcessedData(data);
  };

  if (!isAuthenticated) {
    return <AuthForm onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      <div className='max-w-6xl mx-auto p-6'>
        {/* Header */}
        <header className='text-center mb-8'>
          <h1 className='text-4xl font-bold text-gray-900 dark:text-white mb-2'>
            Transcript Text File Formatter
          </h1>
          <p
            className='text-gray-600 dark:text-gray-400'
            suppressHydrationWarning
          >
            © {new Date().getFullYear()} Naegeli Deposition & Trial
          </p>
          <button
            onClick={handleLogout}
            className='mt-4 text-sm text-blue-600 hover:text-blue-800 underline'
          >
            Sign Out
          </button>
        </header>

        {/* Main Content */}
        <main className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8'>
          {!transcriptData ? (
            <TranscriptUploader onFileUpload={handleFileUpload} />
          ) : (
            <TranscriptProcessor
              transcriptData={transcriptData}
              onClear={handleClear}
              onProcessed={handleProcessed}
            />
          )}
        </main>

        {/* Instructions */}
        <div className='mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6'>
          <h2 className='text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3'>
            How to Use:
          </h2>
          <ol className='space-y-2 text-blue-800 dark:text-blue-200'>
            <li className='flex items-start'>
              <span className='font-bold mr-2'>1.</span>
              Upload a transcript text file (.txt format only)
            </li>
            <li className='flex items-start'>
              <span className='font-bold mr-2'>2.</span>
              Use AI detection or manually click to mark the end of the caption
              section
            </li>
            <li className='flex items-start'>
              <span className='font-bold mr-2'>3.</span>
              Adjust indentation and line break settings as needed
            </li>
            <li className='flex items-start'>
              <span className='font-bold mr-2'>4.</span>
              Process the transcript using the formatting buttons
            </li>
            <li className='flex items-start'>
              <span className='font-bold mr-2'>5.</span>
              Download as either a formatted text file or Word document
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
