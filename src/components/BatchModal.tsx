import React, { useState } from 'react';
import { Button } from './Button';
import { CertificateField } from '../types';
import { X, Users, Download, AlertCircle, Check } from 'lucide-react';
import JSZip from 'jszip';
import { useToast } from './ToastProvider';

interface BatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  fields: CertificateField[];
  imageUrl: string | null;
}

export const BatchModal: React.FC<BatchModalProps> = ({ isOpen, onClose, fields, imageUrl }) => {
  const { showToast } = useToast();
  // Store array of selected field IDs for column mapping
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  const [csvData, setCsvData] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  if (!isOpen) return null;

  const toggleFieldSelection = (id: string) => {
    setSelectedFieldIds(prev => 
      prev.includes(id) ? prev.filter(fid => fid !== id) : [...prev, id]
    );
  };

  const handleBatchGenerate = async () => {
    if (!imageUrl) return;
    if (selectedFieldIds.length === 0) return showToast("Please select at least one field to map.", 'error');
    
    const lines = csvData.split('\n').filter(n => n.trim() !== '');
    if (lines.length === 0) return showToast("Please enter data.", 'error');

    setIsGenerating(true);
    setProgress(0);

    const zip = new JSZip();
    const folder = zip.folder("certificates");

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    await new Promise(resolve => { img.onload = resolve; });

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      setIsGenerating(false);
      return;
    }

    const scaleFactor = canvas.width / 1000;

    for (let i = 0; i < lines.length; i++) {
      // Split by comma for CSV support
      const values = lines[i].split(',').map(v => v.trim());
      
      // Use the first value as the filename base
      const primaryName = values[0] || `certificate-${i}`;

      // Clear and Draw Background
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw all fields
      fields.forEach(field => {
        let textToRender = field.value;

        // Check if this field is one of the mapped dynamic fields
        const mapIndex = selectedFieldIds.indexOf(field.id);
        if (mapIndex !== -1 && values[mapIndex] !== undefined) {
           textToRender = values[mapIndex];
        }

        // Font settings
        const fontSize = field.fontSize * scaleFactor;
        const fontStyle = field.fontStyle === 'italic' ? 'italic' : 'normal';
        const fontWeight = field.fontWeight === 'bold' ? 'bold' : 'normal';
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${field.fontFamily}", sans-serif`;
        ctx.fillStyle = field.color;
        ctx.textAlign = (field.align === 'justify' ? 'left' : field.align) as CanvasTextAlign;
        ctx.textBaseline = 'middle';

        const x = (field.x / 100) * canvas.width;
        const y = (field.y / 100) * canvas.height;

        ctx.fillText(textToRender, x, y);

        // Underline Logic
        if (field.textDecoration === 'underline') {
          const textMetrics = ctx.measureText(textToRender);
          const textWidth = textMetrics.width;
          const padding = field.underlinePadding ? (fontSize * 0.5) : 0; 
          const totalWidth = textWidth + (padding * 2);

          let startX = x;
          if (field.align === 'center') {
            startX = x - (totalWidth / 2);
          } else if (field.align === 'right') {
            startX = x - totalWidth;
          } else {
            startX = x - padding;
          }

          const lineY = y + (fontSize * 0.6);

          ctx.beginPath();
          ctx.strokeStyle = field.color;
          ctx.lineWidth = Math.max(1, fontSize * 0.05);
          ctx.moveTo(startX, lineY);
          ctx.lineTo(startX + totalWidth, lineY);
          ctx.stroke();
        }
      });

      // Add to ZIP
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob && folder) {
        const safeName = primaryName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        folder.file(`${safeName}.png`, blob);
      }

      setProgress(Math.round(((i + 1) / lines.length) * 100));
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = "batch-certificates.zip";
    link.click();

    setIsGenerating(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600" size={18} />
            Batch Generation
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg flex gap-3 items-start text-sm text-blue-800">
             <AlertCircle size={18} className="shrink-0 mt-0.5" />
             <div className="space-y-1">
               <p>Select which fields to replace, then paste your CSV data.</p>
               <p className="text-xs opacity-80">Use Excel to generate auto-incrementing IDs, then copy-paste here.</p>
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">1. Map Columns</label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2 bg-gray-50">
              {fields.map((f, idx) => {
                 const isSelected = selectedFieldIds.includes(f.id);
                 const selectionIndex = selectedFieldIds.indexOf(f.id);
                 
                 return (
                  <div 
                    key={f.id} 
                    onClick={() => toggleFieldSelection(f.id)}
                    className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${isSelected ? 'bg-blue-100 border-blue-200' : 'bg-white hover:bg-gray-100'}`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'}`}>
                      {isSelected && <Check size={12} />}
                    </div>
                    <div className="flex-1 text-sm font-medium text-gray-700">{f.label}</div>
                    {isSelected && <div className="text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Col {selectionIndex + 1}</div>}
                  </div>
                 );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              2. Paste Data (CSV)
            </label>
            <textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder={selectedFieldIds.length > 0 
                ? selectedFieldIds.map((_, i) => `Value${i+1}`).join(', ') + "\n..." 
                : "Select fields above to see format..."
              }
              className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-3 text-sm h-40 focus:ring-2 focus:ring-blue-500 outline-none font-mono"
            />
          </div>

          {isGenerating && (
             <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
               <div className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
             </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={isGenerating}>Cancel</Button>
          <Button onClick={handleBatchGenerate} isLoading={isGenerating} icon={<Download size={16} />}>
            Generate ZIP
          </Button>
        </div>
      </div>
    </div>
  );
};