import React, { useState, useCallback } from 'react';
import { CanvasEditor } from './components/CanvasEditor';
import { Toolbar } from './components/Toolbar';
import { AiModal } from './components/AiModal';
import { ProjectsModal } from './components/ProjectsModal';
import { BatchModal } from './components/BatchModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { useToast } from './components/ToastProvider';
import { CertificateField, FontFamily, SavedProject, GuideLine } from './types';
import { v4 as uuidv4 } from 'uuid';
import { storageService } from './services/storageService';

const App: React.FC = () => {
  const { showToast } = useToast();
  
  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    type?: 'primary' | 'danger';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    type: 'primary'
  });

  const [currentProject, setCurrentProject] = useState<SavedProject | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [fields, setFields] = useState<CertificateField[]>([]);
  const [guides, setGuides] = useState<GuideLine[]>([]);
  const [selectedFieldIds, setSelectedFieldIds] = useState<string[]>([]);
  
  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isProjectsModalOpen, setIsProjectsModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  
  // Zoom state
  const [zoom, setZoom] = useState(1);

  // Handlers
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setImageUrl(evt.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddField = () => {
    const newField: CertificateField = {
      id: uuidv4(),
      label: `Field ${fields.length + 1}`,
      value: "Sample Text",
      x: 50,
      y: 50,
      fontSize: 24,
      fontFamily: FontFamily.Inter,
      color: "#000000",
      align: 'center',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      underlinePadding: false
    };
    setFields([...fields, newField]);
    setSelectedFieldIds([newField.id]);
  };

  const handleDuplicateField = (idToDuplicate?: string) => {
    // If specific id provided (from field icon), use that. Otherwise use selected.
    const targets = idToDuplicate ? [idToDuplicate] : selectedFieldIds;
    if (targets.length === 0) return;

    const newFields: CertificateField[] = [];
    
    targets.forEach(id => {
      const fieldToClone = fields.find(f => f.id === id);
      if (fieldToClone) {
        newFields.push({
          ...fieldToClone,
          id: uuidv4(),
          label: `${fieldToClone.label} (Copy)`,
          x: Math.min(fieldToClone.x + 2, 95),
          y: Math.min(fieldToClone.y + 2, 95)
        });
      }
    });
    
    setFields([...fields, ...newFields]);
    setSelectedFieldIds(newFields.map(f => f.id));
  };

  const handleUpdateField = (id: string, updates: Partial<CertificateField>) => {
    // If updating a selected field, and there are multiple selected, apply generic updates to all
    // BUT specific updates like 'value' or 'label' should only apply to the target
    // For now, simpler approach: if target is in selection, apply to all selected? 
    // Usually user edits one property in toolbar -> apply to all selected.
    // If user drags one field -> logic in CanvasEditor handles that.
    
    // Check if id is in selection. If so, logic might differ.
    // Simplifying: The toolbar usually calls this for the "primary" selection or we need a new handler for batch update.
    // Let's keep this simple: direct update.
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const handleBatchUpdateFields = (ids: string[], updates: Partial<CertificateField>) => {
    setFields(fields.map(f => ids.includes(f.id) ? { ...f, ...updates } : f));
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
    setSelectedFieldIds(prev => prev.filter(pid => pid !== id));
  };

  const handleRemoveSelected = () => {
    setFields(fields.filter(f => !selectedFieldIds.includes(f.id)));
    setSelectedFieldIds([]);
  };

  const resetProject = () => {
    setImageUrl(null);
    setFields([]);
    setGuides([]);
    setCurrentProject(null);
    setSelectedFieldIds([]);
  };

  const handleReset = () => {
    setConfirmModal({
        isOpen: true,
        title: "Reset Project",
        message: "Are you sure you want to clear the template and all fields? This action cannot be undone.",
        type: 'danger',
        onConfirm: resetProject
    });
  };

  const handleNewProject = () => {
    if (fields.length > 0 || imageUrl) {
        setConfirmModal({
            isOpen: true,
            title: "Start New Project",
            message: "Close current project and start a new one? Unsaved changes will be lost.",
            type: 'primary',
            onConfirm: resetProject
        });
    } else {
        resetProject();
    }
  };

  // Guide Handlers
  const handleAddGuide = (type: 'horizontal' | 'vertical') => {
    setGuides([...guides, { id: uuidv4(), type, position: 50 }]);
  };

  const handleUpdateGuide = (id: string, pos: number) => {
    setGuides(guides.map(g => g.id === id ? { ...g, position: pos } : g));
  };

  const handleRemoveGuide = (id: string) => {
    setGuides(guides.filter(g => g.id !== id));
  };

  // Storage Logic
  const handleSaveProject = (name: string) => {
    try {
      const saved = storageService.saveProject(name, imageUrl, fields, currentProject?.id);
      setCurrentProject(saved);
      showToast("Project saved successfully!", 'success');
    } catch (e: any) {
      showToast(e.message || "Failed to save project", 'error');
    }
  };

  const handleQuickSave = () => {
    if (currentProject) {
      handleSaveProject(currentProject.name);
    } else {
      setIsProjectsModalOpen(true);
    }
  };

  const handleLoadProject = (project: SavedProject) => {
    setImageUrl(project.imageUrl);
    setFields(project.fields);
    setGuides([]); // Guides are not persisted in SavedProject yet, reset them
    setCurrentProject(project);
    setSelectedFieldIds([]);
  };

  // Generation Logic
  const handleGenerate = async () => {
    if (!imageUrl) return showToast("Please upload a template first.", 'error');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageUrl;
    
    await new Promise((resolve) => {
      img.onload = () => resolve(true);
    });

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    ctx.drawImage(img, 0, 0);

    fields.forEach(field => {
      const scaleFactor = canvas.width / 1000; 
      const fontSize = field.fontSize * scaleFactor;

      const fontStyle = field.fontStyle === 'italic' ? 'italic' : 'normal';
      const fontWeight = field.fontWeight === 'bold' ? 'bold' : 'normal';
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${field.fontFamily}", sans-serif`;
      
      ctx.fillStyle = field.color;
      ctx.textAlign = (field.align === 'justify' ? 'left' : field.align) as CanvasTextAlign;
      ctx.textBaseline = 'middle';

      const x = (field.x / 100) * canvas.width;
      const y = (field.y / 100) * canvas.height;

      ctx.fillText(field.value, x, y);

      if (field.textDecoration === 'underline') {
        const textMetrics = ctx.measureText(field.value);
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

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `certificate-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    showToast("Certificate generated!", 'success');
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 text-gray-900 font-sans overflow-hidden">
      {/* Left: Editor Stage */}
      <div className="flex-1 flex flex-col relative h-[60%] md:h-auto order-1 md:order-1 min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 text-white p-1.5 rounded-lg">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-800">Certi<span className="text-blue-600">Flow</span></h1>
          </div>
          <div className="flex items-center gap-4">
             {currentProject && (
               <div className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500 font-medium border border-gray-200">
                 {currentProject.name}
               </div>
             )}
             <div className="text-sm text-gray-500">
               {imageUrl ? 'Editing Mode' : 'Setup Mode'}
             </div>
          </div>
        </header>

        <div className="flex-1 relative overflow-hidden bg-slate-100 flex flex-col">
          {imageUrl ? (
            <CanvasEditor 
              imageUrl={imageUrl}
              fields={fields}
              guides={guides}
              onUpdateField={handleUpdateField}
              onBatchUpdateFields={handleBatchUpdateFields}
              onUpdateGuide={handleUpdateGuide}
              onRemoveGuide={handleRemoveGuide}
              onRemoveField={handleRemoveField}
              selectedFieldIds={selectedFieldIds}
              onSelectField={(id, multi) => {
                if (id === null) {
                  setSelectedFieldIds([]);
                } else if (multi) {
                  setSelectedFieldIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
                } else {
                  setSelectedFieldIds([id]);
                }
              }}
              onDuplicateField={handleDuplicateField}
              zoom={zoom}
              setZoom={setZoom}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8 space-y-6">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Start Your Design</h2>
              <p className="max-w-md text-gray-500">
                Upload your existing certificate template to begin.
              </p>
              <div className="flex gap-4">
                 <label className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-6 py-3 rounded-lg cursor-pointer transition shadow-sm font-medium">
                   Upload Image
                   <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                 </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Toolbar */}
      <div className="order-2 md:order-2 h-[40%] md:h-auto w-full md:w-80 shrink-0">
        <Toolbar 
          fields={fields}
          selectedFieldIds={selectedFieldIds}
          onSelectField={(id) => id ? setSelectedFieldIds([id]) : setSelectedFieldIds([])}
          onBatchUpdateFields={handleBatchUpdateFields}
          onAddField={handleAddField}
          onDuplicateField={() => handleDuplicateField()}
          onUpdateField={handleUpdateField}
          onGenerate={handleGenerate}
          onImageUpload={handleImageUpload}
          imageUrl={imageUrl}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          onReset={handleReset}
          onOpenProjects={() => setIsProjectsModalOpen(true)}
          onOpenBatch={() => setIsBatchModalOpen(true)}
          onSaveProject={handleQuickSave}
          onNewProject={handleNewProject}
          onAddGuide={handleAddGuide}
          onRemoveField={handleRemoveField}
        />
      </div>

      {/* Modals */}
      <AiModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)}
        onImageSelected={(url) => setImageUrl(url)}
      />
      
      <ProjectsModal 
        isOpen={isProjectsModalOpen}
        onClose={() => setIsProjectsModalOpen(false)}
        currentProject={currentProject}
        onLoadProject={handleLoadProject}
        onSaveCurrent={handleSaveProject}
      />

      <BatchModal 
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        fields={fields}
        imageUrl={imageUrl}
      />

      <ConfirmationModal 
         isOpen={confirmModal.isOpen}
         onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
         onConfirm={confirmModal.onConfirm}
         title={confirmModal.title}
         message={confirmModal.message}
         type={confirmModal.type}
      />
    </div>
  );
};

export default App;