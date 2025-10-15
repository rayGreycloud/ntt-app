/**
 * Step 4: Validate Caption Split
 */

interface SplitCaptionStepProps {
  onConfirm: () => void;
}

export default function SplitCaptionStep({ onConfirm }: SplitCaptionStepProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Step 4: Validate Caption Split</h3>
      <p className='text-sm text-gray-600'>
        Review the caption/testimony split. The marker will be removed when you
        continue.
      </p>
      <button
        onClick={onConfirm}
        className='px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors'
      >
        Confirm Split & Continue
      </button>
    </div>
  );
}
