import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import MusicPlayer from '@/components/MusicPlayer';
import ImageViewer from '@/components/ImageViewer';
import FileManager, { FileItem, FileSystem } from '@/components/FileManager';

interface TermLine {
  id: number;
  type: 'input' | 'output' | 'error' | 'success' | 'info' | 'separator';
  text: string;
  timestamp?: string;
}

interface Track { name: string; url: string; }
interface ImageItem { name: string; url: string; }

const INITIAL_FS: FileSystem = {
  '/': [
    { name: 'музыка', type: 'dir' },
    { name: 'фото', type: 'dir' },
    { name: 'документы', type: 'dir' },
    { name: 'README.txt', type: 'file', size: 512 },
    { name: 'config.json', type: 'file', size: 128 },
  ],
  '/музыка': [
    { name: 'playlist.m3u', type: 'file', size: 256 },
  ],
  '/фото': [
    { name: 'sample.jpg', type: 'file', size: 204800 },
  ],
  '/документы': [
    { name: 'заметки.txt', type: 'file', size: 1024 },
    { name: 'задачи.md', type: 'file', size: 2048 },
  ],
};

const HELP_TEXT = `┌─────────────────────────────────────────────────┐
│              TERM v1.0 — СПРАВКА                │
└─────────────────────────────────────────────────┘
  TERM.Start          — запустить приложение
  ls / dir            — список файлов
  cd [папка]          — перейти в папку
  cd ..               — выйти из папки
  mkdir [имя]         — создать папку
  find [запрос]       — поиск файлов
  play [файл.mp3]     — воспроизвести MP3
  view [файл.img]     — просмотр картинки
  files               — показать файловый менеджер
  player              — показать плеер
  viewer              — показать просмотрщик картинок
  clear               — очистить экран
  help                — эта справка`;

let idCounter = 0;
const mkLine = (type: TermLine['type'], text: string): TermLine => ({
  id: ++idCounter,
  type,
  text,
  timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
});

