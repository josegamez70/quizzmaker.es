
import React, { useState, useCallback, ChangeEvent, useEffect } from 'react';
import { UploadIcon, FileTextIcon } from './icons.tsx';

interface FileUploaderProps {
  onFilesSelect: (files: File[]) => void;
  onSubmit: () => void;
  numQuestions: number;
  onNumQuestionsChange: (num: number) => void;
}

const MAX_TOTAL_SIZE_MB = 15;
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

const ImageUploader: React.FC<FileUploaderProps> = ({ onFilesSelect, onSubmit, numQuestions, onNumQuestionsChange }) => {
  const [previews, setPreviews] = useState<{name: string, type: string, url: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  // Revoke object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      previews.forEach(preview => {
        if (preview.url && preview.url.startsWith('blob:')) {
          URL.revokeObjectURL(preview.url);
        }
      });
    };
  }, [previews]);

  const handleFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setUploadError('');
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) {
      onFilesSelect([]);
      setPreviews([]);
      return;
    }
    
    const file = fileList[0];

    // Validate size
    if (file.size > MAX_TOTAL_SIZE_BYTES) {
        setUploadError(`El tamaño del archivo supera los ${MAX_TOTAL_SIZE_MB}MB.`);
        onFilesSelect([]);
        setPreviews([]);
        if (event.target) event.target.value = ''; // Reset input
        return;
    }
    
    onFilesSelect([file]);
    
    const newPreview = {
        name: file.name,
        type: file.type,
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
    };
    
    setPreviews([newPreview]);

  }, [onFilesSelect]);

  const handleSubmit = () => {
      setIsSubmitting(true);
      onSubmit();
  }
  
  const questionOptions = [10, 20, 30];

  return (
    <div className="w-full max-w-2xl p-6 space-y-4 bg-gray-800 rounded-2xl shadow-2xl">
      <div
        className="relative border-2 border-dashed border-gray-500 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-400 transition-colors flex items-center justify-center min-h-[160px]"
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        <input id="file-upload" type="file" className="hidden" accept="image/*,application/pdf" onChange={handleFileChange} />
        {previews.length === 0 ? (
          <div className="flex flex-col items-center text-gray-400">
            <UploadIcon className="w-10 h-10 mb-2" />
            <span className="font-semibold">Haz clic para subir un archivo</span>
            <span className="text-sm">Sube un PDF o una Imagen</span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center">
            {previews.map((p) => {
              if (p.type.startsWith('image/')) {
                return (
                  <div key={p.name} className="relative w-full max-w-sm h-36">
                    <img src={p.url} alt={p.name} className="object-contain w-full h-full rounded-md" />
                    <span className="absolute bottom-0 left-0 right-0 text-xs bg-black/50 text-white p-1 text-center truncate">{p.name}</span>
                  </div>
                );
              } else { // PDF
                return (
                  <div key={p.name} className="flex flex-col items-center justify-center text-gray-400 p-4">
                    <FileTextIcon className="w-12 h-12 text-indigo-400" />
                    <span className="mt-2 font-semibold text-white">{p.name}</span>
                  </div>
                );
              }
            })}
          </div>
        )}
      </div>
      
      {uploadError && <p className="text-sm text-red-500 text-center mt-2">{uploadError}</p>}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-300">Número de Preguntas</label>
        <div className="flex w-full bg-gray-700 rounded-lg p-1">
            {questionOptions.map(option => (
                <button
                    key={option}
                    onClick={() => onNumQuestionsChange(option)}
                    className={`w-full py-2 text-sm font-semibold rounded-md transition-colors focus:outline-none ${numQuestions === option ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                >{option}</button>
            ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={previews.length === 0 || isSubmitting || !!uploadError}
        className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-transform transform hover:scale-105"
      >
        {isSubmitting ? 'Generando...' : 'Generar Cuestionario'}
      </button>
    </div>
  );
};

export default ImageUploader;
