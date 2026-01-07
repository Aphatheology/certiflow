import React, { useEffect } from 'react';
import { Button } from './Button';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'primary';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'primary'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 flex gap-4">
           <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${type === 'danger' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
              <AlertTriangle size={20} />
           </div>
           <div className="flex-1 space-y-2">
              <h3 className="font-bold text-gray-800 text-lg leading-tight">{title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{message}</p>
           </div>
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} className="text-sm">{cancelText}</Button>
          <Button 
            variant={type === 'danger' ? 'danger' : 'primary'} 
            onClick={() => {
                onConfirm();
                onClose();
            }}
            className="text-sm"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};
