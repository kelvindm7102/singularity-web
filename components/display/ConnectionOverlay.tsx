'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useRoomStore } from '@/stores/roomStore';
import { useUiStore } from '@/stores/uiStore';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export default function ConnectionOverlay() {
  const roomId = useRoomStore((state) => state.roomId);
  const connectOverlayOpen = useUiStore((state) => state.connectOverlayOpen);
  const setConnectOverlayOpen = useUiStore((state) => state.setConnectOverlayOpen);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !connectOverlayOpen || !roomId) return null;

  const controlUrl = `${window.location.origin}/control?room=${roomId}`;

  return (
    <div className="absolute inset-0 bg-[#050510]/90 backdrop-blur-md flex flex-col items-center justify-center z-50 text-white font-mono animate-in fade-in duration-500">
      <div 
        className="relative bg-cyan-950/20 p-12 border border-cyan-500/30 flex flex-col items-center gap-8 backdrop-blur-xl"
        style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)' }}
      >
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>

        <button 
          onClick={() => setConnectOverlayOpen(false)}
          className="absolute top-6 right-6 p-2 text-cyan-500/70 hover:text-cyan-400 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold tracking-[0.2em] text-cyan-400 uppercase drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">[ LINK PROTOCOL ]</h2>
          <p className="text-xs text-cyan-100/50 uppercase tracking-widest">Authorize secondary control unit</p>
        </div>
        
        <div className="bg-white p-4">
          <QRCodeSVG 
            value={controlUrl} 
            size={240}
            level="H"
            includeMargin={true}
          />
        </div>

        <div className="text-center">
          <div className="text-xs text-cyan-500/70 uppercase tracking-widest mb-2">Room Authorization Code</div>
          <div className="text-5xl font-bold tracking-[0.2em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
            {roomId}
          </div>
        </div>
      </div>
    </div>
  );
}
