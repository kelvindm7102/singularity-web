'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { PlayCircle, Library, ListMusic } from 'lucide-react';
import clsx from 'clsx';

import { useRoomStore } from '@/stores/roomStore';
import { LogOut } from 'lucide-react';

const navItems = [
  { label: 'Now Playing', href: '/control', icon: PlayCircle, mobileOnly: false },
  { label: 'Queue', href: '/control/queue', icon: ListMusic, mobileOnly: false },
  { label: 'Library', href: '/control/library', icon: Library, mobileOnly: false },
];

export function Navigation() {
  const pathname = usePathname();
  const { roomId, connectionStatus, leaveControlRoom } = useRoomStore();

  return (
    <nav className="flex md:flex-col justify-around md:justify-between items-center md:items-start bg-space-900/90 backdrop-blur-md border-t md:border-t-0 md:border-r border-cyan-500/20 p-2 pt-0 md:pt-6 md:p-6 w-full md:w-64 shrink-0 md:h-full z-50">
      <div className="w-full flex md:flex-col justify-between md:justify-start items-center md:items-start">
        <div className="hidden md:block mb-8 w-full">
          <h2 className="text-text-primary font-display uppercase tracking-widest text-lg flex items-center gap-2">
            <div className="w-1.5 h-4 bg-cyan-500 shadow-[0_0_8px_rgba(24,216,255,0.8)]" />
            Control
          </h2>
        </div>
        
        <div className="flex md:flex-col w-full">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex flex-col md:flex-row items-center gap-1 md:gap-4 p-2 md:p-3 md:mb-2 w-full transition-all duration-500",
                  isActive 
                    ? "text-cyan-500 md:bg-cyan-500/10 border-b-2 md:border-l-2 border-cyan-500 shadow-[inset_0_0_10px_rgba(24,216,255,0.05)]"
                    : "text-text-secondary hover:text-text-primary hover:bg-white/5"
                )}
              >
                <Icon className={clsx("w-6 h-6 md:w-5 md:h-5", isActive ? "drop-shadow-[0_0_8px_rgba(24,216,255,0.8)]" : "")} />
                <span className="text-[10px] md:text-sm font-body uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
          <Link
            href={'#'}
            onClick={leaveControlRoom}
            className={clsx(
              "flex flex-col md:flex-row items-center gap-1 md:gap-4 p-2 md:p-3 md:mb-2 w-full transition-all duration-200 text-text-secondary hover:text-red-400 hover:bg-red-400/5"
            )}
          >
            <LogOut className={clsx("w-6 h-6 md:w-5 md:h-5", "")} />
            <span className="text-[10px] md:text-sm font-body uppercase tracking-wider">{"Leave room"}</span>
          </Link>
        </div>
      </div>

      {/* System Status (§40) */}
      {roomId && (
        <div className="hidden md:flex flex-col gap-2 w-full pt-4 border-t border-cyan-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${connectionStatus === 'connected' ? 'bg-cyan-500 shadow-[0_0_6px_rgba(24,216,255,0.8)] animate-pulse' : 'bg-yellow-500'}`} />
              <span className="font-mono text-xs text-text-secondary uppercase tracking-wider">
                <div>ROOM:</div> <strong className="text-text-primary">{roomId}</strong>
              </span>
            </div>
            <button
              onClick={() => leaveControlRoom()}
              className="text-text-secondary hover:text-red-400 p-1 transition-colors"
              title="Leave Room"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
