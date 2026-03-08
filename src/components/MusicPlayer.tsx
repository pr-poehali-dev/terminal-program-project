import { useState, useRef, useEffect } from 'react';
import Icon from '@/components/ui/icon';

interface Track {
  name: string;
  url: string;
}

interface MusicPlayerProps {
  tracks: Track[];
  onClose: () => void;
}

export default function MusicPlayer({ tracks, onClose }: MusicPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = tracks[currentIndex];

  useEffect(() => {
    if (!currentTrack) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(currentTrack.url);
    audioRef.current = audio;
    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    });
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration));
    audio.addEventListener('ended', () => {
      if (currentIndex < tracks.length - 1) setCurrentIndex(i => i + 1);
      else setIsPlaying(false);
    });
    if (isPlaying) audio.play();
    return () => { audio.pause(); };
  }, [currentIndex, currentTrack?.url]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const prev = () => setCurrentIndex(i => Math.max(0, i - 1));
  const next = () => setCurrentIndex(i => Math.min(tracks.length - 1, i + 1));

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const pct = x / rect.width;
    audioRef.current.currentTime = pct * duration;
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (tracks.length === 0) {
    return (
      <div className="border term-border border-solid p-3 animate-fade-in" style={{ borderColor: 'var(--term-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <span className="term-yellow text-xs font-bold">♪ PLAYER</span>
          <button onClick={onClose} className="term-muted hover:term-red text-xs transition-colors">✕</button>
        </div>
        <div className="term-muted text-xs">нет треков для воспроизведения</div>
        <div className="term-muted text-xs mt-1">загрузите mp3 файлы командой: <span className="term-green">play [файл.mp3]</span></div>
      </div>
    );
  }

  return (
    <div className="border term-border border-solid animate-fade-in glow-box" style={{ borderColor: 'var(--term-border)', minWidth: 320 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--term-border)' }}>
        <span className="term-yellow text-xs font-bold tracking-widest">♪ MUSIC PLAYER</span>
        <button onClick={onClose} className="term-muted hover:term-red text-xs transition-colors">✕</button>
      </div>

      <div className="px-3 py-3">
        <div className="mb-3">
          <div className="term-green text-xs font-bold truncate glow-green" style={{ maxWidth: 260 }}>
            {currentTrack?.name || 'нет трека'}
          </div>
          <div className="term-muted text-xs mt-0.5">
            трек {currentIndex + 1} / {tracks.length}
          </div>
        </div>

        <div
          className="w-full h-1 mb-2 cursor-pointer relative"
          style={{ background: 'var(--term-border)' }}
          onClick={seek}
        >
          <div
            className="h-full transition-all"
            style={{ width: `${progress}%`, background: 'var(--term-green)' }}
          />
        </div>

        <div className="flex justify-between term-muted text-xs mb-3">
          <span>{fmt(currentTime)}</span>
          <span>{fmt(duration)}</span>
        </div>

        <div className="flex items-center justify-center gap-4">
          <button
            onClick={prev}
            disabled={currentIndex === 0}
            className="term-muted hover:term-green transition-colors disabled:opacity-30 text-lg"
          >⏮</button>
          <button
            onClick={togglePlay}
            className="term-green hover:glow-green transition-all text-2xl font-bold"
            style={{ textShadow: '0 0 8px var(--term-green)' }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={next}
            disabled={currentIndex === tracks.length - 1}
            className="term-muted hover:term-green transition-colors disabled:opacity-30 text-lg"
          >⏭</button>
        </div>
      </div>

      {tracks.length > 1 && (
        <div className="border-t px-3 py-2" style={{ borderColor: 'var(--term-border)' }}>
          {tracks.map((t, i) => (
            <div
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`text-xs py-0.5 cursor-pointer truncate transition-colors ${i === currentIndex ? 'term-green' : 'term-muted hover:term-dim-green'}`}
              style={{ maxWidth: 300 }}
            >
              {i === currentIndex ? '▶ ' : '  '}{t.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
