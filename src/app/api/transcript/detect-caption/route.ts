import { NextRequest, NextResponse } from 'next/server';
import { TranscriptAIService } from '@/lib/ai/transcript-ai';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Invalid transcript content' },
        { status: 400 }
      );
    }

    const result = await TranscriptAIService.detectCaptionBoundary(content);

    return NextResponse.json({
      success: true,
      boundary: result.boundary,
      confidence: result.confidence
    });
  } catch (error) {
    console.error('Caption detection API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to detect caption boundary' },
      { status: 500 }
    );
  }
}
