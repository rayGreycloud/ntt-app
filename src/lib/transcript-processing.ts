/**
 * Transcript processing utilities
 * Core functions for cleaning and transforming transcript content
 */

/**
 * Detect the base indentation level in the transcript
 */
export function detectBaseIndent(text: string): number {
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
}

/**
 * Clean page and line number artifacts from transcript content
 */
export function cleanArtifacts(content: string): string {
  // Normalize line endings
  let cleaned = content.replace(/\r\n/g, '\n');

  // Remove page and line number artifacts (pattern: newline + optional spaces + digits + up to 3 spaces)
  cleaned = cleaned.replace(/\n\s*\d+\s{0,3}/g, '\n');

  return cleaned;
}

/**
 * Remove specified number of leading spaces from each line
 */
export function removeIndentation(
  content: string,
  indentSpaces: number
): string {
  const regex = new RegExp(`\\n {${indentSpaces}}`, 'g');
  return content.replace(regex, '\n');
}

/**
 * Consolidate line breaks while preserving Q&A structure
 */
export function consolidateLineBreaks(
  content: string,
  spaceThreshold: number
): string {
  const markerIdx = content.indexOf('🚩');
  let caption = '';
  let body = content;

  if (markerIdx >= 0) {
    caption = content.slice(0, markerIdx);
    body = content.slice(markerIdx + 2);
  }

  const regex = new RegExp(`\\n(?!Q\\.|Q|A\\.|A| {${spaceThreshold},})`, 'g');
  const cleanedBody = body.replace(regex, ' ');

  return markerIdx >= 0 ? caption + '\n' + cleanedBody : cleanedBody;
}

/**
 * Insert caption marker at a specific position
 */
export function insertCaptionMarker(content: string, position: number): string {
  return content.slice(0, position) + '🚩\n' + content.slice(position);
}

/**
 * Remove caption marker from content
 */
export function removeCaptionMarker(content: string): string {
  return content.replace('🚩\n', '');
}
