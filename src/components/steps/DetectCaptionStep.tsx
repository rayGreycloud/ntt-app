/**
 * Step 2: Detect Caption Boundary
 */

interface DetectCaptionStepProps {
  captionBoundary: number | null;
  onAIDetect: () => void;
  onClearMarker: () => void;
  onConfirm: () => void;
  aiDetecting: boolean;
}

export default function DetectCaptionStep({
  captionBoundary,
  onAIDetect,
  onClearMarker,
  onConfirm,
  aiDetecting
}: DetectCaptionStepProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Step 2: Detect Caption Boundary</h3>
      <p className='text-sm text-gray-600'>
        Mark where the caption section ends and testimony begins.
      </p>
      <div className='flex flex-wrap gap-3'>
        <button
          onClick={onAIDetect}
          disabled={captionBoundary !== null || aiDetecting}
          className='px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 transition-colors'
        >
          {aiDetecting ? 'Detecting...' : '🤖 Auto-Detect with AI'}
        </button>
        {captionBoundary !== null && (
          <>
            <button
              onClick={onClearMarker}
              className='px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors'
            >
              Clear Marker
            </button>
            <button
              onClick={onConfirm}
              className='px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'
            >
              Confirm & Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