export default function Index() {
  const [lines, setLines] = useState<TermLine[]>([
    mkLine('info', '╔══════════════════════════════════════════════════╗'),
    mkLine('info', '║         TERM v1.0 — Командная Утилита           ║'),
    mkLine('info', '║     Введите "help" для списка команд            ║'),
    mkLine('info', '╚══════════════════════════════════════════════════╝'),
    mkLine('success', 'Система инициализирована. Добро пожаловать.'),
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [currentPath, setCurrentPath] = useState('/');
  const [fs, setFs] = useState<FileSystem>(INITIAL_FS);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [showFiles, setShowFiles] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showViewer, setShowViewer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [clock, setClock] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('ru-RU'));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLine = (type: TermLine['type'], text: string) => {
    setLines(prev => [...prev, mkLine(type, text)]);
  };

  const addLines = (items: Array<[TermLine['type'], string]>) => {
    const newLines = items.map(([t, s]) => mkLine(t, s));
    setLines(prev => [...prev, ...newLines]);
  };

  const getFiles = (path: string): FileItem[] => fs[path] || [];

  const pathJoin = (base: string, name: string) => {
    if (base === '/') return '/' + name;
    return base + '/' + name;
  };

  const executeCommand = (raw: string) => {
    const cmd = raw.trim();
    if (!cmd) return;

    addLine('input', `${currentPath}> ${cmd}`);
    setHistory(h => [cmd, ...h.slice(0, 49)]);
    setHistoryIdx(-1);

    const [command, ...args] = cmd.split(' ');
    const arg = args.join(' ').trim();
    const lower = command.toLowerCase();

    if (lower === 'term.start') {
      if (started) { addLine('error', 'TERM уже запущен'); return; }
      setStarted(true);
      addLines([
        ['success', '▶ TERM.Start — инициализация...'],
        ['info', '  ├── Загрузка модулей файловой системы... OK'],
        ['info', '  ├── Инициализация аудио-движка... OK'],
        ['info', '  ├── Подключение просмотрщика изображений... OK'],
        ['info', '  └── Все системы запущены.'],
        ['success', '✓ TERM успешно запущен!'],
      ]);
      setShowFiles(true);
      return;
    }

    if (lower === 'help') { addLine('info', HELP_TEXT); return; }

    if (lower === 'clear') { setLines([]); return; }

    if (lower === 'ls' || lower === 'dir') {
      const files = getFiles(currentPath);
      if (files.length === 0) { addLine('info', '(пусто)'); return; }
      addLine('info', `Содержимое: ${currentPath}`);
      files.forEach(f => {
        const size = f.size ? `  ${(f.size / 1024).toFixed(1)}K` : '';
        const icon = f.type === 'dir' ? '📁' : '▪';
        addLine(f.type === 'dir' ? 'success' : 'output', `  ${icon} ${f.name}${size}`);
      });
      addLine('info', `  итого: ${files.length} элем.`);
      return;
    }

    if (lower === 'cd') {
      if (!arg) { addLine('error', 'укажите папку: cd [имя]'); return; }
      if (arg === '..') {
        if (currentPath === '/') { addLine('error', 'уже в корне'); return; }
        const parts = currentPath.split('/').filter(Boolean);
        parts.pop();
        const newPath = parts.length === 0 ? '/' : '/' + parts.join('/');
        setCurrentPath(newPath);
        addLine('success', `→ ${newPath}`);
        return;
      }
      const newPath = pathJoin(currentPath, arg);
      const files = getFiles(currentPath);
      const dir = files.find(f => f.name === arg && f.type === 'dir');
      if (!dir) { addLine('error', `папка не найдена: ${arg}`); return; }
      if (!fs[newPath]) setFs(prev => ({ ...prev, [newPath]: [] }));
      setCurrentPath(newPath);
      addLine('success', `→ ${newPath}`);
      return;
    }

    if (lower === 'mkdir') {
      if (!arg) { addLine('error', 'укажите имя: mkdir [имя]'); return; }
      const files = getFiles(currentPath);
      if (files.find(f => f.name === arg)) { addLine('error', `уже существует: ${arg}`); return; }
      const newDir: FileItem = { name: arg, type: 'dir' };
      const newPath = pathJoin(currentPath, arg);
      setFs(prev => ({
        ...prev,
        [currentPath]: [...(prev[currentPath] || []), newDir],
        [newPath]: [],
      }));
      addLine('success', `✓ папка создана: ${arg}`);
      return;
    }

    if (lower === 'find') {
      if (!arg) { addLine('error', 'укажите запрос: find [запрос]'); return; }
      addLine('info', `🔍 поиск: "${arg}"`);
      const results: string[] = [];
      const searchIn = (path: string) => {
        const files = fs[path] || [];
        files.forEach(f => {
          if (f.name.toLowerCase().includes(arg.toLowerCase())) {
            results.push(pathJoin(path, f.name));
          }
          if (f.type === 'dir') searchIn(pathJoin(path, f.name));
        });
      };
      searchIn('/');
      if (results.length === 0) { addLine('info', '  ничего не найдено'); }
      else results.forEach(r => addLine('output', `  ▪ ${r}`));
      addLine('info', `  найдено: ${results.length}`);
      return;
    }

    if (lower === 'play') {
      if (!arg) { addLine('error', 'укажите файл: play [файл.mp3]'); return; }
      addLine('info', `♪ загрузка трека: ${arg}`);
      const url = URL.createObjectURL(new Blob([], { type: 'audio/mpeg' }));
      setTracks(prev => [...prev, { name: arg, url }]);
      addLine('success', `✓ трек добавлен: ${arg}`);
      setShowPlayer(true);
      return;
    }

    if (lower === 'view') {
      if (!arg) { addLine('error', 'укажите файл: view [файл]'); return; }
      addLine('info', `◉ загрузка изображения: ${arg}`);
      const placeholder = `https://picsum.photos/seed/${encodeURIComponent(arg)}/400/300`;
      setImages(prev => [...prev, { name: arg, url: placeholder }]);
      addLine('success', `✓ изображение открыто: ${arg}`);
      setShowViewer(true);
      return;
    }

    if (lower === 'files') { setShowFiles(v => !v); addLine('info', showFiles ? '▤ файловый менеджер скрыт' : '▤ файловый менеджер открыт'); return; }
    if (lower === 'player') { setShowPlayer(v => !v); addLine('info', showPlayer ? '♪ плеер скрыт' : '♪ плеер открыт'); return; }
    if (lower === 'viewer') { setShowViewer(v => !v); addLine('info', showViewer ? '◉ просмотрщик скрыт' : '◉ просмотрщик открыт'); return; }

    addLine('error', `неизвестная команда: "${command}". Введите "help"`);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      executeCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const next = Math.min(historyIdx + 1, history.length - 1);
      setHistoryIdx(next);
      setInput(history[next] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const next = Math.max(historyIdx - 1, -1);
      setHistoryIdx(next);
      setInput(next === -1 ? '' : history[next]);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const commands = ['help', 'clear', 'ls', 'dir', 'cd ', 'mkdir ', 'find ', 'play ', 'view ', 'files', 'player', 'viewer', 'TERM.Start'];
      const match = commands.find(c => c.toLowerCase().startsWith(input.toLowerCase()) && c.toLowerCase() !== input.toLowerCase());
      if (match) setInput(match);
    }
  };

  const handleFileSelect = (file: FileItem) => {
    setSelectedFile(file.name);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === 'mp3') {
      const url = URL.createObjectURL(new Blob([], { type: 'audio/mpeg' }));
      setTracks(prev => [...prev.filter(t => t.name !== file.name), { name: file.name, url }]);
      setShowPlayer(true);
      addLine('success', `♪ трек открыт: ${file.name}`);
    } else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext || '')) {
      const placeholder = `https://picsum.photos/seed/${encodeURIComponent(file.name)}/400/300`;
      setImages(prev => [...prev.filter(i => i.name !== file.name), { name: file.name, url: placeholder }]);
      setShowViewer(true);
      addLine('success', `◉ изображение открыто: ${file.name}`);
    } else {
      addLine('info', `▪ выбран файл: ${file.name}`);
    }
  };

  const lineColor = (type: TermLine['type']) => {
    switch (type) {
      case 'input': return 'var(--term-dim-green)';
      case 'success': return 'var(--term-green)';
      case 'error': return 'var(--term-red)';
      case 'info': return 'var(--term-muted)';
      case 'separator': return 'var(--term-border)';
      default: return 'var(--term-text)';
    }
  };

  return (
    <div
      className="scanline min-h-screen flex flex-col"
      style={{ background: 'var(--term-bg)', fontFamily: "'JetBrains Mono', monospace", height: '100vh' }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2 border-b flex-shrink-0"
        style={{ borderColor: 'var(--term-border)', background: 'var(--term-surface)' }}
      >
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full" style={{ background: '#ff5f57' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#28ca41' }} />
          </div>
          <span className="term-green glow-green text-sm font-bold tracking-widest">TERM v1.0</span>
          <span className="term-muted text-xs">— командная утилита</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={e => { e.stopPropagation(); setShowFiles(v => !v); }}
            className="text-xs px-2 py-0.5 border transition-all"
            style={{
              borderColor: showFiles ? 'var(--term-yellow)' : 'var(--term-border)',
              color: showFiles ? 'var(--term-yellow)' : 'var(--term-muted)',
              background: showFiles ? 'rgba(255,204,0,0.05)' : 'transparent',
            }}
          >▤ FILES</button>
          <button
            onClick={e => { e.stopPropagation(); setShowPlayer(v => !v); }}
            className="text-xs px-2 py-0.5 border transition-all"
            style={{
              borderColor: showPlayer ? 'var(--term-green)' : 'var(--term-border)',
              color: showPlayer ? 'var(--term-green)' : 'var(--term-muted)',
              background: showPlayer ? 'rgba(0,255,65,0.05)' : 'transparent',
            }}
          >♪ PLAYER</button>
          <button
            onClick={e => { e.stopPropagation(); setShowViewer(v => !v); }}
            className="text-xs px-2 py-0.5 border transition-all"
            style={{
              borderColor: showViewer ? 'var(--term-cyan)' : 'var(--term-border)',
              color: showViewer ? 'var(--term-cyan)' : 'var(--term-muted)',
              background: showViewer ? 'rgba(0,255,204,0.05)' : 'transparent',
            }}
          >◉ IMG</button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Terminal output */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto px-4 py-3">
            {lines.map(line => (
              <div
                key={line.id}
                className="text-xs leading-5 whitespace-pre-wrap break-words"
                style={{ color: lineColor(line.type) }}
              >
                {line.type === 'input' && (
                  <span className="mr-2 opacity-30 text-xs">[{line.timestamp}]</span>
                )}
                {line.text}
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div
            className="flex items-center border-t px-4 py-2.5 flex-shrink-0"
            style={{ borderColor: 'var(--term-border)', background: 'var(--term-surface)' }}
          >
            <span className="term-green glow-green text-xs mr-2 flex-shrink-0 font-bold">{currentPath}&gt;</span>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              className="flex-1 text-xs bg-transparent outline-none"
              style={{ color: 'var(--term-text)', caretColor: 'var(--term-green)' }}
              placeholder="введите команду... (help — справка)"
              autoComplete="off"
              spellCheck={false}
            />
            <span className="cursor-blink" style={{ color: 'var(--term-green)', fontSize: 14 }}>█</span>
          </div>
        </div>

        {/* Side panels */}
        {(showFiles || showPlayer || showViewer) && (
          <div
            className="flex flex-col gap-0 border-l overflow-y-auto flex-shrink-0"
            style={{ borderColor: 'var(--term-border)', width: 360, background: 'var(--term-bg)' }}
            onClick={e => e.stopPropagation()}
          >
            {showFiles && (
              <div className="border-b" style={{ borderColor: 'var(--term-border)' }}>
                <FileManager
                  currentPath={currentPath}
                  files={getFiles(currentPath)}
                  onNavigate={name => {
                    const newPath = pathJoin(currentPath, name);
                    if (!fs[newPath]) setFs(prev => ({ ...prev, [newPath]: [] }));
                    setCurrentPath(newPath);
                    addLine('success', `→ ${newPath}`);
                  }}
                  onGoBack={() => {
                    const parts = currentPath.split('/').filter(Boolean);
                    parts.pop();
                    const newPath = parts.length === 0 ? '/' : '/' + parts.join('/');
                    setCurrentPath(newPath);
                    addLine('success', `→ ${newPath}`);
                  }}
                  onSelect={handleFileSelect}
                  selectedFile={selectedFile}
                />
              </div>
            )}

            {showPlayer && (
              <div className="border-b" style={{ borderColor: 'var(--term-border)' }}>
                <MusicPlayer tracks={tracks} onClose={() => setShowPlayer(false)} />
              </div>
            )}

            {showViewer && (
              <ImageViewer images={images} onClose={() => setShowViewer(false)} />
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-1 border-t flex-shrink-0"
        style={{ borderColor: 'var(--term-border)', background: '#0a0a0a' }}
      >
        <div className="flex items-center gap-4">
          <span className={`text-xs font-bold ${started ? 'term-green' : 'term-muted'}`}>
            {started ? '● RUNNING' : '○ IDLE'}
          </span>
          <span className="term-muted text-xs">{lines.length} строк</span>
          <span className="term-muted text-xs">{currentPath}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="term-muted text-xs">↑↓ история • TAB автодополнение</span>
          <span className="term-dim-green text-xs font-bold">{clock}</span>
        </div>
      </div>
    </div>
  );
}
