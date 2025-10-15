/**
 * Download services for transcript files
 * Handles text and DOCX file generation and download
 */

import { TranscriptData } from '@/types/transcript';

export interface DocxTemplateOptions {
  companyName?: string;
  headerText?: string;
  footerText?: string;
}

/**
 * Download content as a text file
 */
export function downloadAsText(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/plain' });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileName}_formatted.txt`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(url);
}

/**
 * Download content as a DOCX file
 */
export async function downloadAsDocx(
  transcriptData: TranscriptData,
  content: string,
  templateOptions?: DocxTemplateOptions
): Promise<void> {
  const response = await fetch('/api/transcript/generate-docx', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      transcriptData: {
        ...transcriptData,
        content: content
      },
      templateOptions: {
        companyName:
          templateOptions?.companyName || process.env.NEXT_PUBLIC_COMPANY_NAME,
        headerText: templateOptions?.headerText || 'FORMATTED TRANSCRIPT',
        footerText:
          templateOptions?.footerText ||
          `Generated on ${new Date().toLocaleDateString()}`
      }
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate document');
  }

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
}
