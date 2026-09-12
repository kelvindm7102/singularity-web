'use client';

import { useUiStore } from '@/stores/uiStore';

export default function OSD() {
  const { osdMessage, osdPriority } = useUiStore();

  if (!osdMessage) return null;

  const { title, content } = osdMessage;

  // Determine styles based on priority
  let colorClass = 'text-cyan-400 border-cyan-400/50 bg-cyan-900/20'; // low
  if (osdPriority === 'medium') {
    colorClass = 'text-yellow-400 border-yellow-400/50 bg-yellow-900/20';
  } else if (osdPriority === 'high') {
    colorClass = 'text-red-500 border-red-500/50 bg-red-900/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]';
  }

  const contentLines = Array.isArray(content) ? content : (content ? [content] : []);

  return (
    <div className="absolute top-8 right-8 z-50 pointer-events-none flex flex-col items-end">
      <div 
        className={`px-6 py-3 border-l-2 backdrop-blur-md animate-in slide-in-from-right-4 fade-in duration-300 font-mono tracking-widest ${colorClass}`}
        style={{
          clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)'
        }}
      >
        <div className="text-sm font-bold uppercase mb-1 flex items-center gap-2">
          <span className="opacity-50">[</span>
          {title}
          <span className="opacity-50">]</span>
        </div>
        {contentLines.map((line, i) => (
          <div key={i} className="text-xs text-white/80 uppercase">
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
