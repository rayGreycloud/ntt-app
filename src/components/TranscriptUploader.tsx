'use client';

import { useState, useRef } from 'react';
import { TranscriptData } from '@/types/transcript';

interface TranscriptUploaderProps {
  onFileUpload: (data: TranscriptData) => void;
}

export default function TranscriptUploader({
  onFileUpload
}: TranscriptUploaderProps) {
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const removePageAndLineNumbers = (content: string): string => {
    // Regular expression to match page and line numbers
    const regex = /\n\s*\d+\s{0,3}/g;
    return content.replace(regex, '');
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.endsWith('.txt')) {
      alert('Please select a .txt file');
      return;
    }

    try {
      const content = await file.text();
      const cleanedContent = removePageAndLineNumbers(content);

      onFileUpload({
        content: cleanedContent,
        fileName: file.name.replace('.txt', '')
      });
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error reading file. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  return (
    <div className='mb-6'>
      <div
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
          ${
            dragOver
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-300 dark:border-gray-600'
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className='flex flex-col items-center space-y-2'>
          <svg
            className='w-12 h-12 text-gray-400'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12'
            />
          </svg>
          <p className='text-lg font-medium text-gray-700 dark:text-gray-300'>
            Select or drop transcript file
          </p>
          <p className='text-sm text-gray-500 dark:text-gray-400'>
            Supports .txt files only
          </p>
        </div>

        <input
          ref={fileInputRef}
          type='file'
          accept='.txt'
          onChange={handleInputChange}
          className='hidden'
        />
      </div>
    </div>
  );
}
