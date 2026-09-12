'use client';

import React, { useEffect, useRef } from 'react';
import ConnectionOverlay from './ConnectionOverlay';
import ControlBar from './ControlBar';
import Sidebar from './Sidebar';
import OSD from './OSD';
import LyricsDisplay from './LyricsDisplay';
import { useUiStore } from '@/stores/uiStore';

export default function DisplayLayout({ children }: { children: React.ReactNode }) {
  const setControlsVisible = useUiStore((state) => state.setControlsVisible);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleActivity = () => {
      setControlsVisible(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setControlsVisible(false);
      }, 3000);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    
    // Initial activity
    handleActivity();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [setControlsVisible]);

  // Screen Wake Lock API to prevent device from sleeping while singing
  useEffect(() => {
    let wakeLock: any = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.error('Wake Lock error:', err);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      }
    };

    requestWakeLock();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLock !== null) {
        wakeLock.release().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black text-white cursor-default">
      {/* Background layer: cinematic deep space with subtle atmosphere (Point 67) */}
      <div className="absolute inset-0 z-0 bg-[#050510]">
        {/* Subtle atmosphere/nebula */}
        <div 
          className="absolute inset-0 opacity-40 mix-blend-screen"
          style={{
            background: 'radial-gradient(circle at 50% 50%, rgba(34, 211, 238, 0.15) 0%, rgba(147, 51, 234, 0.05) 50%, transparent 100%)'
          }}
        />
        {/* Tiny stars via background-image pattern */}
        <div 
          className="absolute inset-0 opacity-30 mix-blend-screen"
          style={{
            backgroundImage: 'radial-gradient(1px 1px at 20px 30px, #ffffff, rgba(0,0,0,0)), radial-gradient(1px 1px at 40px 70px, rgba(255,255,255,0.8), rgba(0,0,0,0)), radial-gradient(1px 1px at 90px 40px, rgba(255,255,255,0.6), rgba(0,0,0,0))',
            backgroundSize: '120px 120px'
          }}
        />
      </div>

      {/* Media/Lyrics layer */}
      <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
        <LyricsDisplay />
        {children}
      </div>

      {/* UI Overlays */}
      <Sidebar />
      <ControlBar />
      <ConnectionOverlay />
      <OSD />
    </div>
  );
}
