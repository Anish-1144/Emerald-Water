'use client';

import { useRef } from 'react';
import { X } from 'lucide-react';

interface ImageCropModalProps {
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedImage: string) => void;
  aspectRatio?: number;
}

export default function ImageCropModal({ imageSrc, onClose, onSave }: ImageCropModalProps) {
  const imageRef = useRef<HTMLImageElement>(null);

  const handleSave = () => {
    onSave(imageSrc);
    onClose();
  };


  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#2A2A2A] rounded-xl border border-white/10 w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Upload Image</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Container */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-[#1E1E1E]">
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Upload"
            className="max-w-full max-h-full rounded-lg"
          />
        </div>

        {/* Controls */}
        <div className="p-4 border-t border-white/10">
          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 border border-white/20 text-white rounded-lg hover:bg-white/10 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 bg-[#4DB64F] text-white rounded-lg hover:bg-[#45a049] transition-colors font-medium"
            >
              Apply
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

