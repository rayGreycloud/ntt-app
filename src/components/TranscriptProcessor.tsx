'use client';

import { useState, useRef, useEffect } from 'react';
import { TranscriptData, ProcessingOptions } from '@/types/transcript';

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
  const [content, setContent] = useState(transcriptData.content);
  const [options, setOptions] = useState<ProcessingOptions>({
    indentationSpaceCount: 5,
    lineBreakSpaceCount: 5
  });
  const [captionMarked, setCaptionMarked] = useState(false);
  const [showMarkerBtn, setShowMarkerBtn] = useState(false);
  const [aiDetecting, setAiDetecting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [originalContent] = useState(transcriptData.content);

  // Determine base indent of transcript
  const detectBaseIndent = (text: string): number => {
    // Split text into lines and remove empty ones
    const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');

    // Count leading spaces for each line
    const indents = lines.map((line) => {
      const match = line.match(/^ +/);
      return match ? match[0].length : 0;
    });

    // Find minimum indent across all lines (excluding lines with no indent)
    const nonZeroIndents = indents.filter((indent) => indent > 0);
    if (nonZeroIndents.length > 0) {
      return Math.min(...nonZeroIndents);
    }

    return 5; // Default fallback
  };

  // Auto-detect base indent when transcript loads
  useEffect(() => {
    if (transcriptData.content) {
      const baseIndent = detectBaseIndent(transcriptData.content);
      setOptions((prev) => ({
        ...prev,
        indentationSpaceCount: baseIndent
      }));
    }
  }, [transcriptData.content]);

  const insertCaptionMark = () => {
    if (captionMarked || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;

    const marked =
      content.slice(0, cursorPos) + '🚩\n ' + content.slice(cursorPos);

    setContent(marked);
    setCaptionMarked(true);
    setShowMarkerBtn(true);
  };

  const clearCaptionMark = () => {
    setContent(originalContent);
    setCaptionMarked(false);
    setShowMarkerBtn(false);
  };

  const detectCaptionWithAI = async () => {
    if (!transcriptData) return;

    setAiDetecting(true);
    try {
      const response = await fetch('/api/transcript/detect-caption', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: originalContent })
      });

      const data = await response.json();

      if (data.success && data.boundary > 0) {
        const marked =
          originalContent.slice(0, data.boundary) +
          '🚩\n ' +
          originalContent.slice(data.boundary);

        setContent(marked);
        setCaptionMarked(true);
        setShowMarkerBtn(true);
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

  const splitTextOnMarker = (text: string) => {
    const markerIdx = text.indexOf('🚩');
    const caption = text.slice(0, markerIdx);
    const body = text.slice(markerIdx + 2);
    return { caption, body };
  };

  const removeIndentations = (text: string) => {
    const regex = new RegExp(`\\n\\s{${options.indentationSpaceCount}}`, 'g');
    return text.replace(regex, '\n');
  };

  const removeExtraLineBreaks = (text: string) => {
    const regex = new RegExp(
      `\\n(?!Q\\.|Q|A\\.|A|\\s{${options.lineBreakSpaceCount},})`,
      'g'
    );
    return text.replace(regex, ' ');
  };

  const handleIndentationRemoval = () => {
    if (!transcriptData) {
      alert('Please select a file first');
      return;
    }

    const processed = removeIndentations(content);
    setContent(processed);
  };

  const handleLineBreakRemoval = () => {
    if (!transcriptData) {
      alert('Please select a file first');
      return;
    }

    if (!captionMarked) {
      alert('Please mark the end of the caption by clicking in the textarea');
      return;
    }

    const splitText = splitTextOnMarker(content);
    const cleanedBody = removeExtraLineBreaks(splitText.body);
    const formatted = splitText.caption + '\n' + cleanedBody;

    setContent(formatted);
    setCaptionMarked(false);
    setShowMarkerBtn(false);
  };

  const [downloadFormat, setDownloadFormat] = useState<'txt' | 'docx'>('docx');
  const [downloading, setDownloading] = useState(false);

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
    if (!transcriptData) {
      alert('Please select a file first');
      return;
    }

    if (downloadFormat === 'txt') {
      downloadTxtFile();
    } else {
      downloadDocxFile();
    }

    // Update the processed data
    onProcessed({
      ...transcriptData,
      content: content
    });
  };

  const handleClear = () => {
    setContent('');
    setCaptionMarked(false);
    setShowMarkerBtn(false);
    onClear();
  };

  return (
    <div className='space-y-6'>
      {/* Controls */}
      <div className='space-y-4'>
        {/* AI Caption Detection */}
        <div className='text-center'>
          <button
            onClick={detectCaptionWithAI}
            disabled={captionMarked || aiDetecting}
            className='px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors'
          >
            {aiDetecting
              ? 'Detecting Caption...'
              : '🤖 Auto-Detect Caption Boundary'}
          </button>
          <p className='text-sm text-gray-500 mt-2'>
            Or click in the text area below to manually mark the boundary
          </p>
        </div>

        <div className='flex flex-wrap gap-4 items-center justify-center'>
          <div className='flex items-center space-x-2'>
            <label htmlFor='indentCount' className='text-sm font-medium'>
              Indentation Spaces:
            </label>
            <input
              id='indentCount'
              type='number'
              min='0'
              max='20'
              value={options.indentationSpaceCount}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  indentationSpaceCount: parseInt(e.target.value) || 0
                }))
              }
              className='w-16 px-2 py-1 text-center border rounded'
            />
          </div>

          <button
            onClick={handleIndentationRemoval}
            className='px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors'
          >
            Remove Indents
          </button>

          <div className='flex items-center space-x-2'>
            <label htmlFor='lineBreakCount' className='text-sm font-medium'>
              Line Break Spaces:
            </label>
            <input
              id='lineBreakCount'
              type='number'
              min='0'
              max='20'
              value={options.lineBreakSpaceCount}
              onChange={(e) =>
                setOptions((prev) => ({
                  ...prev,
                  lineBreakSpaceCount: parseInt(e.target.value) || 0
                }))
              }
              className='w-16 px-2 py-1 text-center border rounded'
            />
          </div>

          <button
            onClick={handleLineBreakRemoval}
            className='px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'
          >
            Remove Line Breaks
          </button>
        </div>

        {/* Text Area */}
        <div className='relative'>
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onClick={insertCaptionMark}
            onMouseEnter={() => {
              if (textareaRef.current && !captionMarked) {
                textareaRef.current.style.cursor = 'pointer';
              }
            }}
            onMouseLeave={() => {
              if (textareaRef.current) {
                textareaRef.current.style.cursor = 'default';
              }
            }}
            className='w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            placeholder={
              captionMarked
                ? 'Content with caption marker...'
                : 'Click in the text to mark end of caption...'
            }
          />

          {!captionMarked && transcriptData && (
            <div className='absolute top-2 left-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs'>
              Click to mark caption boundary
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className='space-y-4'>
          {/* Download Format Selection */}
          <div className='flex justify-center space-x-4'>
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
              <span>Text File (.txt)</span>
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
              <span>Word Document (.docx)</span>
            </label>
          </div>

          <div className='flex justify-center space-x-4'>
            {showMarkerBtn && (
              <button
                onClick={clearCaptionMark}
                className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
              >
                Remove 🚩 Marker
              </button>
            )}

            <button
              onClick={handleDownload}
              disabled={downloading}
              className='px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium'
            >
              {downloading
                ? 'Generating...'
                : `Process & Download ${downloadFormat.toUpperCase()}`}
            </button>

            <button
              onClick={handleClear}
              className='px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors'
            >
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
