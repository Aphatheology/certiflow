import React, { useState, useEffect } from 'react';
import { Button } from './Button';
import { SavedProject } from '../types';
import { storageService } from '../services/storageService';
import { X, Save, FolderOpen, Trash2, Clock } from 'lucide-react';
import { ConfirmationModal } from './ConfirmationModal';
import { useToast } from './ToastProvider';

interface ProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: SavedProject | null;
  onLoadProject: (project: SavedProject) => void;
  onSaveCurrent: (name: string) => void;
}

export const ProjectsModal: React.FC<ProjectsModalProps> = ({ 
  isOpen, 
  onClose, 
  currentProject, 
  onLoadProject,
  onSaveCurrent 
}) => {
  const { showToast } = useToast();
  const [mode, setMode] = useState<'save' | 'load'>('load');
  const [saveName, setSaveName] = useState(currentProject?.name || '');
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setProjects(storageService.getAllProjects().sort((a, b) => b.updatedAt - a.updatedAt));
      if (currentProject) {
        setSaveName(currentProject.name);
      }
    }
  }, [isOpen, currentProject]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (!saveName.trim()) return;
    onSaveCurrent(saveName);
    onClose();
  };

  const confirmDelete = () => {
    if (deleteId) {
       storageService.deleteProject(deleteId);
       setProjects(prev => prev.filter(p => p.id !== deleteId));
       setDeleteId(null);
       showToast("Project deleted successfully", 'success');
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteId(id);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <div className="flex gap-4">
               <button 
                onClick={() => setMode('load')}
                className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${mode === 'load' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
               >
                 Load Project
               </button>
               <button 
                onClick={() => setMode('save')}
                className={`text-sm font-semibold pb-1 border-b-2 transition-colors ${mode === 'save' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
               >
                 Save Current
               </button>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>
          
          <div className="p-6 min-h-[300px] max-h-[60vh] overflow-y-auto">
            {mode === 'save' ? (
              <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Project Name</label>
                <input 
                  type="text" 
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  placeholder="e.g. Graphic Design Cohort 1"
                  className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  autoFocus
                />
                <div className="pt-4">
                  <Button onClick={handleSave} className="w-full" icon={<Save size={16} />}>
                    {currentProject ? 'Update Project' : 'Save New Project'}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.length === 0 ? (
                  <div className="text-center text-gray-400 py-10">
                    <FolderOpen size={48} className="mx-auto mb-2 opacity-50" />
                    <p>No saved projects found.</p>
                  </div>
                ) : (
                  projects.map(project => (
                    <div key={project.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all group">
                      <div className="flex items-center gap-3 overflow-hidden">
                         <div className="w-10 h-10 bg-gray-200 rounded bg-cover bg-center shrink-0" style={{ backgroundImage: project.imageUrl ? `url(${project.imageUrl})` : 'none' }}></div>
                         <div className="min-w-0">
                           <h4 className="font-medium text-gray-800 text-sm truncate">{project.name}</h4>
                           <div className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock size={10} />
                              {new Date(project.updatedAt).toLocaleDateString()}
                           </div>
                         </div>
                      </div>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          variant="secondary" 
                          className="px-2 py-1 h-auto text-xs" 
                          onClick={() => { onLoadProject(project); onClose(); }}
                        >
                          Load
                        </Button>
                        <button 
                          onClick={() => handleDeleteClick(project.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
        title="Delete Project"
        message="Are you sure you want to permanently delete this project? This action cannot be undone."
        type="danger"
        confirmText="Delete"
      />
    </>
  );
};