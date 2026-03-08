import { useState, useRef, useEffect, MutableRefObject } from 'react';

interface Track {
  name: string;
  url: string;
}

interface MusicPlayerProps {
  tracks: Track[];
  onClose: () => void;
  onLog?: (msg: string) => void;
  cmdRef?: MutableRefObject<((cmd: string) => void) | null>;
}

export default function MusicPlayer({ tracks, onClose, onLog, cmdRef }: MusicPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);
  const currentIndexRef = useRef(0);

  currentIndexRef.current = currentIndex;
  isPlayingRef.current = isPlaying;

  const currentTrack = tracks[currentIndex];

  useEffect(() => {
    if (!currentTrack) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(currentTrack.url);
    audioRef.current = audio;
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    });
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => {
      if (currentIndexRef.current < tracks.length - 1) {
        setCurrentIndex(i => i + 1);
      } else {
        setIsPlaying(false);
        onLog?.('♪ плейлист завершён');
      }
    });
    if (isPlayingRef.current) audio.play().catch(() => {});
    return () => { audio.pause(); };
  }, [currentIndex, currentTrack?.url]);

  useEffect(() => {
    if (tracks.length > 0 && currentIndex >= tracks.length) {
      setCurrentIndex(tracks.length - 1);
    }
  }, [tracks.length]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play().catch(() => {}); setIsPlaying(true); }
  };

  const prev = () => setCurrentIndex(i => Math.max(0, i - 1));
  const next = () => setCurrentIndex(i => Math.min(tracks.length - 1, i + 1));

  const stop = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!cmdRef) return;
    cmdRef.current = (cmd: string) => {
      switch (cmd) {
        case 'play':
          if (audioRef.current && !isPlayingRef.current) {
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
          }
          break;
        case 'pause':
          togglePlay();
          break;
        case 'stop':
          stop();
          break;
        case 'next':
          setCurrentIndex(i => {
            const ni = Math.min(tracks.length - 1, i + 1);
            onLog?.(`♪ трек: ${tracks[ni]?.name}`);
            return ni;
          });
          break;
        case 'prev':
          setCurrentIndex(i => {
            const ni = Math.max(0, i - 1);
            onLog?.(`♪ трек: ${tracks[ni]?.name}`);
            return ni;
          });
          break;
      }
    };
  }, [tracks, cmdRef]);

  if (tracks.length === 0) {
    return (
      <div className="animate-fade-in" style={{ minWidth: 320 }}>
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--term-border)' }}>
          <span className="text-xs font-bold tracking-widest" style={{ color: 'var(--term-yellow)' }}>♪ MUSIC PLAYER</span>
          <button onClick={onClose} className="term-muted hover:term-red text-xs transition-colors">✕</button>
        </div>
        <div className="px-3 py-3">
          <div className="term-muted text-xs">нет треков для воспроизведения</div>
          <div className="term-muted text-xs mt-1">добавьте командой: <span style={{ color: 'var(--term-green)' }}>play [файл.mp3]</span></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ minWidth: 320 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--term-border)' }}>
        <span className="text-xs font-bold tracking-widest" style={{ color: 'var(--term-yellow)' }}>♪ MUSIC PLAYER</span>
        <button onClick={onClose} className="term-muted hover:term-red text-xs transition-colors">✕</button>
      </div>

      <div className="px-3 py-3">
        <div className="mb-3">
          <div className="text-xs font-bold truncate glow-green" style={{ color: 'var(--term-green)', maxWidth: 280 }}>
            {isPlaying && <span className="mr-1" style={{ animation: 'blink 1s step-end infinite' }}>▶</span>}
            {currentTrack?.name || 'нет трека'}
          </div>
          <div className="term-muted text-xs mt-0.5">трек {currentIndex + 1} / {tracks.length}</div>
        </div>

        <div
          className="w-full h-1 mb-2 cursor-pointer"
          style={{ background: 'var(--term-border)' }}
          onClick={seek}
        >
          <div className="h-full" style={{ width: `${progress}%`, background: 'var(--term-green)', transition: 'width 0.1s linear' }} />
        </div>

        <div className="flex justify-between term-muted text-xs mb-3">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>

        <div className="flex items-center justify-center gap-5">
          <button onClick={prev} disabled={currentIndex === 0} className="term-muted hover:term-green transition-colors disabled:opacity-30 text-base">⏮</button>
          <button onClick={stop} className="term-muted hover:term-red transition-colors text-base">⏹</button>
          <button
            onClick={togglePlay}
            className="text-2xl font-bold transition-all"
            style={{ color: 'var(--term-green)', textShadow: isPlaying ? '0 0 8px var(--term-green)' : 'none' }}
          >{isPlaying ? '⏸' : '▶'}</button>
          <button onClick={next} disabled={currentIndex === tracks.length - 1} className="term-muted hover:term-green transition-colors disabled:opacity-30 text-base">⏭</button>
        </div>
      </div>

      <div className="border-t px-3 py-2" style={{ borderColor: 'var(--term-border)' }}>
        <div className="term-muted text-xs mb-1.5 tracking-widest">ОЧЕРЕДЬ</div>
        {tracks.map((t, i) => (
          <div
            key={i}
            onClick={() => { setCurrentIndex(i); if (!isPlaying) { setTimeout(() => { audioRef.current?.play().catch(() => {}); setIsPlaying(true); }, 50); } }}
            className="flex items-center gap-2 text-xs py-0.5 cursor-pointer truncate transition-colors"
            style={{ color: i === currentIndex ? 'var(--term-green)' : 'var(--term-muted)', maxWidth: 300 }}
          >
            <span className="flex-shrink-0 w-3">{i === currentIndex ? (isPlaying ? '▶' : '▷') : String(i + 1).padStart(2, '0')}</span>
            <span className="truncate">{t.name}</span>
          </div>
        ))}
        <div className="term-muted text-xs mt-2 pt-1 border-t" style={{ borderColor: 'var(--term-border)' }}>
          pause • stop • next • prev • playlist clear
        </div>
      </div>
    </div>
  );
}
