/**
 * Step 5: Consolidate Line Breaks
 */

interface ConsolidateLineBreaksStepProps {
  spaceThreshold: number;
  onThresholdChange: (value: number) => void;
  onAIAnalyze: () => void;
  onConsolidate: () => void;
  aiDetecting: boolean;
  processing: boolean;
}

export default function ConsolidateLineBreaksStep({
  spaceThreshold,
  onThresholdChange,
  onAIAnalyze,
  onConsolidate,
  aiDetecting,
  processing
}: ConsolidateLineBreaksStepProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Step 5: Consolidate Line Breaks</h3>
      <p className='text-sm text-gray-600'>
        Remove unnecessary line breaks while preserving Q&A structure.
      </p>
      <div className='flex flex-wrap gap-3 items-center'>
        <div className='flex items-center space-x-2'>
          <label htmlFor='lineBreakCount' className='text-sm font-medium'>
            Space threshold:
          </label>
          <input
            id='lineBreakCount'
            type='number'
            min='0'
            max='20'
            value={spaceThreshold}
            onChange={(e) => onThresholdChange(parseInt(e.target.value) || 0)}
            className='w-16 px-2 py-1 text-center border rounded'
          />
        </div>
        <button
          onClick={onAIAnalyze}
          disabled={aiDetecting}
          className='px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 transition-colors text-sm'
        >
          {aiDetecting ? 'Analyzing...' : '🤖 AI Analyze'}
        </button>
        <button
          onClick={onConsolidate}
          disabled={processing}
          className='px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors'
        >
          {processing ? 'Processing...' : 'Consolidate & Continue'}
        </button>
      </div>
    </div>
  );
}
