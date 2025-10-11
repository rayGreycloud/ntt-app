import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  HeadingLevel
} from 'docx';
import { TranscriptData } from '@/types/transcript';

export class DocxService {
  static async generateTranscriptDocument(
    transcriptData: TranscriptData,
    templateOptions?: {
      companyName?: string;
      headerText?: string;
      footerText?: string;
    }
  ): Promise<Blob> {
    const {
      companyName = 'Naegeli Deposition & Trial',
      headerText = 'TRANSCRIPT',
      footerText = `Generated on ${new Date().toLocaleDateString()}`
    } = templateOptions || {};

    // Split content into lines for processing
    const lines = transcriptData.content.split('\n');

    // Create document sections
    const headerSection = this.createHeaderSection(headerText, companyName);
    const contentSection = this.createContentSection(lines);
    const footerSection = this.createFooterSection(footerText);

    // Create the document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [...headerSection, ...contentSection, ...footerSection]
        }
      ]
    });

    // Generate and return the document as a blob
    const buffer = await Packer.toBuffer(doc);
    return new Blob([new Uint8Array(buffer)], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  }

  private static createHeaderSection(
    headerText: string,
    companyName: string
  ): Paragraph[] {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: headerText,
            bold: true,
            size: 32
          })
        ],
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: companyName,
            size: 24
          })
        ],
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        children: [new TextRun({ text: '' })] // Empty line
      })
    ];
  }

  private static createContentSection(lines: string[]): Paragraph[] {
    const paragraphs: Paragraph[] = [];

    for (const line of lines) {
      // Skip empty lines at the beginning
      if (!line.trim() && paragraphs.length === 0) {
        continue;
      }

      // Handle different types of content
      if (line.trim().startsWith('Q.') || line.trim().startsWith('A.')) {
        // Question or Answer - format specially
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.trim(),
                font: 'Times New Roman',
                size: 24
              })
            ],
            spacing: {
              before: 120,
              after: 120
            }
          })
        );
      } else if (
        line.trim().match(/^(MR\.|MS\.|THE\s+WITNESS:|THE\s+COURT:)/i)
      ) {
        // Attorney or witness statements
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.trim(),
                font: 'Times New Roman',
                size: 24,
                italics: true
              })
            ],
            spacing: {
              before: 120,
              after: 120
            }
          })
        );
      } else {
        // Regular text
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: line.trim() || ' ', // Ensure empty lines are preserved
                font: 'Times New Roman',
                size: 24
              })
            ],
            spacing: {
              after: line.trim() ? 0 : 120
            }
          })
        );
      }
    }

    return paragraphs;
  }

  private static createFooterSection(footerText: string): Paragraph[] {
    return [
      new Paragraph({
        children: [
          new TextRun({
            text: footerText,
            size: 18,
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER
      })
    ];
  }

  static getFileName(originalFileName: string): string {
    const timestamp = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const baseName = originalFileName.replace(/\.[^/.]+$/, ''); // Remove extension
    return `${baseName}_formatted_${timestamp}.docx`;
  }
}
