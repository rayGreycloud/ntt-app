export interface TranscriptData {
  content: string;
  fileName: string;
  captionBoundary?: number;
}

export interface ProcessingOptions {
  indentationSpaceCount: number;
  lineBreakSpaceCount: number;
}

export enum ProcessingStep {
  UPLOAD = 0,
  CLEAN_ARTIFACTS = 1,
  DETECT_CAPTION = 2,
  REMOVE_INDENTATION = 3,
  SPLIT_CAPTION = 4,
  CONSOLIDATE_LINEBREAKS = 5,
  PREVIEW_DOWNLOAD = 6
}

export interface StepState {
  currentStep: ProcessingStep;
  completedSteps: Set<ProcessingStep>;
  stepData: {
    [ProcessingStep.UPLOAD]: {
      originalContent: string;
      fileName: string;
    } | null;
    [ProcessingStep.CLEAN_ARTIFACTS]: {
      cleanedContent: string;
    } | null;
    [ProcessingStep.DETECT_CAPTION]: {
      captionBoundary: number;
      confidence?: number;
    } | null;
    [ProcessingStep.REMOVE_INDENTATION]: {
      indentSpaces: number;
      processedContent: string;
    } | null;
    [ProcessingStep.SPLIT_CAPTION]: {
      captionContent: string;
      bodyContent: string;
      markerPosition: number;
    } | null;
    [ProcessingStep.CONSOLIDATE_LINEBREAKS]: {
      spaceThreshold: number;
      finalContent: string;
    } | null;
    [ProcessingStep.PREVIEW_DOWNLOAD]: {
      downloadFormat: 'txt' | 'docx';
    } | null;
  };
}

export interface AIAnalysisResult {
  success: boolean;
  data?: Record<string, unknown>;
  confidence?: number;
  reasoning?: string;
  error?: string;
}
