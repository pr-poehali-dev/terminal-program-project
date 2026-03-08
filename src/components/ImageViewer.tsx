import { useState } from 'react';

interface ImageItem {
  name: string;
  url: string;
}

interface ImageViewerProps {
  images: ImageItem[];
  onClose: () => void;
}

export default function ImageViewer({ images, onClose }: ImageViewerProps) {
  const [current, setCurrent] = useState(0);
  const [zoom, setZoom] = useState(1);

  if (images.length === 0) {
    return (
      <div className="border border-solid p-3 animate-fade-in" style={{ borderColor: 'var(--term-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="term-cyan text-xs font-bold">◉ IMAGE VIEWER</span>
          <button onClick={onClose} className="term-muted hover:term-red text-xs transition-colors">✕</button>
        </div>
        <div className="term-muted text-xs">нет изображений для отображения</div>
        <div className="term-muted text-xs mt-1">откройте картинку командой: <span className="term-green">view [файл.png]</span></div>
      </div>
    );
  }

  const img = images[current];

  return (
    <div className="border border-solid animate-fade-in" style={{ borderColor: 'var(--term-border)', minWidth: 320 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--term-border)' }}>
        <span className="term-cyan text-xs font-bold tracking-widest">◉ IMAGE VIEWER</span>
        <div className="flex items-center gap-3">
          <button onClick={() => setZoom(z => Math.max(0.25, z - 0.25))} className="term-muted hover:term-cyan text-xs transition-colors">−</button>
          <span className="term-muted text-xs">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(4, z + 0.25))} className="term-muted hover:term-cyan text-xs transition-colors">+</button>
          <button onClick={() => setZoom(1)} className="term-muted hover:term-cyan text-xs transition-colors">1:1</button>
          <button onClick={onClose} className="term-muted hover:term-red text-xs transition-colors">✕</button>
        </div>
      </div>

      <div className="px-3 py-2 border-b flex items-center justify-between" style={{ borderColor: 'var(--term-border)' }}>
        <div className="term-cyan text-xs truncate" style={{ maxWidth: 220 }}>{img.name}</div>
        <div className="term-muted text-xs">{current + 1}/{images.length}</div>
      </div>

      <div
        className="overflow-auto flex items-center justify-center"
        style={{ height: 240, background: '#050505', cursor: 'zoom-in' }}
        onClick={() => setZoom(z => z === 1 ? 2 : 1)}
      >
        <img
          src={img.url}
          alt={img.name}
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            imageRendering: 'pixelated',
          }}
        />
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: 'var(--term-border)' }}>
          <button
            onClick={() => { setCurrent(i => Math.max(0, i - 1)); setZoom(1); }}
            disabled={current === 0}
            className="term-muted hover:term-cyan text-xs transition-colors disabled:opacity-30"
          >← PREV</button>
          <div className="flex gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrent(i); setZoom(1); }}
                className="w-1.5 h-1.5 rounded-none transition-colors"
                style={{ background: i === current ? 'var(--term-cyan)' : 'var(--term-border)' }}
              />
            ))}
          </div>
          <button
            onClick={() => { setCurrent(i => Math.min(images.length - 1, i + 1)); setZoom(1); }}
            disabled={current === images.length - 1}
            className="term-muted hover:term-cyan text-xs transition-colors disabled:opacity-30"
          >NEXT →</button>
        </div>
      )}
    </div>
  );
}
