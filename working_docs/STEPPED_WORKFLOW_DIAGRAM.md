# Stepped Workflow - User Flow Diagram

## Step Progression

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TRANSCRIPT UPLOADER                              │
│                    (User uploads .txt file)                              │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 1: CLEAN ARTIFACTS                                                 │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  • Normalize line endings (\r\n → \n)                          │     │
│  │  • Remove page/line number artifacts                           │     │
│  │  • Store cleaned baseline                                      │     │
│  └────────────────────────────────────────────────────────────────┘     │
│  [Clean Artifacts & Continue] ──────────────────────────────────────┐   │
└─────────────────────────────────────────────────────────────────────┼───┘
                                                                      │
                                 ┌────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 2: DETECT CAPTION BOUNDARY                                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  🤖 AI Option: Auto-detect caption/testimony boundary          │     │
│  │  👆 Manual Option: Click in text to mark position              │     │
│  │  Visual: 🚩 marker appears at boundary                         │     │
│  └────────────────────────────────────────────────────────────────┘     │
│  [🤖 Auto-Detect]  [Clear Marker]  [Confirm & Continue] ────────────┐   │
└─────────────────────────────────────────────────────────────────────┼───┘
                                                                      │
                                 ┌────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 3: REMOVE INDENTATION                                              │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  🤖 AI Option: Auto-detect optimal space count                 │     │
│  │  ⚙️  Manual: Adjust "Spaces to remove" input                   │     │
│  │  Preview: See changes in textarea in real-time                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│  Spaces: [5 ▼]  [🤖 AI Detect]  [Remove Indents & Continue] ────────┐   │
└─────────────────────────────────────────────────────────────────────┼───┘
                                                                      │
                                 ┌────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 4: VALIDATE CAPTION SPLIT                                          │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Review: Check caption/testimony separation                    │     │
│  │  Note: Marker (🚩) will be removed upon confirmation           │     │
│  │  Future: AI validation feedback                                │     │
│  └────────────────────────────────────────────────────────────────┘     │
│  [Confirm Split & Continue] ────────────────────────────────────────┐   │
└─────────────────────────────────────────────────────────────────────┼───┘
                                                                      │
                                 ┌────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 5: CONSOLIDATE LINE BREAKS                                         │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  🤖 AI Option: Analyze optimal space threshold                 │     │
│  │  ⚙️  Manual: Adjust "Space threshold" input                    │     │
│  │  Preserves: Q., A., speaker labels, indented structure        │     │
│  └────────────────────────────────────────────────────────────────┘     │
│  Threshold: [5 ▼]  [🤖 AI Analyze]  [Consolidate & Continue] ───────┐   │
└─────────────────────────────────────────────────────────────────────┼───┘
                                                                      │
                                 ┌────────────────────────────────────┘
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│  STEP 6: PREVIEW & DOWNLOAD                                              │
│  ┌────────────────────────────────────────────────────────────────┐     │
│  │  Review: Final formatted transcript                            │     │
│  │  Format: Choose TXT or DOCX                                    │     │
│  │  Download: Get formatted file with "_formatted" suffix         │     │
│  └────────────────────────────────────────────────────────────────┘     │
│  ( ) TXT  (•) DOCX  [Download DOCX] ────────────────────────────────┐   │
└─────────────────────────────────────────────────────────────────────┼───┘
                                                                      │
                                 ┌────────────────────────────────────┘
                                 ▼
                           [FILE DOWNLOADED]
```

## Navigation Controls

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Step Navigation Bar (Always Visible)                      [Reset]      │
│  ┌───────┐    ┌───────┐    ┌───────┐    ┌───────┐    ┌───────┐       │
│  │ 1.    │ →  │ 2.    │ →  │ 3.    │ →  │ 4.    │ →  │ 5.    │ → ... │
│  │ Clean │    │Detect │    │Remove │    │Validate│   │Consol │       │
│  └───────┘    └───────┘    └───────┘    └───────┘    └───────┘       │
│                                                                         │
│  Legend:                                                                │
│  🟦 Blue = Current Step (clickable to stay)                            │
│  🟩 Green = Completed Step (clickable to go back)                      │
│  ⬜ Gray = Future Step (disabled, not clickable)                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## Textarea Behavior

```
┌─────────────────────────────────────────────────────────────────────────┐
│  TRANSCRIPT TEXTAREA (Always in Same Position - 396px height)           │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │  [Transcript content displayed here...]                           │  │
│  │                                                                    │  │
│  │  Changes per step:                                                │  │
│  │  • Step 1: Original → Cleaned content                            │  │
│  │  • Step 2: Shows 🚩 marker when placed                           │  │
│  │  • Step 3: Indentation removed in real-time                      │  │
│  │  • Step 4: Marker present for review                             │  │
│  │  • Step 5: Line breaks consolidated                              │  │
│  │  • Step 6: Final formatted output                                │  │
│  │                                                                    │  │
│  │  Always editable for manual adjustments                           │  │
│  │                                                                    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  Step-Specific Controls (Fixed height: 120px minimum)                   │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  [Controls and buttons specific to current step]                  │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## AI Integration Points

```
Step 2: Caption Detection
├── API: POST /api/transcript/detect-caption
├── Service: TranscriptAIService.detectCaptionBoundary()
├── Prompt: ai-caption-boundary-prompt.md
└── Fallback: Pattern matching for Q/A markers

Step 3: Indent Detection
├── API: POST /api/transcript/detect-indent
├── Service: TranscriptAIService.detectIndentation()
├── Prompt: ai-indent-removal-prompt.md
└── Fallback: Frequency analysis of leading spaces

Step 4: Split Validation
├── API: POST /api/transcript/validate-split
├── Service: TranscriptAIService.validateCaptionSplit()
├── Prompt: ai-caption-split-prompt.md
└── Fallback: Context pattern matching

Step 5: Linebreak Analysis
├── API: POST /api/transcript/analyze-linebreaks
├── Service: TranscriptAIService.analyzeLineBreaks()
├── Prompt: ai-linebreak-consolidation-prompt.md
└── Fallback: Statistical analysis of indentation patterns
```

## Error Handling Flow

```
AI Request
    │
    ├─ Success ──→ Apply AI recommendations
    │              (with confidence score displayed)
    │
    └─ Failure ──→ Fallback heuristics
                   (with alert notification)
                   (default values applied)
                   (user can still manually adjust)
```

## State Management

```
Component State:
├── currentStep: ProcessingStep (enum value 0-6)
├── content: string (current textarea content)
├── originalContent: string (never changes)
├── cleanedContent: string (after step 1)
├── captionBoundary: number | null (position of marker)
├── indentSpaces: number (user-adjustable)
├── spaceThreshold: number (user-adjustable)
├── downloadFormat: 'txt' | 'docx'
├── processing: boolean (step in progress)
├── aiDetecting: boolean (AI call in progress)
└── downloading: boolean (file generation in progress)
```

## User Experience Highlights

✅ **No UI jumping** - Textarea always in same position
✅ **Progressive disclosure** - Only show controls for current step
✅ **Backward navigation** - Can review/modify previous steps
✅ **AI assistance** - Optional automation with manual fallback
✅ **Real-time preview** - See changes immediately in textarea
✅ **Clear progress** - Visual step indicator shows where you are
✅ **Flexible workflow** - Can skip AI and use manual controls
