import { useRef, useState } from 'react';
import mammoth from 'mammoth';

interface DocxUploaderProps {
  onParsed: (text: string) => void;
  label?: string;
  className?: string;
}

export function DocxUploader({ onParsed, label = 'Import .docx', className = '' }: DocxUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isReading, setIsReading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert('Please upload a .docx file');
      return;
    }

    setIsReading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      if (result.value) {
        onParsed(result.value);
      } else {
        alert('Could not extract text from this document.');
      }
    } catch (err) {
      console.error('Docx extraction failed:', err);
      alert('Error reading .docx file.');
    } finally {
      setIsReading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".docx"
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isReading}
        className="flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all border border-indigo-100 dark:border-indigo-900/30 disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-sm">
          {isReading ? 'hourglass_empty' : 'description'}
        </span>
        {isReading ? 'Reading Doc...' : label}
      </button>
    </div>
  );
}
