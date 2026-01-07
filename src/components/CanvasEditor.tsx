import React, { useRef, useState, useEffect, useCallback } from 'react';
import { CertificateField, GuideLine } from '../types';
import { Copy, Plus, Minus, Maximize, Trash2, X, Move } from 'lucide-react';

interface CanvasEditorProps {
  imageUrl: string;
  fields: CertificateField[];
  guides: GuideLine[];
  onUpdateField: (id: string, updates: Partial<CertificateField>) => void;
  onBatchUpdateFields: (ids: string[], updates: Partial<CertificateField>) => void;
  onUpdateGuide: (id: string, pos: number) => void;
  onRemoveGuide: (id: string) => void;
  onRemoveField: (id: string) => void;
  selectedFieldIds: string[];
  onSelectField: (id: string | null, multi?: boolean) => void;
  onDuplicateField: (id?: string) => void;
  zoom: number;
  setZoom: (z: number) => void;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  imageUrl,
  fields,
  guides,
  onUpdateField,
  onBatchUpdateFields,
  onUpdateGuide,
  onRemoveGuide,
  onRemoveField,
  selectedFieldIds,
  onSelectField,
  onDuplicateField,
  zoom,
  setZoom
}) => {
  const containerRef = useRef<HTMLDivElement>(null); // The wrapper (viewport)
  const contentRef = useRef<HTMLDivElement>(null); // The actual scaled content
  
  // Dragging state
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [draggingGuideId, setDraggingGuideId] = useState<string | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [initialFieldPositions, setInitialFieldPositions] = useState<Record<string, {x: number, y: number}>>({});
  
  // Snapping state
  const [activeSnapLines, setActiveSnapLines] = useState<{ x: number | null, y: number | null }>({ x: null, y: null });

  // Rendered Dimensions for relative calculation
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 1000, height: 1000 });
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Initialize and Auto-Fit
  useEffect(() => {
    setIsLoadingImage(true);
    const img = new Image();
    img.src = imageUrl;
    img.onload = () => {
       const natWidth = img.naturalWidth;
       const natHeight = img.naturalHeight;
       setNaturalDimensions({ width: natWidth, height: natHeight });
       setIsLoadingImage(false);

       // Auto-Fit Logic
       if (containerRef.current) {
         const { clientWidth, clientHeight } = containerRef.current;
         const padding = 40; // Space around
         const availableW = clientWidth - padding;
         const availableH = clientHeight - padding;
         
         const scaleW = availableW / natWidth;
         const scaleH = availableH / natHeight;
         const fitScale = Math.min(scaleW, scaleH, 1); // Never zoom in by default, only downscale or 1
         
         // Only set if we haven't manually zoomed yet (or if simple initial load check)
         // For now, simple approach: if zoom is 1 (default), try to fit.
         // Actually, let's just force fit on new image load to be safe.
         setZoom(Math.max(0.1, parseFloat(fitScale.toFixed(2))));
       }
    };
  }, [imageUrl]); 

  // Keyboard support: Deletion and Movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      // Avoid capturing keys when typing in inputs
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        return;
      }

      // Deletion
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFieldIds.length > 0) {
        selectedFieldIds.forEach(id => onRemoveField(id));
      }

      // Movement
      if (selectedFieldIds.length > 0 && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        
        // Minute delta: 0.1% ~ 1px on 1000px width. Normal delta: 0.5% ~ 5px.
        const step = e.shiftKey ? 0.05 : 0.2; 
        
        const updates: Record<string, Partial<CertificateField>> = {};

        fields.filter(f => selectedFieldIds.includes(f.id)).forEach(field => {
            let newX = field.x;
            let newY = field.y;

            if (e.key === 'ArrowLeft') newX -= step;
            if (e.key === 'ArrowRight') newX += step;
            if (e.key === 'ArrowUp') newY -= step;
            if (e.key === 'ArrowDown') newY += step;

            updates[field.id] = { x: newX, y: newY };
        });

        // Apply updates
        Object.entries(updates).forEach(([id, update]) => onUpdateField(id, update));
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFieldIds, onRemoveField, fields, onUpdateField]);

  // --- PANNING HANDLERS (Background) ---
  const handleBgMouseDown = (e: React.MouseEvent) => {
    // Only pan if clicking on background and NOT on a field/guide
    if (containerRef.current) {
        setIsPanning(true);
        setPanStart({
            x: e.clientX,
            y: e.clientY,
            scrollLeft: containerRef.current.scrollLeft,
            scrollTop: containerRef.current.scrollTop
        });
        document.body.style.cursor = 'grabbing';
    }
  };

  // --- FIELD DRAGGING HANDLERS ---
  const handleFieldMouseDown = (e: React.MouseEvent, field: CertificateField) => {
    e.stopPropagation();
    
    const isMultiSelect = e.shiftKey || e.metaKey || e.ctrlKey;
    let newSelectedIds = selectedFieldIds;

    if (isMultiSelect) {
      if (selectedFieldIds.includes(field.id)) {
          newSelectedIds = selectedFieldIds.filter(id => id !== field.id);
      } else {
          newSelectedIds = [...selectedFieldIds, field.id];
      }
      onSelectField(field.id, true);
    } else {
      if (!selectedFieldIds.includes(field.id)) {
            onSelectField(field.id, false); 
            newSelectedIds = [field.id];
      }
    }

    // Setup dragging
    setDragStartPos({ x: e.clientX, y: e.clientY });
    
    const initialPos: Record<string, {x: number, y: number}> = {};
    fields.filter(f => newSelectedIds.includes(f.id)).forEach(f => {
        initialPos[f.id] = { x: f.x, y: f.y };
    });
    setInitialFieldPositions(initialPos);
    setDraggingFieldId(field.id);
  };

  // --- GUIDE DRAGGING HANDLERS ---
  const handleGuideMouseDown = (e: React.MouseEvent, guideId: string) => {
    e.stopPropagation();
    setDraggingGuideId(guideId);
  };

  // --- GLOBAL MOVE HANDLER ---
  const handleMouseMove = (e: React.MouseEvent) => {
    // 1. Handle Panning
    if (isPanning && containerRef.current) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        containerRef.current.scrollLeft = panStart.scrollLeft - dx;
        containerRef.current.scrollTop = panStart.scrollTop - dy;
        return; 
    }

    // 2. Handle Object Dragging
    if (!contentRef.current) return;
    const rect = contentRef.current.getBoundingClientRect(); 

    // Field Dragging
    if (draggingFieldId && selectedFieldIds.length > 0) {
      const deltaPercentX = ((e.clientX - dragStartPos.x) / rect.width) * 100;
      const deltaPercentY = ((e.clientY - dragStartPos.y) / rect.height) * 100;

      const updates: Record<string, Partial<CertificateField>> = {};
      let primaryFieldX = 0; 
      let primaryFieldY = 0;
      
      selectedFieldIds.forEach(id => {
          if (initialFieldPositions[id]) {
            let newX = initialFieldPositions[id].x + deltaPercentX;
            let newY = initialFieldPositions[id].y + deltaPercentY;
            
            newX = Math.max(0, Math.min(newX, 100));
            newY = Math.max(0, Math.min(newY, 100));

            updates[id] = { x: newX, y: newY };

            if (id === draggingFieldId) {
                primaryFieldX = newX;
                primaryFieldY = newY;
            }
          }
      });
      
      const SNAP_THRESHOLD = 0.5; // percentage
      let snappedX = null;
      let snappedY = null;

      if (selectedFieldIds.length === 1) {
          if (Math.abs(primaryFieldX - 50) < SNAP_THRESHOLD) {
             updates[draggingFieldId!] = { ...updates[draggingFieldId!], x: 50 };
             snappedX = 50;
          }
          if (Math.abs(primaryFieldY - 50) < SNAP_THRESHOLD) {
             updates[draggingFieldId!] = { ...updates[draggingFieldId!], y: 50 };
             snappedY = 50;
          }
          guides.forEach(guide => {
             if (guide.type === 'vertical') {
               if (Math.abs(primaryFieldX - guide.position) < SNAP_THRESHOLD) {
                  updates[draggingFieldId!] = { ...updates[draggingFieldId!], x: guide.position };
                  snappedX = guide.position;
               }
             } else {
               if (Math.abs(primaryFieldY - guide.position) < SNAP_THRESHOLD) {
                  updates[draggingFieldId!] = { ...updates[draggingFieldId!], y: guide.position };
                  snappedY = guide.position;
               }
             }
          });
      }

      setActiveSnapLines({ x: snappedX, y: snappedY });
      Object.entries(updates).forEach(([id, u]) => onUpdateField(id, u));
    }

    // Guide Dragging
    if (draggingGuideId) {
      const guide = guides.find(g => g.id === draggingGuideId);
      if (guide) {
        if (guide.type === 'vertical') {
          let x = e.clientX - rect.left;
          x = Math.max(0, Math.min(x, rect.width));
          onUpdateGuide(draggingGuideId, (x / rect.width) * 100);
        } else {
          let y = e.clientY - rect.top;
          y = Math.max(0, Math.min(y, rect.height));
          onUpdateGuide(draggingGuideId, (y / rect.height) * 100);
        }
      }
    }
  };

  const handleMouseUp = () => {
    setDraggingFieldId(null);
    setDraggingGuideId(null);
    setActiveSnapLines({ x: null, y: null });
    setIsPanning(false);
    document.body.style.cursor = 'default';
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('mousemove', handleMouseMove as any); // Type cast for React Synthetic -> Native
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mousemove', handleMouseMove as any);
    };
  }, [draggingFieldId, draggingGuideId, isPanning, panStart]); // Add dependencies

  // Visual Scale for Font: rendered width / 1000
  const visualScale = (naturalDimensions.width * zoom) / 1000;

  return (
    <div className="w-full h-full relative bg-gray-200 flex flex-col">
      {/* Zoom Controls */}
      <div className="absolute top-4 left-4 z-50 flex gap-2 bg-white/90 backdrop-blur p-1.5 rounded-lg shadow-lg border border-gray-200">
        <button className="p-1 hover:bg-gray-100 rounded" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}><Minus size={16} /></button>
        <input 
          type="number" 
          value={Math.round(zoom * 100)} 
          onChange={(e) => {
            const val = parseInt(e.target.value);
            if (!isNaN(val)) {
               setZoom(Math.max(0.1, Math.min(3, val / 100)));
            }
          }}
          className="text-xs font-mono w-12 text-center border-none bg-transparent focus:outline-none focus:ring-1 focus:ring-blue-200 rounded"
          min="10"
          max="300"
        />
        <button className="p-1 hover:bg-gray-100 rounded" onClick={() => setZoom(Math.min(3, zoom + 0.1))}><Plus size={16} /></button>
        <button 
          className="p-1 hover:bg-gray-100 rounded ml-1 text-gray-500" 
          onClick={() => {
             if (containerRef.current) {
                const padding = 40;
                const availableW = containerRef.current.clientWidth - padding;
                const availableH = containerRef.current.clientHeight - padding;
                const fitScale = Math.min(availableW / naturalDimensions.width, availableH / naturalDimensions.height, 1);
                setZoom(Math.max(0.1, parseFloat(fitScale.toFixed(2))));
             }
          }} 
          title="Fit to Screen"
        >
          <Maximize size={14} />
        </button>
      </div>
      
      {/* Pan Overlay Hint (Optional) */}
      <div className="absolute bottom-4 left-4 z-40 bg-black/50 text-white text-[10px] px-2 py-1 rounded pointer-events-none">
         Drag background to pan • Scroll to move
      </div>

      <div 
        ref={containerRef}
        className={`w-full h-full overflow-auto flex items-center justify-center focus:outline-none bg-slate-100 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
        onClick={() => onSelectField(null)}
        onMouseDown={handleBgMouseDown}
        tabIndex={0} 
      >
        <div 
            ref={contentRef}
            className="relative shadow-2xl bg-white shrink-0 transition-all duration-75 ease-linear origin-center"
            style={{ 
                width: naturalDimensions.width * zoom,
                height: naturalDimensions.height * zoom,
            }}
            onMouseDown={(e) => {
                // Allow panning via background click (bubbling up to container)
                // But fields/guides stop propagation
            }}
        >
            {!isLoadingImage && (
                <img 
                src={imageUrl} 
                alt="Certificate Template" 
                className="w-full h-full object-contain pointer-events-none block select-none"
                draggable={false}
                />
            )}

            {/* --- GUIDES --- */}
            {guides.map(guide => (
            <div
                key={guide.id}
                onMouseDown={(e) => handleGuideMouseDown(e, guide.id)}
                className={`absolute z-30 hover:bg-cyan-400 group flex items-center justify-center
                ${guide.type === 'vertical' ? 'w-[1px] h-full top-0 cursor-col-resize hover:w-[4px]' : 'h-[1px] w-full left-0 cursor-row-resize hover:h-[4px]'}
                ${draggingGuideId === guide.id ? (guide.type === 'vertical' ? 'w-[4px] bg-cyan-500' : 'h-[4px] bg-cyan-500') : 'bg-cyan-300'}
                `}
                style={{
                left: guide.type === 'vertical' ? `${guide.position}%` : 0,
                top: guide.type === 'horizontal' ? `${guide.position}%` : 0,
                }}
            >
               <div 
                 className="opacity-0 group-hover:opacity-100 cursor-pointer bg-red-500 text-white rounded-full p-0.5 absolute shadow-sm transition-opacity"
                 style={{ 
                    left: guide.type === 'vertical' ? '50%' : '2px', 
                    top: guide.type === 'vertical' ? '2px' : '50%',
                    transform: 'translate(-50%, -50%)'
                 }}
                 onClick={(e) => {
                     e.stopPropagation();
                     onRemoveGuide(guide.id);
                 }}
                 title="Remove Guide"
               >
                 <X size={8} />
               </div>
            </div>
            ))}

            {/* --- ACTIVE SNAP LINES --- */}
            {activeSnapLines.x !== null && (
              <div className="absolute top-0 bottom-0 border-l border-green-500 z-40 pointer-events-none" style={{ left: `${activeSnapLines.x}%`, width: 1 }} />
            )}
            {activeSnapLines.y !== null && (
              <div className="absolute left-0 right-0 border-t border-green-500 z-40 pointer-events-none" style={{ top: `${activeSnapLines.y}%`, height: 1 }} />
            )}

            {/* --- FIELDS --- */}
            {fields.map((field) => {
            const isSelected = selectedFieldIds.includes(field.id);
            let transformX = '-50%';
            if (field.align === 'left') transformX = '0%';
            if (field.align === 'right') transformX = '-100%';

            return (
                <div
                key={field.id}
                className={`absolute cursor-move group select-none
                    ${isSelected ? 'z-50' : 'z-20 hover:z-30'}
                `}
                style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    transform: `translate(${transformX}, -50%)`,
                    fontFamily: field.fontFamily,
                    fontSize: `${field.fontSize * visualScale}px`, 
                    color: field.color,
                    textAlign: field.align === 'justify' ? 'justify' : field.align,
                    fontWeight: field.fontWeight === 'bold' ? 700 : 400,
                    fontStyle: field.fontStyle,
                    borderBottom: field.textDecoration === 'underline' ? `1px solid ${field.color}` : 'none',
                    paddingLeft: field.underlinePadding ? '0.5em' : '0',
                    paddingRight: field.underlinePadding ? '0.5em' : '0',
                    whiteSpace: 'nowrap',
                }}
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => handleFieldMouseDown(e, field)}
                >
                <div className={`relative px-1 ${isSelected ? 'border-2 border-blue-500' : 'border border-transparent hover:border-blue-300 hover:border-dashed'}`}>
                    {field.value || field.label}
                    {isSelected && selectedFieldIds.length === 1 && (
                        <div className="absolute -top-9 right-0 flex gap-1 bg-white p-1 rounded shadow-md border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                            <button className="p-1 hover:bg-blue-50 text-blue-600 rounded" onClick={(e) => { e.stopPropagation(); onDuplicateField(field.id); }}><Copy size={12} /></button>
                            <button className="p-1 hover:bg-red-50 text-red-600 rounded" onClick={(e) => { e.stopPropagation(); onRemoveField(field.id); }}><Trash2 size={12} /></button>
                        </div>
                    )}
                </div>
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};