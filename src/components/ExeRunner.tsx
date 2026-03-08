interface ExeApp {
  name: string;
  pid: number;
  startedAt: string;
  status: 'running' | 'stopped';
}

interface ExeRunnerProps {
  apps: ExeApp[];
  onKill: (pid: number) => void;
  onClose: () => void;
}

export default function ExeRunner({ apps, onKill, onClose }: ExeRunnerProps) {
  const running = apps.filter(a => a.status === 'running');
  const stopped = apps.filter(a => a.status === 'stopped');

  return (
    <div className="animate-fade-in" style={{ minWidth: 360 }}>
      <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: 'var(--term-border)' }}>
        <div className="flex items-center gap-2">
          <span style={{ color: 'var(--term-red)' }} className="text-xs font-bold tracking-widest">▶ ПРОЦЕССЫ</span>
          {running.length > 0 && (
            <span
              className="text-xs px-1.5 py-0 font-bold"
              style={{ background: 'rgba(255,68,68,0.15)', color: 'var(--term-red)', border: '1px solid rgba(255,68,68,0.3)' }}
            >{running.length}</span>
          )}
        </div>
        <button onClick={onClose} className="term-muted hover:term-red text-xs transition-colors">✕</button>
      </div>

      {apps.length === 0 && (
        <div className="px-3 py-4">
          <div className="term-muted text-xs">нет запущенных приложений</div>
          <div className="term-muted text-xs mt-1">запустите: <span style={{ color: 'var(--term-green)' }}>run [файл.exe]</span></div>
        </div>
      )}

      {running.length > 0 && (
        <div>
          <div className="px-3 py-1.5 border-b" style={{ borderColor: 'var(--term-border)' }}>
            <span className="term-muted text-xs tracking-widest">АКТИВНЫЕ</span>
          </div>
          {running.map(app => (
            <div
              key={app.pid}
              className="flex items-center justify-between px-3 py-2 border-b"
              style={{ borderColor: 'rgba(34,34,34,0.5)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'var(--term-green)', boxShadow: '0 0 4px var(--term-green)' }}
                  />
                  <span className="text-xs truncate" style={{ color: 'var(--term-text)', maxWidth: 180 }}>{app.name}</span>
                </div>
                <div className="flex items-center gap-3 mt-0.5 ml-3.5">
                  <span className="term-muted text-xs">PID:{app.pid}</span>
                  <span className="term-muted text-xs">{app.startedAt}</span>
                </div>
              </div>
              <button
                onClick={() => onKill(app.pid)}
                className="text-xs px-2 py-0.5 border transition-all ml-2 flex-shrink-0"
                style={{
                  borderColor: 'rgba(255,68,68,0.4)',
                  color: 'var(--term-red)',
                }}
                onMouseEnter={e => {
                  (e.target as HTMLElement).style.background = 'rgba(255,68,68,0.1)';
                }}
                onMouseLeave={e => {
                  (e.target as HTMLElement).style.background = 'transparent';
                }}
              >KILL</button>
            </div>
          ))}
        </div>
      )}

      {stopped.length > 0 && (
        <div>
          <div className="px-3 py-1.5 border-b border-t" style={{ borderColor: 'var(--term-border)' }}>
            <span className="term-muted text-xs tracking-widest">ЗАВЕРШЁННЫЕ</span>
          </div>
          {stopped.map(app => (
            <div
              key={app.pid}
              className="flex items-center gap-2 px-3 py-1.5 border-b opacity-40"
              style={{ borderColor: 'rgba(34,34,34,0.5)' }}
            >
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: 'var(--term-muted)' }} />
              <span className="text-xs truncate term-muted" style={{ maxWidth: 200 }}>{app.name}</span>
              <span className="term-muted text-xs ml-auto">PID:{app.pid}</span>
            </div>
          ))}
        </div>
      )}

      <div className="px-3 py-1.5 border-t" style={{ borderColor: 'var(--term-border)' }}>
        <span className="term-muted text-xs">
          kill [PID] — завершить процесс • ps — список
        </span>
      </div>
    </div>
  );
}
