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

    const result = await TranscriptAIService.validateCaptionSplit(content);

    return NextResponse.json({
      success: true,
      valid: result.valid,
      recommendation: result.recommendation,
      suggestedAdjustment: result.suggestedAdjustment,
      confidence: result.confidence,
      reasoning: result.reasoning,
      beforeContext: result.beforeContext,
      afterContext: result.afterContext
    });
  } catch (error) {
    console.error('Caption split validation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to validate caption split'
      },
      { status: 500 }
    );
  }
}
