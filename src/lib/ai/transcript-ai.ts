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
    const markerIndentCounts = new Map<number, number>();
    let sampledLines = 0;
    let markerLines = 0;

    // Regex for standard transcript markers
    const markerRegex = /^\s*(Q\.|A\.|THE\s+(?:WITNESS|COURT|DEPOSITION)|MR\.|MS\.|DR\.)/i;

    // Sample lines and count indentation
    for (const line of lines) {
      if (line.trim() === '') continue;

      const match = line.match(/^( +)/);
      if (match) {
        const indent = match[1].length;
        if (indent > 0 && indent <= 25) {
          indentCounts.set(indent, (indentCounts.get(indent) || 0) + 1);
          sampledLines++;

          if (markerRegex.test(line)) {
            markerIndentCounts.set(indent, (markerIndentCounts.get(indent) || 0) + 1);
            markerLines++;
          }
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

    // Helper to find mode
    const getMode = (counts: Map<number, number>) => {
      let mode = 5;
      let max = 0;
      for (const [indent, count] of counts.entries()) {
        if (count > max) {
          max = count;
          mode = indent;
        }
      }
      return { mode, max };
    };

    // Decide which counts to use
    let finalIndent = 5;
    let confidence = 0;
    let reasoning = '';
    let statsMax = 0;

    if (markerLines > 0) {
      const { mode, max } = getMode(markerIndentCounts);
      finalIndent = mode;
      statsMax = max;
      const consistency = Math.round((max / markerLines) * 100);
      confidence = Math.min(0.5 + (consistency / 200), 0.95); // Base 0.5 + up to 0.5
      reasoning = `Detected ${markerLines} lines with Q/A or speaker markers. Most common indentation for markers is ${finalIndent} spaces.`;
    } else {
      const { mode, max } = getMode(indentCounts);
      finalIndent = mode;
      statsMax = max;
      const consistency = Math.round((max / sampledLines) * 100);
      confidence = Math.min(consistency / 100, 0.8);
      reasoning = `No clear markers found. Using most common global indentation of ${finalIndent} spaces.`;
    }

    return {
      recommendedIndent: finalIndent,
      confidence,
      reasoning,
      stats: {
        sampledLines,
        mostCommonIndent: finalIndent,
        consistencyPercentage: sampledLines > 0 ? Math.round((statsMax / (markerLines > 0 ? markerLines : sampledLines)) * 100) : 0
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
    
    // Get base indentation first to help with threshold calculation
    const indentResult = this.fallbackIndentationDetection(content);
    const baseIndent = indentResult.recommendedIndent;
    
    const continuationIndentCounts = new Map<number, number>();
    const markerRegex = /^\s*(Q\.|A\.|THE\s+(?:WITNESS|COURT|DEPOSITION)|MR\.|MS\.|DR\.)/i;

    // Analyze each line break
    for (let i = 1; i < lines.length; i++) {
      totalLineBreaks++;
      const line = lines[i];

      // Check if line matches a marker pattern
      if (markerRegex.test(line)) {
        preservedBreaks++;
      } else {
        // Count leading spaces for potential continuation lines
        const match = line.match(/^( +)/);
        if (match) {
          const indent = match[1].length;
          // Only count indents that are greater than base indent as potential continuations
          if (indent > baseIndent) {
             continuationIndentCounts.set(indent, (continuationIndentCounts.get(indent) || 0) + 1);
          }
        }
      }
    }

    // Determine threshold
    let recommendedThreshold = baseIndent + 2; // Default fallback

    // Find the most common continuation indent
    let continuationIndent = 0;
    let maxCount = 0;
    for (const [indent, count] of continuationIndentCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        continuationIndent = indent;
      }
    }

    if (continuationIndent > baseIndent) {
      // Ideally place threshold halfway between base and continuation
      recommendedThreshold = Math.floor((baseIndent + continuationIndent) / 2);
      // Ensure it's at least base + 1
      recommendedThreshold = Math.max(recommendedThreshold, baseIndent + 1);
    }

    const consolidatedBreaks = totalLineBreaks - preservedBreaks;
    const preservationRate =
      totalLineBreaks > 0
        ? Math.round((preservedBreaks / totalLineBreaks) * 100)
        : 0;

    const confidence = preservedBreaks > 10 ? 0.85 : 0.6;

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
      reasoning: `Detected base indent of ${baseIndent} and continuation indent of ${continuationIndent || 'unknown'}. Recommended threshold: ${recommendedThreshold}.`,
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
