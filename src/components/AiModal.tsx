import React, { useState } from 'react';
import { Button } from './Button';
import { generateCertificateTemplate } from '../services/geminiService';
import { X, Sparkles } from 'lucide-react';

interface AiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImageSelected: (url: string) => void;
}

export const AiModal: React.FC<AiModalProps> = ({ isOpen, onClose, onImageSelected }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    try {
      const url = await generateCertificateTemplate(prompt);
      onImageSelected(url);
      onClose();
    } catch (err: any) {
      setError("Failed to generate image. Please ensure API Key is valid and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Sparkles className="text-blue-500" size={18} />
            AI Template Designer
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Describe your certificate style</label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., A minimalist modern certificate with blue geometric borders and gold accents..."
              className="w-full border border-gray-300 rounded-lg p-3 text-sm h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>
          
          {error && (
            <div className="text-xs text-red-500 bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div className="text-xs text-gray-500">
            Powered by Google Gemini 2.5 Flash Image.
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</Button>
          <Button onClick={handleGenerate} isLoading={isLoading} disabled={!prompt.trim()}>
            Generate Design
          </Button>
        </div>
      </div>
    </div>
  );
};