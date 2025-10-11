import { NextRequest, NextResponse } from 'next/server';
import { DocxService } from '@/lib/docx-service';
import { TranscriptData } from '@/types/transcript';

export async function POST(request: NextRequest) {
  try {
    const { transcriptData, templateOptions } = (await request.json()) as {
      transcriptData: TranscriptData;
      templateOptions?: {
        companyName?: string;
        headerText?: string;
        footerText?: string;
      };
    };

    if (!transcriptData || !transcriptData.content) {
      return NextResponse.json(
        { success: false, message: 'Invalid transcript data' },
        { status: 400 }
      );
    }

    // Generate the DOCX document
    const docBlob = await DocxService.generateTranscriptDocument(
      transcriptData,
      templateOptions
    );

    // Convert blob to buffer for response
    const buffer = await docBlob.arrayBuffer();
    const fileName = DocxService.getFileName(transcriptData.fileName);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': buffer.byteLength.toString()
      }
    });
  } catch (error) {
    console.error('Document generation API error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate document' },
      { status: 500 }
    );
  }
}
