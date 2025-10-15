/**
 * Step 3: Remove Indentation
 */

interface RemoveIndentationStepProps {
  indentSpaces: number;
  onIndentChange: (value: number) => void;
  onAIDetect: () => void;
  onRemoveIndents: () => void;
  aiDetecting: boolean;
  processing: boolean;
}

export default function RemoveIndentationStep({
  indentSpaces,
  onIndentChange,
  onAIDetect,
  onRemoveIndents,
  aiDetecting,
  processing
}: RemoveIndentationStepProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>Step 3: Remove Indentation</h3>
      <p className='text-sm text-gray-600'>
        Remove leading spaces from each line to normalize formatting.
      </p>
      <div className='flex flex-wrap gap-3 items-center'>
        <div className='flex items-center space-x-2'>
          <label htmlFor='indentCount' className='text-sm font-medium'>
            Spaces to remove:
          </label>
          <input
            id='indentCount'
            type='number'
            min='0'
            max='20'
            value={indentSpaces}
            onChange={(e) => onIndentChange(parseInt(e.target.value) || 0)}
            className='w-16 px-2 py-1 text-center border rounded'
          />
        </div>
        <button
          onClick={onAIDetect}
          disabled={aiDetecting}
          className='px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:bg-gray-400 transition-colors text-sm'
        >
          {aiDetecting ? 'Detecting...' : '🤖 AI Detect'}
        </button>
        <button
          onClick={onRemoveIndents}
          disabled={processing}
          className='px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition-colors'
        >
          {processing ? 'Processing...' : 'Remove Indents & Continue'}
        </button>
      </div>
    </div>
  );
}
