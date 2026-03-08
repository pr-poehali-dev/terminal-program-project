import { useState } from 'react';

export interface FileItem {
  name: string;
  type: 'file' | 'dir';
  size?: number;
  ext?: string;
}

export interface FileSystem {
  [path: string]: FileItem[];
}

interface FileManagerProps {
  currentPath: string;
  files: FileItem[];
  onNavigate: (name: string) => void;
  onGoBack: () => void;
  onSelect: (file: FileItem) => void;
  selectedFile: string | null;
}

const fileIcon = (f: FileItem) => {
  if (f.type === 'dir') return '📁';
  const ext = f.name.split('.').pop()?.toLowerCase();
  if (ext === 'mp3') return '♪';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext || '')) return '◉';
  if (['txt', 'md', 'log'].includes(ext || '')) return '▤';
  if (['js', 'ts', 'py', 'sh', 'json'].includes(ext || '')) return '◈';
  return '▪';
};

const fileColor = (f: FileItem) => {
  if (f.type === 'dir') return 'var(--term-yellow)';
  const ext = f.name.split('.').pop()?.toLowerCase();
  if (ext === 'mp3') return 'var(--term-green)';
  if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) return 'var(--term-cyan)';
  if (['js', 'ts', 'py', 'sh'].includes(ext || '')) return 'var(--term-blue)';
  return 'var(--term-text)';
};

const fmtSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  return `${(bytes / 1024 / 1024).toFixed(1)}M`;
};

export default function FileManager({ currentPath, files, onNavigate, onGoBack, onSelect, selectedFile }: FileManagerProps) {
  const [search, setSearch] = useState('');

  const filtered = search
    ? files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()))
    : files;

  return (
    <div className="border border-solid animate-fade-in" style={{ borderColor: 'var(--term-border)', minWidth: 400 }}>
      <div className="flex items-center gap-2 px-3 py-2 border-b" style={{ borderColor: 'var(--term-border)' }}>
        <span className="term-yellow text-xs font-bold tracking-widest">▤ FILES</span>
        <span className="term-muted text-xs">|</span>
        <span className="term-green text-xs truncate" style={{ maxWidth: 260 }}>{currentPath}</span>
      </div>

      <div className="flex items-center border-b px-3 py-1.5" style={{ borderColor: 'var(--term-border)' }}>
        <span className="term-muted text-xs mr-2">🔍</span>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="поиск..."
          className="text-xs flex-1"
          style={{ color: 'var(--term-text)', background: 'transparent' }}
        />
        {search && (
          <button onClick={() => setSearch('')} className="term-muted hover:term-red text-xs ml-2">✕</button>
        )}
      </div>

      <div style={{ maxHeight: 260, overflowY: 'auto' }}>
        {currentPath !== '/' && (
          <div
            onClick={onGoBack}
            className="file-row flex items-center gap-2 px-3 py-1.5 cursor-pointer border-b"
            style={{ borderColor: 'var(--term-border)' }}
          >
            <span style={{ color: 'var(--term-yellow)' }} className="text-xs w-4">↩</span>
            <span className="term-muted text-xs">..</span>
          </div>
        )}

        {filtered.length === 0 && (
          <div className="px-3 py-3 term-muted text-xs">
            {search ? `ничего не найдено по "${search}"` : 'папка пуста'}
          </div>
        )}

        {filtered.map((f, i) => (
          <div
            key={i}
            onClick={() => f.type === 'dir' ? onNavigate(f.name) : onSelect(f)}
            className={`file-row flex items-center gap-2 px-3 py-1.5 cursor-pointer border-b ${selectedFile === f.name ? 'selected' : ''}`}
            style={{ borderColor: 'rgba(34,34,34,0.5)', animationDelay: `${i * 0.02}s` }}
          >
            <span style={{ color: fileColor(f) }} className="text-xs w-4 flex-shrink-0">
              {fileIcon(f)}
            </span>
            <span
              className="text-xs flex-1 truncate"
              style={{ color: fileColor(f) }}
            >{f.name}</span>
            {f.size && (
              <span className="term-muted text-xs flex-shrink-0">{fmtSize(f.size)}</span>
            )}
            {f.type === 'dir' && (
              <span className="term-muted text-xs flex-shrink-0">→</span>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-3 py-1.5 border-t" style={{ borderColor: 'var(--term-border)' }}>
        <span className="term-muted text-xs">{filtered.length} элем.</span>
        {search && <span className="term-cyan text-xs">фильтр: {search}</span>}
      </div>
    </div>
  );
}
