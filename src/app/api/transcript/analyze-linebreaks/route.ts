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

    const result = await TranscriptAIService.analyzeLineBreaks(content);

    return NextResponse.json({
      success: true,
      recommendedSpaceThreshold: result.recommendedSpaceThreshold,
      confidence: result.confidence,
      reasoning: result.reasoning,
      stats: result.stats,
      warnings: result.warnings
    });
  } catch (error) {
    console.error('Line break analysis error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to analyze line breaks',
        recommendedSpaceThreshold: 5
      },
      { status: 500 }
    );
  }
}
