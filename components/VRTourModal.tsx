import React, { useState } from 'react';
import { CloseIcon } from './icons/NavIcons';
import { CubeTransparentIcon, GlobeAltIcon } from '@heroicons/react/24/outline';
import Property3DScene from './three/Property3DScene';
import type { Property } from '../types';

interface VRTourModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  property?: Property | null;
}

const VRTourModal: React.FC<VRTourModalProps> = ({ isOpen, onClose, url, property }) => {
  const [viewMode, setViewMode] = useState<'3d-twin' | 'embed'>('3d-twin');

  if (!isOpen) return null;

  const hasExternalEmbed = Boolean(url && url.trim().length > 0 && url.startsWith('http'));

  return (
    <div
      className="fixed inset-0 bg-slate-950/95 flex flex-col z-[130] p-3 sm:p-4 animate-fade-in"
      onClick={onClose}
    >
      <header
        className="flex items-center justify-between w-full mb-2.5 flex-shrink-0 gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('3d-twin')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              viewMode === '3d-twin'
                ? 'bg-amber-400 text-slate-950'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <CubeTransparentIcon className="w-4 h-4" />
            <span>Interactive 3D Architectural Twin</span>
          </button>

          {hasExternalEmbed && (
            <button
              type="button"
              onClick={() => setViewMode('embed')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                viewMode === 'embed'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              <GlobeAltIcon className="w-4 h-4" />
              <span>External 360° Walkthrough</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close 3D Tour"
          className="p-2 rounded-full text-white bg-white/10 hover:bg-white/20 transition-colors"
        >
          <CloseIcon className="w-5 h-5" />
        </button>
      </header>

      <div
        className="flex-grow w-full h-full rounded-2xl overflow-hidden border border-white/10 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {viewMode === '3d-twin' || !hasExternalEmbed ? (
          <Property3DScene property={property || null} />
        ) : (
          <iframe
            src={url}
            title="Virtual Reality Tour"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; xr-spatial-tracking"
            allowFullScreen
            className="w-full h-full"
          />
        )}
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fadeIn 0.25s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default VRTourModal;