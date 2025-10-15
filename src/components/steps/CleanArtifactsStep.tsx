/**
 * Step 1: Clean Page Artifacts
 */

interface CleanArtifactsStepProps {
  onClean: () => void;
  processing: boolean;
}

export default function CleanArtifactsStep({
  onClean,
  processing
}: CleanArtifactsStepProps) {
  return (
    <div className='space-y-4 text-gray-600'>
      <h3 className='text-lg font-semibold'>Step 1: Clean Page Artifacts</h3>
      <p className='text-sm text-gray-600'>
        Remove page numbers and line number artifacts from the transcript.
      </p>
      <button
        onClick={onClean}
        disabled={processing}
        className='px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors'
      >
        {processing ? 'Cleaning...' : 'Clean Artifacts & Continue'}
      </button>
    </div>
  );
}
