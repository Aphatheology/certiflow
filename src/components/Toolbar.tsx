import React, { useState } from 'react';
import { CertificateField, FontFamily } from '../types';
import { Button } from './Button';
import { 
  Plus, 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Bold, 
  Italic,
  Underline,
  Download, 
  Image as ImageIcon,
  Wand2,
  Trash,
  Expand,
  Copy,
  FolderOpen,
  Save,
  Users,
  FilePlus,
  Ruler,
  AlignStartVertical,
  AlignEndVertical,
  AlignCenterVertical,
  AlignStartHorizontal,
  AlignEndHorizontal,
  AlignCenterHorizontal,
  Trash2
} from 'lucide-react';

interface ToolbarProps {
  fields: CertificateField[];
  selectedFieldIds: string[];
  onSelectField: (id: string | null) => void;
  onBatchUpdateFields: (ids: string[], updates: Partial<CertificateField>) => void;
  onAddField: () => void;
  onDuplicateField: (id?: string) => void;
  onUpdateField: (id: string, updates: Partial<CertificateField>) => void;
  onGenerate: () => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenAiModal: () => void;
  onReset: () => void;
  onOpenProjects: () => void;
  onOpenBatch: () => void;
  onSaveProject: () => void;
  onNewProject: () => void;
  onAddGuide: (type: 'horizontal' | 'vertical') => void;
  onRemoveField?: (id: string) => void;
  imageUrl: string | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  fields,
  selectedFieldIds,
  onSelectField,
  onBatchUpdateFields,
  onAddField,
  onDuplicateField,
  onUpdateField,
  onGenerate,
  onImageUpload,
  onOpenAiModal,
  onReset,
  onOpenProjects,
  onOpenBatch,
  onSaveProject,
  onNewProject,
  onAddGuide,
  onRemoveField,
  imageUrl
}) => {
  const selectedFields = fields.filter(f => selectedFieldIds.includes(f.id));
  const primaryField = selectedFields[0];
  const hasContent = !!imageUrl || fields.length > 0;

  // Alignment Logic for Multi-Select
  const alignSelected = (type: 'left' | 'center-h' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (selectedFields.length < 2) return;
    
    // Calculate reference value
    let targetVal = 0;
    if (type === 'left') targetVal = Math.min(...selectedFields.map(f => f.x));
    if (type === 'right') targetVal = Math.max(...selectedFields.map(f => f.x));
    if (type === 'center-h') targetVal = selectedFields.reduce((sum, f) => sum + f.x, 0) / selectedFields.length;
    
    if (type === 'top') targetVal = Math.min(...selectedFields.map(f => f.y));
    if (type === 'bottom') targetVal = Math.max(...selectedFields.map(f => f.y));
    if (type === 'middle') targetVal = selectedFields.reduce((sum, f) => sum + f.y, 0) / selectedFields.length;

    // Apply
    const updates: Record<string, Partial<CertificateField>> = {};
    selectedFields.forEach(f => {
       if (type === 'left' || type === 'right' || type === 'center-h') {
           updates[f.id] = { x: targetVal };
       } else {
           updates[f.id] = { y: targetVal };
       }
    });
    
    // Iterate to update
    Object.entries(updates).forEach(([id, u]) => onUpdateField(id, u));
  };

  return (
    <div className="w-full md:w-80 bg-white border-l border-gray-200 flex flex-col h-full shadow-xl z-20">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
          Config
        </h2>
        <div className="flex gap-1">
          <button 
            onClick={onNewProject}
            className="p-1.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
            title="New Project"
          >
            <FilePlus size={18} />
          </button>
          <button 
            onClick={onSaveProject}
            className="p-1.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
            title="Save Project"
          >
            <Save size={18} />
          </button>
          <button 
            onClick={onOpenProjects} 
            className="p-1.5 text-gray-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
            title="Open Projects"
          >
            <FolderOpen size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* Template Section */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Template Source</label>
          <div className="grid grid-cols-2 gap-2">
            <label className="relative cursor-pointer w-full group">
              <input 
                type="file" 
                accept="image/*" 
                onChange={onImageUpload}
                className="hidden" 
              />
              <Button 
                variant="secondary" 
                className="w-full text-xs pointer-events-none group-hover:bg-gray-50" 
                icon={<ImageIcon size={14} />}
                type="button"
              >
                Upload
              </Button>
            </label>
            <Button 
                variant="primary" 
                disabled={true} 
                className="w-full text-xs bg-gradient-to-r from-violet-600 to-indigo-600 border-none text-white shadow-md opacity-80 cursor-not-allowed"
                icon={<Wand2 size={14} />}
                title="Coming Soon"
            >
                AI Gen (Soon)
            </Button>
          </div>
          {hasContent && (
             <button onClick={onReset} className="text-xs text-red-500 hover:underline flex items-center gap-1">
                <Trash size={10} /> Reset Project
             </button>
          )}
        </div>

        <hr className="border-gray-100" />

        {/* Guides Section */}
        <div className="space-y-3">
           <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
             <Ruler size={12} />
             Alignment Guides
           </label>
           <div className="flex gap-2">
             <Button variant="secondary" className="flex-1 text-xs" onClick={() => onAddGuide('horizontal')}>
               + Horizontal
             </Button>
             <Button variant="secondary" className="flex-1 text-xs" onClick={() => onAddGuide('vertical')}>
               + Vertical
             </Button>
           </div>
        </div>

        <hr className="border-gray-100" />

        {/* Multi-Selection Actions */}
        {selectedFields.length > 1 && (
            <div className="space-y-3 animate-in fade-in slide-in-from-right-4">
                <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                        {selectedFields.length} Selected
                    </label>
                </div>
                
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 space-y-3">
                    <p className="text-[10px] text-gray-500 font-medium uppercase">Align Objects</p>
                    <div className="grid grid-cols-3 gap-1">
                        <button onClick={() => alignSelected('left')} className="p-1.5 bg-white rounded border hover:bg-blue-100 flex justify-center" title="Align Left"><AlignStartVertical size={16}/></button>
                        <button onClick={() => alignSelected('center-h')} className="p-1.5 bg-white rounded border hover:bg-blue-100 flex justify-center" title="Align Center (H)"><AlignCenterVertical size={16}/></button>
                        <button onClick={() => alignSelected('right')} className="p-1.5 bg-white rounded border hover:bg-blue-100 flex justify-center" title="Align Right"><AlignEndVertical size={16}/></button>
                        
                        <button onClick={() => alignSelected('top')} className="p-1.5 bg-white rounded border hover:bg-blue-100 flex justify-center" title="Align Top"><AlignStartHorizontal size={16}/></button>
                        <button onClick={() => alignSelected('middle')} className="p-1.5 bg-white rounded border hover:bg-blue-100 flex justify-center" title="Align Middle (V)"><AlignCenterHorizontal size={16}/></button>
                        <button onClick={() => alignSelected('bottom')} className="p-1.5 bg-white rounded border hover:bg-blue-100 flex justify-center" title="Align Bottom"><AlignEndHorizontal size={16}/></button>
                    </div>

                    <div className="pt-2 border-t border-blue-100">
                        <p className="text-[10px] text-gray-500 font-medium uppercase mb-2">Batch Style</p>
                        <div className="grid grid-cols-2 gap-2">
                             <div>
                                <label className="text-[10px] text-gray-400 mb-1 block">Font</label>
                                <select 
                                    onChange={(e) => onBatchUpdateFields(selectedFieldIds, { fontFamily: e.target.value as FontFamily })}
                                    className="w-full text-xs bg-white border border-gray-300 rounded p-1.5"
                                >
                                    <option value="">Mixed...</option>
                                    {Object.values(FontFamily).map(font => (
                                    <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                                    ))}
                                </select>
                             </div>
                             <div>
                                <label className="text-[10px] text-gray-400 mb-1 block">Size</label>
                                <input 
                                    type="number" 
                                    placeholder="Mixed"
                                    onChange={(e) => onBatchUpdateFields(selectedFieldIds, { fontSize: Number(e.target.value) })}
                                    className="w-full text-xs bg-white border border-gray-300 rounded p-1.5"
                                />
                             </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* Style Editor (Contextual - Single) */}
        {selectedFields.length === 1 && primaryField && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
             <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-gray-700">Styling</label>
             </div>

             {/* Field Label Editing */}
             <div>
               <label className="text-[10px] text-gray-500 mb-1 block">Field Name</label>
               <input 
                type="text"
                value={primaryField.label}
                onChange={(e) => onUpdateField(primaryField.id, { label: e.target.value })}
                className="w-full text-xs bg-white border border-gray-300 rounded p-1.5 focus:border-blue-500 focus:outline-none text-gray-900 font-medium"
               />
             </div>
             
             {/* Field Value Editing */}
             <div>
               <label className="text-[10px] text-gray-500 mb-1 block">Field Value</label>
               <input 
                type="text"
                value={primaryField.value}
                onChange={(e) => onUpdateField(primaryField.id, { value: e.target.value })}
                className="w-full text-xs bg-white border border-gray-300 rounded p-1.5 focus:border-blue-500 focus:outline-none text-gray-900"
                placeholder="Enter text..."
               />
             </div>
             
             
             {/* Font Family */}
             <div>
               <label className="text-[10px] text-gray-500 mb-1 block">Font</label>
               <select 
                value={primaryField.fontFamily}
                onChange={(e) => onUpdateField(primaryField.id, { fontFamily: e.target.value as FontFamily })}
                className="w-full text-xs bg-white border border-gray-300 rounded p-1.5 focus:border-blue-500 focus:outline-none text-gray-900"
               >
                 {Object.values(FontFamily).map(font => (
                   <option key={font} value={font} style={{ fontFamily: font }}>{font}</option>
                 ))}
               </select>
             </div>

             {/* Size & Color */}
             <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-gray-500 mb-1 block">Size (px)</label>
                  <input 
                    type="number" 
                    value={primaryField.fontSize}
                    onChange={(e) => onUpdateField(primaryField.id, { fontSize: Number(e.target.value) })}
                    className="w-full text-xs bg-white border border-gray-300 rounded p-1.5 focus:border-blue-500 focus:outline-none text-gray-900"
                  />
                </div>
                <div>
                   <label className="text-[10px] text-gray-500 mb-1 block">Color</label>
                   <div className="flex items-center gap-2">
                     <input 
                      type="color" 
                      value={primaryField.color}
                      onChange={(e) => onUpdateField(primaryField.id, { color: e.target.value })}
                      className="h-7 w-8 p-0 border-0 rounded cursor-pointer shrink-0"
                     />
                     <input 
                         type="text" 
                         value={primaryField.color}
                         onChange={(e) => onUpdateField(primaryField.id, { color: e.target.value })}
                         className="w-full text-[10px] bg-white border border-gray-300 rounded p-1 uppercase"
                     />
                   </div>
                </div>
             </div>

             {/* Formatting */}
             <div className="flex flex-col gap-2 border-t border-gray-200 pt-2">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1 bg-white rounded border border-gray-200 p-0.5">
                    {(['left', 'center', 'right', 'justify'] as const).map(align => (
                      <button
                        key={align}
                        onClick={() => onUpdateField(primaryField.id, { align })}
                        className={`p-1 rounded ${primaryField.align === align ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                        title={`Align ${align}`}
                      >
                        {align === 'left' && <AlignLeft size={14} />}
                        {align === 'center' && <AlignCenter size={14} />}
                        {align === 'right' && <AlignRight size={14} />}
                        {align === 'justify' && <AlignJustify size={14} />}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex gap-1">
                    <button
                      onClick={() => onUpdateField(primaryField.id, { fontWeight: primaryField.fontWeight === 'bold' ? 'normal' : 'bold' })}
                      className={`p-1.5 rounded border ${primaryField.fontWeight === 'bold' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white text-gray-400 border-gray-200'}`}
                      title="Bold"
                    >
                      <Bold size={14} />
                    </button>
                    <button
                      onClick={() => onUpdateField(primaryField.id, { fontStyle: primaryField.fontStyle === 'italic' ? 'normal' : 'italic' })}
                      className={`p-1.5 rounded border ${primaryField.fontStyle === 'italic' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white text-gray-400 border-gray-200'}`}
                      title="Italic"
                    >
                      <Italic size={14} />
                    </button>
                    <button
                      onClick={() => onUpdateField(primaryField.id, { textDecoration: primaryField.textDecoration === 'underline' ? 'none' : 'underline' })}
                      className={`p-1.5 rounded border ${primaryField.textDecoration === 'underline' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white text-gray-400 border-gray-200'}`}
                      title="Underline"
                    >
                      <Underline size={14} />
                    </button>
                  </div>
                </div>

                {/* Extended Underline Toggle */}
                {primaryField.textDecoration === 'underline' && (
                   <div className="flex items-center gap-2 mt-1 px-1">
                      <button
                        onClick={() => onUpdateField(primaryField.id, { underlinePadding: !primaryField.underlinePadding })}
                        className={`flex-1 flex items-center justify-center gap-2 p-1 text-xs border rounded transition-colors ${primaryField.underlinePadding ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-500'}`}
                      >
                         <Expand size={12} />
                         <span>Extended Line</span>
                      </button>
                   </div>
                )}
             </div>
          </div>
        )}

        {/* Fields List (Always visible but highlights selection) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">All Fields</label>
            <button 
              onClick={onAddField}
              className="p-1 hover:bg-blue-50 text-blue-600 rounded transition-colors"
              title="Add Field"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="space-y-2">
            {fields.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No fields added yet.</p>
            ) : (
              fields.map(field => (
                <div 
                  key={field.id}
                  onClick={(e) => {
                      if (e.shiftKey || e.metaKey) {
                          onSelectField(field.id); 
                      } else {
                          onSelectField(field.id);
                      }
                  }}
                  className={`p-2 rounded border text-sm transition-all cursor-pointer group hover:border-blue-300 ${
                    selectedFieldIds.includes(field.id)
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-200' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700 truncate pr-2 flex-1">{field.label}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                           onClick={(e) => {
                               e.stopPropagation();
                               onDuplicateField(field.id);
                           }}
                           className="p-1 text-gray-400 hover:text-blue-600 rounded"
                           title="Duplicate"
                         >
                            <Copy size={12} />
                         </button>
                         <button 
                           onClick={(e) => {
                               e.stopPropagation();
                               if (onRemoveField) onRemoveField(field.id);
                           }}
                           className="p-1 text-gray-400 hover:text-red-600 rounded"
                           title="Delete"
                         >
                            <Trash2 size={12} />
                         </button>
                    </div>
                  </div>
                    <div className="text-gray-500 truncate text-xs">{field.value}</div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Footer Action */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 shrink-0">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-1 md:space-y-2 md:gap-0">
            <Button onClick={onGenerate} className="w-full shadow-lg text-xs md:text-sm" icon={<Download size={16} />}>
              Generate
            </Button>
            <Button onClick={onOpenBatch} variant="secondary" className="w-full text-xs md:text-sm" icon={<Users size={16} />}>
              Batch
            </Button>
          </div>
      </div>
    </div>
  );
};