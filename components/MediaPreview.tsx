import React, { useEffect, useCallback } from 'react';
import { MediaFile } from '../types';

interface MediaPreviewProps {
  media: MediaFile[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

const MediaPreview: React.FC<MediaPreviewProps> = ({ media, currentIndex, onClose, onNavigate }) => {
  const current = media[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < media.length - 1;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowLeft' && hasPrev) onNavigate(currentIndex - 1);
    if (e.key === 'ArrowRight' && hasNext) onNavigate(currentIndex + 1);
  }, [onClose, onNavigate, currentIndex, hasPrev, hasNext]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="relative w-full h-full flex items-center justify-center p-8" onClick={(e) => e.stopPropagation()}>
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>

        {/* Counter */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 text-white/70 text-sm font-bold tracking-widest">
          {currentIndex + 1} / {media.length}
        </div>

        {/* Prev */}
        {hasPrev && (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex - 1); }}
            className="absolute left-6 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
          </button>
        )}

        {/* Next */}
        {hasNext && (
          <button
            onClick={(e) => { e.stopPropagation(); onNavigate(currentIndex + 1); }}
            className="absolute right-6 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all"
          >
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
          </button>
        )}

        {/* Content */}
        <div className="max-w-[85vw] max-h-[85vh] flex items-center justify-center">
          {current.type === 'image' && (
            <img src={current.url} alt={current.name} className="max-w-full max-h-[85vh] object-contain rounded-2xl shadow-2xl" />
          )}
          {current.type === 'video' && (
            <video src={current.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl" />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaPreview;
