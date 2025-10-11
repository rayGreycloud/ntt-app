'use client';

import { useState, useRef, useEffect } from 'react';
import { TranscriptData, ProcessingStep } from '@/types/transcript';

interface TranscriptProcessorProps {
  transcriptData: TranscriptData;
  onClear: () => void;
  onProcessed: (processedData: TranscriptData) => void;
}

export default function TranscriptProcessor({
  transcriptData,
  onClear,
  onProcessed
}: TranscriptProcessorProps) {
  // Step management
  const [currentStep, setCurrentStep] = useState<ProcessingStep>(
    ProcessingStep.CLEAN_ARTIFACTS
  );

  // Content state - preserved across all steps
  const [content, setContent] = useState(transcriptData.content);
  const [originalContent] = useState(transcriptData.content);

  // Step-specific state
  const [cleanedContent, setCleanedContent] = useState('');
  const [captionBoundary, setCaptionBoundary] = useState<number | null>(null);
  const [indentSpaces, setIndentSpaces] = useState(5);
  const [spaceThreshold, setSpaceThreshold] = useState(5);
  const [downloadFormat, setDownloadFormat] = useState<'txt' | 'docx'>('docx');

  // UI state
  const [processing, setProcessing] = useState(false);
  const [aiDetecting, setAiDetecting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-detect base indent when transcript loads
  useEffect(() => {
    if (
      transcriptData.content &&
      currentStep === ProcessingStep.CLEAN_ARTIFACTS
    ) {
      const baseIndent = detectBaseIndent(transcriptData.content);
      setIndentSpaces(baseIndent);
    }
  }, [transcriptData.content, currentStep]);

  const detectBaseIndent = (text: string): number => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
    const indents = lines.map((line) => {
      const match = line.match(/^ +/);
      return match ? match[0].length : 0;
    });
    const nonZeroIndents = indents.filter((indent) => indent > 0);
    if (nonZeroIndents.length > 0) {
      return Math.min(...nonZeroIndents);
    }
    return 5;
  };

  // Step 1: Clean page/line artifacts
  const cleanArtifacts = () => {
    setProcessing(true);
    try {
      // Normalize line endings
      let cleaned = content.replace(/\r\n/g, '\n');

      // Remove page and line number artifacts (pattern: newline + optional spaces + digits + up to 3 spaces)
      cleaned = cleaned.replace(/\n\s*\d+\s{0,3}/g, '\n');

      setCleanedContent(cleaned);
      setContent(cleaned);
      setCurrentStep(ProcessingStep.DETECT_CAPTION);
    } finally {
      setProcessing(false);
    }
  };

  // Step 2: Detect caption boundary (manual or AI)
  const insertCaptionMark = () => {
    if (!textareaRef.current || captionBoundary !== null) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;

    const marked =
      content.slice(0, cursorPos) + '🚩\n' + content.slice(cursorPos);
    setContent(marked);
    setCaptionBoundary(cursorPos);
  };

  const detectCaptionWithAI = async () => {
    setAiDetecting(true);
    try {
      const response = await fetch('/api/transcript/detect-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cleanedContent || content })
      });

      const data = await response.json();

      if (data.success && data.boundary > 0) {
        const baseContent = cleanedContent || content;
        const marked =
          baseContent.slice(0, data.boundary) +
          '🚩\n' +
          baseContent.slice(data.boundary);
        setContent(marked);
        setCaptionBoundary(data.boundary);
      } else {
        alert(
          'Could not automatically detect caption boundary. Please mark it manually.'
        );
      }
    } catch (error) {
      console.error('AI detection error:', error);
      alert('AI detection failed. Please mark the caption boundary manually.');
    } finally {
      setAiDetecting(false);
    }
  };

  const clearCaptionMark = () => {
    setContent(cleanedContent || originalContent);
    setCaptionBoundary(null);
  };

  const confirmCaptionBoundary = () => {
    if (captionBoundary === null) {
      alert('Please mark the caption boundary first');
      return;
    }
    setCurrentStep(ProcessingStep.REMOVE_INDENTATION);
  };

  // Step 3: Remove indentation
  const removeIndentations = () => {
    setProcessing(true);
    try {
      const regex = new RegExp(`\\n {${indentSpaces}}`, 'g');
      const processed = content.replace(regex, '\n');
      setContent(processed);
      setCurrentStep(ProcessingStep.SPLIT_CAPTION);
    } finally {
      setProcessing(false);
    }
  };

  const detectIndentWithAI = async () => {
    setAiDetecting(true);
    try {
      const response = await fetch('/api/transcript/detect-indent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const data = await response.json();

      if (data.success && data.recommendedIndent) {
        setIndentSpaces(data.recommendedIndent);
      } else {
        alert('Could not detect indentation. Using default value.');
      }
    } catch (error) {
      console.error('AI indent detection error:', error);
    } finally {
      setAiDetecting(false);
    }
  };

  // Step 4: Split caption (validation step)
  const confirmSplit = () => {
    // Remove the marker and proceed
    const cleanedText = content.replace('🚩\n', '');
    setContent(cleanedText);
    setCurrentStep(ProcessingStep.CONSOLIDATE_LINEBREAKS);
  };

  // Step 5: Consolidate line breaks
  const consolidateLineBreaks = () => {
    setProcessing(true);
    try {
      const markerIdx = content.indexOf('🚩');
      let caption = '';
      let body = content;

      if (markerIdx >= 0) {
        caption = content.slice(0, markerIdx);
        body = content.slice(markerIdx + 2);
      }

      const regex = new RegExp(
        `\\n(?!Q\\.|Q|A\\.|A| {${spaceThreshold},})`,
        'g'
      );
      const cleanedBody = body.replace(regex, ' ');

      const finalContent =
        markerIdx >= 0 ? caption + '\n' + cleanedBody : cleanedBody;

      setContent(finalContent);
      setCurrentStep(ProcessingStep.PREVIEW_DOWNLOAD);
    } finally {
      setProcessing(false);
    }
  };

  const detectLineBreakThresholdWithAI = async () => {
    setAiDetecting(true);
    try {
      const response = await fetch('/api/transcript/analyze-linebreaks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const data = await response.json();

      if (data.success && data.recommendedSpaceThreshold) {
        setSpaceThreshold(data.recommendedSpaceThreshold);
      } else {
        alert('Could not analyze line breaks. Using default value.');
      }
    } catch (error) {
      console.error('AI linebreak analysis error:', error);
    } finally {
      setAiDetecting(false);
    }
  };

  // Download functions
  const downloadTxtFile = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${transcriptData.fileName}_formatted.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(url);
  };

  const downloadDocxFile = async () => {
    setDownloading(true);
    try {
      const response = await fetch('/api/transcript/generate-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcriptData: {
            ...transcriptData,
            content: content
          },
          templateOptions: {
            companyName: process.env.NEXT_PUBLIC_COMPANY_NAME,
            headerText: 'FORMATTED TRANSCRIPT',
            footerText: `Generated on ${new Date().toLocaleDateString()}`
          }
        })
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `${transcriptData.fileName}_formatted_${new Date()
          .toISOString()
          .slice(0, 10)}.docx`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        window.URL.revokeObjectURL(url);
      } else {
        throw new Error('Failed to generate document');
      }
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to generate DOCX. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownload = () => {
    if (downloadFormat === 'txt') {
      downloadTxtFile();
    } else {
      downloadDocxFile();
    }
    onProcessed({
      ...transcriptData,
      content: content
    });
  };

  // Navigation
  const goToStep = (step: ProcessingStep) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
  };

  const handleClear = () => {
    setContent('');
    setCaptionBoundary(null);
    setCurrentStep(ProcessingStep.CLEAN_ARTIFACTS);
    onClear();
  };

  // Step titles for navigation
  const stepTitles = {
    [ProcessingStep.UPLOAD]: 'Upload',
    [ProcessingStep.CLEAN_ARTIFACTS]: 'Clean Artifacts',
    [ProcessingStep.DETECT_CAPTION]: 'Detect Caption',
    [ProcessingStep.REMOVE_INDENTATION]: 'Remove Indentation',
    [ProcessingStep.SPLIT_CAPTION]: 'Validate Split',
    [ProcessingStep.CONSOLIDATE_LINEBREAKS]: 'Consolidate Line Breaks',
    [ProcessingStep.PREVIEW_DOWNLOAD]: 'Preview & Download'
  };

  return (
    <div className='space-y-6'>
      {/* Step Navigation */}
      <div className='bg-gray-100 p-4 rounded-lg'>
        <div className='flex items-center justify-between mb-2'>
          <h3 className='text-sm font-semibold text-gray-700'>
            Processing Steps
          </h3>
          <button
            onClick={handleClear}
            className='text-xs px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors'
          >
            Reset
          </button>
        </div>
        <div className='flex items-center space-x-2 overflow-x-auto'>
          {[
            ProcessingStep.CLEAN_ARTIFACTS,
            ProcessingStep.DETECT_CAPTION,
            ProcessingStep.REMOVE_INDENTATION,
            ProcessingStep.SPLIT_CAPTION,
            ProcessingStep.CONSOLIDATE_LINEBREAKS,
            ProcessingStep.PREVIEW_DOWNLOAD
          ].map((step, idx) => (
            <div key={step} className='flex items-center'>
              <button
                onClick={() => goToStep(step)}
                disabled={step > currentStep}
                className={`px-3 py-2 rounded text-xs font-medium whitespace-nowrap transition-colors ${
                  step === currentStep
                    ? 'bg-blue-600 text-white'
                    : step < currentStep
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {idx + 1}. {stepTitles[step]}
              </button>
              {idx < 5 && <div className='mx-1 text-gray-400'>→</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Text Area - Always visible in same position */}
      <div className='relative'>
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onClick={
            currentStep === ProcessingStep.DETECT_CAPTION &&
            captionBoundary === null
              ? insertCaptionMark
              : undefined
          }
          className='w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
          placeholder='Transcript content...'
        />
        {currentStep === ProcessingStep.DETECT_CAPTION &&
          captionBoundary === null && (
            <div className='absolute top-2 left-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs'>
              Click to mark caption boundary or use AI detection
            </div>
          )}
        {captionBoundary !== null &&
          currentStep === ProcessingStep.DETECT_CAPTION && (
            <div className='absolute top-2 left-2 bg-green-100 text-green-800 px-2 py-1 rounded text-xs'>
              Caption boundary marked 🚩
            </div>
          )}
      </div>

      {/* Step-specific Controls */}
      <div className='bg-white p-4 border border-gray-200 rounded-lg min-h-[120px]'>
        {currentStep === ProcessingStep.CLEAN_ARTIFACTS && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>
              Step 1: Clean Page Artifacts
            </h3>
            <p className='text-sm text-gray-600'>
              Remove page numbers and line number artifacts from the transcript.
            </p>
            <button
              onClick={cleanArtifacts}
              disabled={processing}
              className='px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors'
            >
              {processing ? 'Cleaning...' : 'Clean Artifacts & Continue'}
            </button>
          </div>
        )}

        {currentStep === ProcessingStep.DETECT_CAPTION && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>
              Step 2: Detect Caption Boundary
            </h3>
            <p className='text-sm text-gray-600'>
              Mark where the caption section ends and testimony begins.
            </p>
            <div className='flex flex-wrap gap-3'>
              <button
                onClick={detectCaptionWithAI}
                disabled={captionBoundary !== null || aiDetecting}
                className='px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 transition-colors'
              >
                {aiDetecting ? 'Detecting...' : '🤖 Auto-Detect with AI'}
              </button>
              {captionBoundary !== null && (
                <>
                  <button
                    onClick={clearCaptionMark}
                    className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
                  >
                    Clear Marker
                  </button>
                  <button
                    onClick={confirmCaptionBoundary}
                    className='px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'
                  >
                    Confirm & Continue
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {currentStep === ProcessingStep.REMOVE_INDENTATION && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>
              Step 3: Remove Indentation
            </h3>
            <p className='text-sm text-gray-600'>
              Remove leading spaces from each line to normalize formatting.
            </p>
            <div className='flex flex-wrap gap-3 items-center'>
              <div className='flex items-center space-x-2'>
                <label htmlFor='indentCount' className='text-sm font-medium'>
                  Spaces to remove:
                </label>
                <input
                  id='indentCount'
                  type='number'
                  min='0'
                  max='20'
                  value={indentSpaces}
                  onChange={(e) =>
                    setIndentSpaces(parseInt(e.target.value) || 0)
                  }
                  className='w-16 px-2 py-1 text-center border rounded'
                />
              </div>
              <button
                onClick={detectIndentWithAI}
                disabled={aiDetecting}
                className='px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 transition-colors text-sm'
              >
                {aiDetecting ? 'Detecting...' : '🤖 AI Detect'}
              </button>
              <button
                onClick={removeIndentations}
                disabled={processing}
                className='px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors'
              >
                {processing ? 'Processing...' : 'Remove Indents & Continue'}
              </button>
            </div>
          </div>
        )}

        {currentStep === ProcessingStep.SPLIT_CAPTION && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>
              Step 4: Validate Caption Split
            </h3>
            <p className='text-sm text-gray-600'>
              Review the caption/testimony split. The marker will be removed
              when you continue.
            </p>
            <button
              onClick={confirmSplit}
              className='px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'
            >
              Confirm Split & Continue
            </button>
          </div>
        )}

        {currentStep === ProcessingStep.CONSOLIDATE_LINEBREAKS && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>
              Step 5: Consolidate Line Breaks
            </h3>
            <p className='text-sm text-gray-600'>
              Remove unnecessary line breaks while preserving Q&A structure.
            </p>
            <div className='flex flex-wrap gap-3 items-center'>
              <div className='flex items-center space-x-2'>
                <label htmlFor='lineBreakCount' className='text-sm font-medium'>
                  Space threshold:
                </label>
                <input
                  id='lineBreakCount'
                  type='number'
                  min='0'
                  max='20'
                  value={spaceThreshold}
                  onChange={(e) =>
                    setSpaceThreshold(parseInt(e.target.value) || 0)
                  }
                  className='w-16 px-2 py-1 text-center border rounded'
                />
              </div>
              <button
                onClick={detectLineBreakThresholdWithAI}
                disabled={aiDetecting}
                className='px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 transition-colors text-sm'
              >
                {aiDetecting ? 'Analyzing...' : '🤖 AI Analyze'}
              </button>
              <button
                onClick={consolidateLineBreaks}
                disabled={processing}
                className='px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors'
              >
                {processing ? 'Processing...' : 'Consolidate & Continue'}
              </button>
            </div>
          </div>
        )}

        {currentStep === ProcessingStep.PREVIEW_DOWNLOAD && (
          <div className='space-y-4'>
            <h3 className='text-lg font-semibold'>
              Step 6: Preview & Download
            </h3>
            <p className='text-sm text-gray-600'>
              Review the final output and download your formatted transcript.
            </p>
            <div className='flex flex-wrap gap-3 items-center'>
              <div className='flex space-x-4'>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    value='txt'
                    checked={downloadFormat === 'txt'}
                    onChange={(e) =>
                      setDownloadFormat(e.target.value as 'txt' | 'docx')
                    }
                    className='text-purple-600'
                  />
                  <span className='text-sm'>Text File (.txt)</span>
                </label>
                <label className='flex items-center space-x-2'>
                  <input
                    type='radio'
                    value='docx'
                    checked={downloadFormat === 'docx'}
                    onChange={(e) =>
                      setDownloadFormat(e.target.value as 'txt' | 'docx')
                    }
                    className='text-purple-600'
                  />
                  <span className='text-sm'>Word Document (.docx)</span>
                </label>
              </div>
              <button
                onClick={handleDownload}
                disabled={downloading}
                className='px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium'
              >
                {downloading
                  ? 'Generating...'
                  : `Download ${downloadFormat.toUpperCase()}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
