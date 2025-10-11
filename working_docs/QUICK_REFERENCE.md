# Quick Reference: Stepped Workflow Implementation

## For Developers

### Adding/Modifying Steps

1. **Add new step to enum** (`src/types/transcript.ts`):

```typescript
export enum ProcessingStep {
  // ... existing steps
  YOUR_NEW_STEP = 7
}
```

2. **Update stepTitles** (`src/components/TranscriptProcessor.tsx`):

```typescript
const stepTitles = {
  // ... existing titles
  [ProcessingStep.YOUR_NEW_STEP]: 'Your Step Name'
};
```

3. **Add step UI** in the render section:

```typescript
{
  currentStep === ProcessingStep.YOUR_NEW_STEP && (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Step X: Your Step</h3>
      {/* Your controls here */}
    </div>
  );
}
```

### Creating New AI Operations

1. **Create prompt file**: `src/lib/ai/ai-your-operation-prompt.md`
2. **Add method to service**: `src/lib/ai/transcript-ai.ts`
3. **Create API route**: `src/app/api/transcript/your-operation/route.ts`
4. **Add button to call API** in TranscriptProcessor step

### API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { TranscriptAIService } from '@/lib/ai/transcript-ai';

export async function POST(request: NextRequest) {
  try {
    const { content } = await request.json();

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid content' },
        { status: 400 }
      );
    }

    const result = await TranscriptAIService.yourMethod(content);

    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { success: false, error: 'Operation failed' },
      { status: 500 }
    );
  }
}
```

## For Users

### How to Use the Stepped Workflow

#### Step 1: Clean Artifacts

- **What it does**: Removes page numbers and normalizes formatting
- **Action**: Click "Clean Artifacts & Continue"
- **Auto-advances**: Yes

#### Step 2: Detect Caption

- **What it does**: Marks where caption ends and testimony begins
- **Options**:
  - Click "🤖 Auto-Detect with AI" for automatic detection
  - Click in the text area to manually mark the position
- **Marker**: Look for 🚩 flag in text
- **Action**: Click "Confirm & Continue" when marker is correctly placed

#### Step 3: Remove Indentation

- **What it does**: Removes leading spaces from lines
- **Options**:
  - Click "🤖 AI Detect" to auto-detect optimal space count
  - Manually adjust the "Spaces to remove" input
- **Preview**: Changes show immediately in the text area
- **Action**: Click "Remove Indents & Continue"

#### Step 4: Validate Split

- **What it does**: Review the caption/testimony separation
- **Visual**: The 🚩 marker shows the split point
- **Action**: Click "Confirm Split & Continue"
- **Note**: Marker is removed after this step

#### Step 5: Consolidate Line Breaks

- **What it does**: Removes unnecessary line breaks while preserving Q&A structure
- **Options**:
  - Click "🤖 AI Analyze" to auto-detect optimal threshold
  - Manually adjust the "Space threshold" input
- **Preserves**:
  - Lines starting with "Q." or "A."
  - Speaker labels (THE WITNESS:, MR. JONES:, etc.)
  - Significantly indented lines
- **Action**: Click "Consolidate & Continue"

#### Step 6: Preview & Download

- **What it does**: Final review and download
- **Options**:
  - Select format: Text File (.txt) or Word Document (.docx)
  - Click "Download TXT" or "Download DOCX"
- **Output**: File named `[original_name]_formatted.[ext]`

### Navigation Tips

- **Green steps**: Already completed - click to go back and review
- **Blue step**: Current step you're on
- **Gray steps**: Not yet reached - cannot click
- **Reset button**: Start over from the beginning
- **Text area**: Always editable - make manual adjustments anytime

### Troubleshooting

**AI detection not working?**

- Use manual controls - all steps work without AI
- Default values are provided as fallback

**Made a mistake in a previous step?**

- Click the green step button to go back
- Make your changes
- Progress forward again through the steps

**Text area content looks wrong?**

- You can manually edit the text at any step
- Use the Reset button to start over with original content

**Download not generating?**

- Check that you've completed all steps
- Try the other format (TXT vs DOCX)
- Check browser console for errors

## File Structure

```
ntt-app/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── transcript/
│   │           ├── detect-caption/
│   │           │   └── route.ts          # Caption boundary detection
│   │           ├── detect-indent/
│   │           │   └── route.ts          # Indentation detection (NEW)
│   │           ├── analyze-linebreaks/
│   │           │   └── route.ts          # Line break analysis (NEW)
│   │           ├── validate-split/
│   │           │   └── route.ts          # Split validation (NEW)
│   │           └── generate-docx/
│   │               └── route.ts          # DOCX generation
│   ├── components/
│   │   ├── TranscriptProcessor.tsx       # REFACTORED - Stepped workflow
│   │   └── TranscriptUploader.tsx
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── ai-caption-boundary-prompt.md
│   │   │   ├── ai-indent-removal-prompt.md      # NEW
│   │   │   ├── ai-caption-split-prompt.md       # NEW
│   │   │   ├── ai-linebreak-consolidation-prompt.md  # NEW
│   │   │   └── transcript-ai.ts                 # ENHANCED
│   │   └── docx-service.ts
│   └── types/
│       └── transcript.ts                 # ENHANCED - Step types
└── working_docs/
    ├── STEPPED_WORKFLOW_IMPLEMENTATION.md    # NEW - Implementation details
    └── STEPPED_WORKFLOW_DIAGRAM.md           # NEW - Visual guide
```

## Key Features

✅ **Stepped progression** - 6 clear steps from upload to download
✅ **AI assistance** - Optional automation for steps 2, 3, and 5
✅ **Backward navigation** - Return to previous steps to review/modify
✅ **Consistent UI** - Text area always in same position (no jumping)
✅ **Real-time preview** - See changes immediately
✅ **Fallback heuristics** - Works without AI integration
✅ **Manual override** - User can always adjust AI recommendations
✅ **Preserved functionality** - All original features still work

## Next Steps for AI Integration

When ready to add actual AI (OpenAI, Claude, etc.):

1. **Install AI SDK**:

   ```bash
   npm install openai
   # or
   npm install @anthropic-ai/sdk
   ```

2. **Update service methods** in `transcript-ai.ts`:

   - Load prompt from `.md` file
   - Make API call to LLM
   - Parse response
   - Return structured data

3. **Add environment variables**:

   ```
   OPENAI_API_KEY=your_key_here
   # or
   ANTHROPIC_API_KEY=your_key_here
   ```

4. **Test with real transcripts** to tune prompts

## Performance Notes

- **Fallback methods**: Fast, synchronous, no external dependencies
- **AI methods**: Async, requires API calls, adds latency
- **State management**: All in React component state (consider Redux/Zustand for larger scale)
- **Text area**: Controlled component, re-renders on content change

## Accessibility

- All steps keyboard navigable
- Clear visual indicators for current/completed steps
- Form inputs have proper labels
- Buttons have descriptive text
- Error messages displayed as alerts (consider toast notifications)
