/**
 * Step 6: Preview & Download
 */

interface PreviewDownloadStepProps {
  downloadFormat: 'txt' | 'docx';
  onFormatChange: (format: 'txt' | 'docx') => void;
  onDownload: () => void;
  downloading: boolean;
}

export default function PreviewDownloadStep({
  downloadFormat,
  onFormatChange,
  onDownload,
  downloading
}: PreviewDownloadStepProps) {
  return (
    <div className='space-y-4'>
      <h3 className='text-lg font-semibold'>
        Step 6: Preview & Download
      </h3>
      <p className='text-sm text-gray-600'>
        Review the final output and download your formatted transcript.
      </p>
      <div className='flex flex-wrap gap-3 items-center'>
        <div className='flex space-x-4'>
          <label className='flex items-center space-x-2'>
            <input
              type='radio'
              value='txt'
              checked={downloadFormat === 'txt'}
              onChange={(e) =>
                onFormatChange(e.target.value as 'txt' | 'docx')
              }
              className='text-purple-600'
            />
            <span className='text-sm'>Text File (.txt)</span>
          </label>
          <label className='flex items-center space-x-2'>
            <input
              type='radio'
              value='docx'
              checked={downloadFormat === 'docx'}
              onChange={(e) =>
                onFormatChange(e.target.value as 'txt' | 'docx')
              }
              className='text-purple-600'
            />
            <span className='text-sm'>Word Document (.docx)</span>
          </label>
        </div>
        <button
          onClick={onDownload}
          disabled={downloading}
          className='px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-400 transition-colors font-medium'
        >
          {downloading
            ? 'Generating...'
            : `Download ${downloadFormat.toUpperCase()}`}
        </button>
      </div>
    </div>
  );
}
