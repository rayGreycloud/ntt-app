export interface TranscriptData {
  content: string;
  fileName: string;
  captionBoundary?: number;
}

export interface ProcessingOptions {
  indentationSpaceCount: number;
  lineBreakSpaceCount: number;
}
