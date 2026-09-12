'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useRoomStore } from '@/stores/roomStore';

export default function IdleScreen() {
  const roomId = useRoomStore((state) => state.roomId);
  const connectionStatus = useRoomStore((state) => state.connectionStatus);

  if (connectionStatus !== 'connected' || !roomId) return null;

  const controlUrl = `${window.location.origin}/control?room=${roomId}`;

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-16 p-8 animate-in fade-in duration-700 font-mono">
      <div className="text-center md:text-right space-y-6 max-w-lg">
        <h1 className="text-4xl font-bold tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] uppercase">
          [ SYSTEM IDLE ]
        </h1>
        <p className="text-sm text-cyan-100/50 uppercase tracking-widest leading-relaxed">
          Awaiting connection...<br/>
          Scan the visual code to authorize control unit and establish link.
        </p>
        <div className="pt-8">
          <div 
            className="inline-block px-8 py-4 bg-cyan-950/30 border border-cyan-500/30 backdrop-blur-md relative"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%)' }}
          >
            <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-cyan-400"></div>
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-cyan-400"></div>
            <span className="text-xs text-cyan-400/70 uppercase tracking-widest block mb-2">Access Code</span>
            <span className="text-5xl font-bold tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{roomId}</span>
          </div>
        </div>
      </div>
      
      <div 
        className="p-6 bg-cyan-950/30 border border-cyan-500/30 backdrop-blur-md relative"
        style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
      >
        <div className="bg-white p-2">
          <QRCodeSVG 
            value={controlUrl} 
            size={280}
            level="H"
            includeMargin={false}
          />
        </div>
      </div>
    </div>
  );
}
