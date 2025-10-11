export class TranscriptAIService {
  static async detectCaptionBoundary(
    transcriptContent: string
  ): Promise<{ boundary: number; confidence: number }> {
    // For now, use the fallback method until AI integration is properly configured
    // TODO: Implement AI-powered detection once OpenAI integration is set up
    console.log('Using fallback caption detection method');
    return this.fallbackCaptionDetection(transcriptContent);
  }

  private static fallbackCaptionDetection(content: string): {
    boundary: number;
    confidence: number;
  } {
    // Look for common patterns that indicate start of testimony
    const patterns = [
      /\n\s*Q\.\s/i, // Question marker
      /\n\s*A\.\s/i, // Answer marker
      /\n\s*THE\s+WITNESS:/i, // Witness statement
      /\n\s*MR\.\s+\w+:/i, // Attorney statement
      /\n\s*MS\.\s+\w+:/i // Attorney statement
    ];

    let earliestMatch = content.length;
    let foundPattern = false;

    for (const pattern of patterns) {
      const match = content.search(pattern);
      if (match !== -1 && match < earliestMatch) {
        earliestMatch = match;
        foundPattern = true;
      }
    }

    if (foundPattern) {
      return {
        boundary: earliestMatch,
        confidence: 0.7
      };
    }

    // If no patterns found, estimate based on typical caption length
    const estimatedBoundary = Math.min(content.length * 0.2, 1500);
    return {
      boundary: Math.floor(estimatedBoundary),
      confidence: 0.3
    };
  }

  static async detectIndentation(transcriptContent: string): Promise<{
    recommendedIndent: number;
    confidence: number;
    reasoning: string;
    stats: {
      sampledLines: number;
      mostCommonIndent: number;
      consistencyPercentage: number;
    };
  }> {
    // Fallback method for indentation detection
    console.log('Using fallback indentation detection method');
    return this.fallbackIndentationDetection(transcriptContent);
  }

  private static fallbackIndentationDetection(content: string): {
    recommendedIndent: number;
    confidence: number;
    reasoning: string;
    stats: {
      sampledLines: number;
      mostCommonIndent: number;
      consistencyPercentage: number;
    };
  } {
    const lines = content.split(/\r?\n/);
    const indentCounts = new Map<number, number>();
    let sampledLines = 0;

    // Sample lines and count indentation
    for (const line of lines) {
      if (line.trim() === '') continue;

      const match = line.match(/^( +)/);
      if (match) {
        const indent = match[1].length;
        if (indent > 0 && indent <= 20) {
          indentCounts.set(indent, (indentCounts.get(indent) || 0) + 1);
          sampledLines++;
        }
      }
    }

    if (sampledLines === 0) {
      return {
        recommendedIndent: 5,
        confidence: 0.2,
        reasoning: 'No indented lines found. Using default value of 5 spaces.',
        stats: {
          sampledLines: 0,
          mostCommonIndent: 5,
          consistencyPercentage: 0
        }
      };
    }

    // Find most common indentation
    let mostCommonIndent = 5;
    let maxCount = 0;

    for (const [indent, count] of indentCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonIndent = indent;
      }
    }

    const consistencyPercentage = Math.round((maxCount / sampledLines) * 100);
    const confidence = Math.min(consistencyPercentage / 100, 0.95);

    return {
      recommendedIndent: mostCommonIndent,
      confidence,
      reasoning: `Found ${mostCommonIndent} spaces as the most common indentation (${consistencyPercentage}% of lines).`,
      stats: {
        sampledLines,
        mostCommonIndent,
        consistencyPercentage
      }
    };
  }

  static async analyzeLineBreaks(transcriptContent: string): Promise<{
    recommendedSpaceThreshold: number;
    confidence: number;
    reasoning: string;
    stats: {
      totalLineBreaks: number;
      preservedBreaks: number;
      consolidatedBreaks: number;
      preservationRate: number;
    };
    warnings: string[];
  }> {
    // Fallback method for line break analysis
    console.log('Using fallback line break analysis method');
    return this.fallbackLineBreakAnalysis(transcriptContent);
  }

  private static fallbackLineBreakAnalysis(content: string): {
    recommendedSpaceThreshold: number;
    confidence: number;
    reasoning: string;
    stats: {
      totalLineBreaks: number;
      preservedBreaks: number;
      consolidatedBreaks: number;
      preservationRate: number;
    };
    warnings: string[];
  } {
    const lines = content.split(/\r?\n/);
    let totalLineBreaks = 0;
    let preservedBreaks = 0;
    const indentCounts = new Map<number, number>();

    // Analyze each line break
    for (let i = 1; i < lines.length; i++) {
      totalLineBreaks++;
      const line = lines[i];

      // Check if line should be preserved (has Q/A marker or speaker label)
      if (
        /^\s*(Q\.|Q |A\.|A |THE\s+\w+:|MR\.|MS\.|WHEREUPON|EXHIBIT)/.test(line)
      ) {
        preservedBreaks++;
      } else {
        // Count leading spaces for continuation lines
        const match = line.match(/^( +)/);
        if (match) {
          const indent = match[1].length;
          indentCounts.set(indent, (indentCounts.get(indent) || 0) + 1);
        }
      }
    }

    // Determine threshold based on indent distribution
    let recommendedThreshold = 5;

    // Find the median indentation for continuation lines
    const sortedIndents = Array.from(indentCounts.keys()).sort((a, b) => a - b);
    if (sortedIndents.length > 0) {
      const midpoint = Math.floor(sortedIndents.length / 2);
      recommendedThreshold = sortedIndents[midpoint];
    }

    const consolidatedBreaks = totalLineBreaks - preservedBreaks;
    const preservationRate =
      totalLineBreaks > 0
        ? Math.round((preservedBreaks / totalLineBreaks) * 100)
        : 0;

    const confidence = preservedBreaks > 10 ? 0.75 : 0.5;

    const warnings: string[] = [];
    if (preservedBreaks < 10) {
      warnings.push(
        'Low number of Q/A markers detected. Manual review recommended.'
      );
    }
    if (preservationRate < 20) {
      warnings.push(
        'Most line breaks will be consolidated. Verify this is intended.'
      );
    }

    return {
      recommendedSpaceThreshold: recommendedThreshold,
      confidence,
      reasoning: `Analyzed ${totalLineBreaks} line breaks. ${preservedBreaks} have Q/A markers. Threshold of ${recommendedThreshold} spaces preserves structure while consolidating continuations.`,
      stats: {
        totalLineBreaks,
        preservedBreaks,
        consolidatedBreaks,
        preservationRate
      },
      warnings
    };
  }

  static async validateCaptionSplit(contentWithMarker: string): Promise<{
    valid: boolean;
    recommendation: 'CORRECT' | 'MOVE_EARLIER' | 'MOVE_LATER' | 'FINE_TUNE';
    suggestedAdjustment: number;
    confidence: number;
    reasoning: string;
    beforeContext: string;
    afterContext: string;
  }> {
    // Fallback method for split validation
    console.log('Using fallback split validation method');
    return this.fallbackSplitValidation(contentWithMarker);
  }

  private static fallbackSplitValidation(content: string): {
    valid: boolean;
    recommendation: 'CORRECT' | 'MOVE_EARLIER' | 'MOVE_LATER' | 'FINE_TUNE';
    suggestedAdjustment: number;
    confidence: number;
    reasoning: string;
    beforeContext: string;
    afterContext: string;
  } {
    const markerIdx = content.indexOf('🚩');

    if (markerIdx === -1) {
      return {
        valid: false,
        recommendation: 'CORRECT',
        suggestedAdjustment: 0,
        confidence: 0,
        reasoning: 'No marker found in content.',
        beforeContext: '',
        afterContext: ''
      };
    }

    const beforeContext = content.slice(
      Math.max(0, markerIdx - 100),
      markerIdx
    );
    const afterContext = content.slice(
      markerIdx + 2,
      Math.min(content.length, markerIdx + 102)
    );

    // Check if marker is at a reasonable position
    const testimonyPatterns = [
      /THE\s+REPORTER:/i,
      /THE\s+BAILIFF:/i,
      /VIDEOGRAPHER:/i,
      /Q\.\s/,
      /A\.\s/
    ];

    let foundTestimony = false;
    for (const pattern of testimonyPatterns) {
      if (pattern.test(afterContext)) {
        foundTestimony = true;
        break;
      }
    }

    if (foundTestimony) {
      return {
        valid: true,
        recommendation: 'CORRECT',
        suggestedAdjustment: 0,
        confidence: 0.85,
        reasoning:
          'Marker appears correctly positioned before testimony content.',
        beforeContext: beforeContext.slice(-50),
        afterContext: afterContext.slice(0, 50)
      };
    }

    return {
      valid: true,
      recommendation: 'FINE_TUNE',
      suggestedAdjustment: 0,
      confidence: 0.6,
      reasoning:
        'Marker position is acceptable but could not verify with high confidence.',
      beforeContext: beforeContext.slice(-50),
      afterContext: afterContext.slice(0, 50)
    };
  }
}
