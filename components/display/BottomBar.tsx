'use client';

import { useUiStore } from '@/stores/uiStore';
import { QrCode } from 'lucide-react';

export default function BottomBar() {
  const setConnectOverlayOpen = useUiStore((state) => state.setConnectOverlayOpen);

  return (
    <div className="absolute bottom-0 inset-x-0 p-8 flex justify-end items-end pointer-events-none z-40">
      <div className="pointer-events-auto">
        <button
          onClick={() => setConnectOverlayOpen(true)}
          className="p-4 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full transition-all duration-300 group"
          title="Show Room QR Code"
        >
          <QrCode className="w-6 h-6 text-white/70 group-hover:text-white" />
        </button>
      </div>
    </div>
  );
}
