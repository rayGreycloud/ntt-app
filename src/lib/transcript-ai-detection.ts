/**
 * AI detection services for transcript processing
 * Handles API calls to AI-powered detection endpoints
 */

export interface CaptionDetectionResult {
  success: boolean;
  boundary?: number;
  message?: string;
}

export interface IndentDetectionResult {
  success: boolean;
  recommendedIndent?: number;
  message?: string;
}

export interface LineBreakAnalysisResult {
  success: boolean;
  recommendedSpaceThreshold?: number;
  message?: string;
}

/**
 * Detect caption boundary using AI
 */
export async function detectCaptionBoundary(
  content: string
): Promise<CaptionDetectionResult> {
  try {
    const response = await fetch('/api/transcript/detect-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    const data = await response.json();

    if (data.success && data.boundary > 0) {
      return {
        success: true,
        boundary: data.boundary
      };
    } else {
      return {
        success: false,
        message: 'Could not automatically detect caption boundary.'
      };
    }
  } catch (error) {
    console.error('AI caption detection error:', error);
    return {
      success: false,
      message: 'AI detection failed. Please try again.'
    };
  }
}

/**
 * Detect indentation level using AI
 */
export async function detectIndentation(
  content: string
): Promise<IndentDetectionResult> {
  try {
    const response = await fetch('/api/transcript/detect-indent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    const data = await response.json();

    if (data.success && data.recommendedIndent) {
      return {
        success: true,
        recommendedIndent: data.recommendedIndent
      };
    } else {
      return {
        success: false,
        message: 'Could not detect indentation.'
      };
    }
  } catch (error) {
    console.error('AI indent detection error:', error);
    return {
      success: false,
      message: 'AI detection failed. Please try again.'
    };
  }
}

/**
 * Analyze line breaks and determine threshold using AI
 */
export async function analyzeLineBreaks(
  content: string
): Promise<LineBreakAnalysisResult> {
  try {
    const response = await fetch('/api/transcript/analyze-linebreaks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content })
    });

    const data = await response.json();

    if (data.success && data.recommendedSpaceThreshold) {
      return {
        success: true,
        recommendedSpaceThreshold: data.recommendedSpaceThreshold
      };
    } else {
      return {
        success: false,
        message: 'Could not analyze line breaks.'
      };
    }
  } catch (error) {
    console.error('AI linebreak analysis error:', error);
    return {
      success: false,
      message: 'AI analysis failed. Please try again.'
    };
  }
}
