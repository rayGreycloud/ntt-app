import { NextRequest, NextResponse } from 'next/server';
import { TranscriptAIService } from '@/lib/ai/transcript-ai';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid content provided' },
        { status: 400 }
      );
    }

    const result = await TranscriptAIService.detectIndentation(content);

    return NextResponse.json({
      success: true,
      recommendedIndent: result.recommendedIndent,
      confidence: result.confidence,
      reasoning: result.reasoning,
      stats: result.stats
    });
  } catch (error) {
    console.error('Indent detection error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to detect indentation',
        recommendedIndent: 5
      },
      { status: 500 }
    );
  }
}
