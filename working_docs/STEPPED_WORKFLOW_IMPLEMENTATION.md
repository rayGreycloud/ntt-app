# Stepped Workflow Implementation - Summary

## Overview

The transcript processing workflow has been refactored to support a **stepped, navigable process** with AI-assisted automation for operations #6-9. The text area now remains in a consistent position throughout all steps, preventing UI jumping.

## Key Changes

### 1. New AI Prompt Files (lib/ai/)

Created three new prompt files to guide AI-assisted operations:

- **`ai-indent-removal-prompt.md`**: Analyzes transcript indentation patterns and recommends optimal space count for removal
- **`ai-caption-split-prompt.md`**: Validates caption/testimony boundary placement and suggests adjustments
- **`ai-linebreak-consolidation-prompt.md`**: Analyzes line break patterns and recommends space threshold for consolidation

These prompts are ready for integration with OpenAI or other LLM services in the future.

### 2. Enhanced Type Definitions (types/transcript.ts)

Added new types to support the stepped workflow:

```typescript
export enum ProcessingStep {
  UPLOAD = 0,
  CLEAN_ARTIFACTS = 1,
  DETECT_CAPTION = 2,
  REMOVE_INDENTATION = 3,
  SPLIT_CAPTION = 4,
  CONSOLIDATE_LINEBREAKS = 5,
  PREVIEW_DOWNLOAD = 6
}
```

- **`ProcessingStep`**: Enum defining each step in the workflow
- **`StepState`**: Interface for managing step progression and step-specific data
- **`AIAnalysisResult`**: Generic interface for AI operation results

### 3. Refactored TranscriptProcessor Component

The component now features a **stepped workflow** with:

#### Step Navigation

- Visual step indicator showing current step and completed steps
- Ability to navigate back to previous steps
- Each step shows only relevant controls and inputs

#### Consistent UI Layout

- **Text area always visible** in the same position across all steps
- Controls displayed in a fixed-height container below the text area
- No UI jumping between steps

#### Step-by-Step Process

**Step 1: Clean Artifacts**

- Removes page numbers and line artifacts
- Normalizes line endings
- Auto-advances to next step

**Step 2: Detect Caption**

- AI-assisted or manual caption boundary marking
- Shows visual indicator when marked
- Can clear and re-mark

**Step 3: Remove Indentation**

- AI detection of optimal indent spaces (with fallback)
- Manual adjustment option
- Preview in real-time

**Step 4: Validate Split**

- Review caption/testimony separation
- Marker removed upon confirmation
- (Future: AI validation feedback)

**Step 5: Consolidate Line Breaks**

- AI analysis of optimal space threshold (with fallback)
- Manual adjustment option
- Preserves Q/A structure

**Step 6: Preview & Download**

- Final review
- Format selection (TXT or DOCX)
- Download processed transcript

### 4. Enhanced AI Service (lib/ai/transcript-ai.ts)

Added three new AI-powered methods with fallback implementations:

#### `detectIndentation()`

- Analyzes indentation patterns
- Returns recommended space count
- Provides confidence score and statistics

#### `analyzeLineBreaks()`

- Examines line break patterns
- Recommends space threshold for consolidation
- Returns analysis statistics and warnings

#### `validateCaptionSplit()`

- Validates marker placement
- Suggests adjustments if needed
- Provides context snippets for review

All methods currently use **fallback heuristic implementations** that work without AI integration. These can be enhanced with actual LLM calls later.

### 5. New API Routes

Created three new API endpoints:

- **`/api/transcript/detect-indent`**: POST endpoint for indent detection
- **`/api/transcript/analyze-linebreaks`**: POST endpoint for linebreak analysis
- **`/api/transcript/validate-split`**: POST endpoint for split validation

All routes follow consistent error handling patterns and return standardized JSON responses.

## Workflow Steps Mapping

The implementation aligns with the workflow document:

1. ✅ **Ingest transcript** - Handled by upload component
2. ✅ **Read file contents** - Handled by upload component
3. ✅ **Normalize line endings** - Step 1: Clean Artifacts
4. ✅ **Remove page/line artifacts** - Step 1: Clean Artifacts
5. ✅ **Persist cleaned state** - State management in component
6. 🤖 **Remove indentation** - Step 3 (AI-assisted)
7. 🤖 **Insert caption marker** - Step 2 (AI-assisted)
8. 🤖 **Split caption/body** - Step 4 (AI-assisted validation)
9. 🤖 **Consolidate line breaks** - Step 5 (AI-assisted)
10. ✅ **Reassemble transcript** - Step 5
11. ✅ **Remove marker** - Step 4
12. ✅ **Produce output** - Step 6
13. ✅ **Generate downloadable file** - Step 6
14. ✅ **Reset state** - Reset button in navigation

🤖 = AI-assisted with fallback heuristics

## Backward Navigation

Users can click on any **completed step** (green) in the step indicator to navigate back and review or modify their work. The current step is highlighted in blue, and future steps are disabled (gray).

## Preserved Functionality

All existing features remain functional:

- ✅ Manual caption marking by clicking in textarea
- ✅ AI-powered caption detection
- ✅ Indentation removal with custom parameters
- ✅ Line break consolidation with Q/A preservation
- ✅ DOCX generation with formatting
- ✅ TXT download option
- ✅ Clear/reset functionality

## Future Enhancements

The architecture supports easy integration of actual AI services:

1. Replace fallback methods in `TranscriptAIService` with OpenAI/Claude API calls
2. Load prompt files from `lib/ai/*.md` and include in system messages
3. Parse AI responses and return structured data
4. Add confidence thresholds for automatic vs. manual review

## Testing Recommendations

1. Test each step individually with sample transcripts
2. Verify backward navigation preserves state correctly
3. Test AI detection endpoints with various transcript formats
4. Verify text area position remains consistent across steps
5. Test error handling for edge cases (empty content, no markers, etc.)

## Files Modified

- `src/types/transcript.ts` - Added step types
- `src/components/TranscriptProcessor.tsx` - Refactored to stepped workflow
- `src/lib/ai/transcript-ai.ts` - Added new AI methods

## Files Created

- `src/lib/ai/ai-indent-removal-prompt.md`
- `src/lib/ai/ai-caption-split-prompt.md`
- `src/lib/ai/ai-linebreak-consolidation-prompt.md`
- `src/app/api/transcript/detect-indent/route.ts`
- `src/app/api/transcript/analyze-linebreaks/route.ts`
- `src/app/api/transcript/validate-split/route.ts`
