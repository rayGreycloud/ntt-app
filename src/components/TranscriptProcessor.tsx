'use client';

import { useState, useRef, useEffect } from 'react';
import { TranscriptData, ProcessingStep } from '@/types/transcript';
import {
  detectBaseIndent,
  cleanArtifacts,
  removeIndentation,
  consolidateLineBreaks as processLineBreaks,
  insertCaptionMarker,
  removeCaptionMarker
} from '@/lib/transcript-processing';
import {
  detectCaptionBoundary,
  detectIndentation,
  analyzeLineBreaks
} from '@/lib/transcript-ai-detection';
import { downloadAsText, downloadAsDocx } from '@/lib/transcript-download';
import CleanArtifactsStep from './steps/CleanArtifactsStep';
import DetectCaptionStep from './steps/DetectCaptionStep';
import RemoveIndentationStep from './steps/RemoveIndentationStep';
import SplitCaptionStep from './steps/SplitCaptionStep';
import ConsolidateLineBreaksStep from './steps/ConsolidateLineBreaksStep';
import PreviewDownloadStep from './steps/PreviewDownloadStep';

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

  // Step 1: Clean page/line artifacts
  const handleCleanArtifacts = () => {
    setProcessing(true);
    try {
      const cleaned = cleanArtifacts(content);
      setCleanedContent(cleaned);
      setContent(cleaned);
      setCurrentStep(ProcessingStep.DETECT_CAPTION);
    } finally {
      setProcessing(false);
    }
  };

  // Step 2: Detect caption boundary (manual or AI)
  const handleInsertCaptionMark = () => {
    if (!textareaRef.current || captionBoundary !== null) return;

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;

    const marked = insertCaptionMarker(content, cursorPos);
    setContent(marked);
    setCaptionBoundary(cursorPos);
  };

  const handleDetectCaptionWithAI = async () => {
    setAiDetecting(true);
    try {
      const result = await detectCaptionBoundary(cleanedContent || content);

      if (result.success && result.boundary) {
        const baseContent = cleanedContent || content;
        const marked = insertCaptionMarker(baseContent, result.boundary);
        setContent(marked);
        setCaptionBoundary(result.boundary);
      } else {
        alert(
          result.message ||
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

  const handleClearCaptionMark = () => {
    setContent(cleanedContent || originalContent);
    setCaptionBoundary(null);
  };

  const handleConfirmCaptionBoundary = () => {
    if (captionBoundary === null) {
      alert('Please mark the caption boundary first');
      return;
    }
    setCurrentStep(ProcessingStep.REMOVE_INDENTATION);
  };

  // Step 3: Remove indentation
  const handleRemoveIndentations = () => {
    setProcessing(true);
    try {
      const processed = removeIndentation(content, indentSpaces);
      setContent(processed);
      setCurrentStep(ProcessingStep.SPLIT_CAPTION);
    } finally {
      setProcessing(false);
    }
  };

  const handleDetectIndentWithAI = async () => {
    setAiDetecting(true);
    try {
      const result = await detectIndentation(content);

      if (result.success && result.recommendedIndent) {
        setIndentSpaces(result.recommendedIndent);
      } else {
        alert(
          result.message || 'Could not detect indentation. Using default value.'
        );
      }
    } catch (error) {
      console.error('AI indent detection error:', error);
    } finally {
      setAiDetecting(false);
    }
  };

  // Step 4: Split caption (validation step)
  const handleConfirmSplit = () => {
    // Remove the marker and proceed
    const cleanedText = removeCaptionMarker(content);
    setContent(cleanedText);
    setCurrentStep(ProcessingStep.CONSOLIDATE_LINEBREAKS);
  };

  // Step 5: Consolidate line breaks
  const handleConsolidateLineBreaks = () => {
    setProcessing(true);
    try {
      const finalContent = processLineBreaks(content, spaceThreshold);
      setContent(finalContent);
      setCurrentStep(ProcessingStep.PREVIEW_DOWNLOAD);
    } finally {
      setProcessing(false);
    }
  };

  const handleDetectLineBreakThresholdWithAI = async () => {
    setAiDetecting(true);
    try {
      const result = await analyzeLineBreaks(content);

      if (result.success && result.recommendedSpaceThreshold) {
        setSpaceThreshold(result.recommendedSpaceThreshold);
      } else {
        alert(
          result.message ||
            'Could not analyze line breaks. Using default value.'
        );
      }
    } catch (error) {
      console.error('AI linebreak analysis error:', error);
    } finally {
      setAiDetecting(false);
    }
  };

  // Download functions
  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (downloadFormat === 'txt') {
        downloadAsText(content, transcriptData.fileName);
      } else {
        await downloadAsDocx(transcriptData, content);
      }
      onProcessed({
        ...transcriptData,
        content: content
      });
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to generate document. Please try again.');
    } finally {
      setDownloading(false);
    }
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
              ? handleInsertCaptionMark
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
          <CleanArtifactsStep
            onClean={handleCleanArtifacts}
            processing={processing}
          />
        )}

        {currentStep === ProcessingStep.DETECT_CAPTION && (
          <DetectCaptionStep
            captionBoundary={captionBoundary}
            onAIDetect={handleDetectCaptionWithAI}
            onClearMarker={handleClearCaptionMark}
            onConfirm={handleConfirmCaptionBoundary}
            aiDetecting={aiDetecting}
          />
        )}

        {currentStep === ProcessingStep.REMOVE_INDENTATION && (
          <RemoveIndentationStep
            indentSpaces={indentSpaces}
            onIndentChange={setIndentSpaces}
            onAIDetect={handleDetectIndentWithAI}
            onRemoveIndents={handleRemoveIndentations}
            aiDetecting={aiDetecting}
            processing={processing}
          />
        )}

        {currentStep === ProcessingStep.SPLIT_CAPTION && (
          <SplitCaptionStep onConfirm={handleConfirmSplit} />
        )}

        {currentStep === ProcessingStep.CONSOLIDATE_LINEBREAKS && (
          <ConsolidateLineBreaksStep
            spaceThreshold={spaceThreshold}
            onThresholdChange={setSpaceThreshold}
            onAIAnalyze={handleDetectLineBreakThresholdWithAI}
            onConsolidate={handleConsolidateLineBreaks}
            aiDetecting={aiDetecting}
            processing={processing}
          />
        )}

        {currentStep === ProcessingStep.PREVIEW_DOWNLOAD && (
          <PreviewDownloadStep
            downloadFormat={downloadFormat}
            onFormatChange={setDownloadFormat}
            onDownload={handleDownload}
            downloading={downloading}
          />
        )}
      </div>
    </div>
  );
}
