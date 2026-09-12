import { Metadata } from 'next';
import { Navigation } from '@/components/control/Navigation';
import { MiniPlayer } from '@/components/control/MiniPlayer';
import { ControlRoomManager } from '@/components/control/ControlRoomManager';

export const metadata: Metadata = {
  title: 'Control - Singularity',
  description: 'Singularity Room Remote Control',
};

export default function ControlLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse md:flex-row h-screen w-full bg-[#050914] overflow-hidden text-[#F2F7FF] selection:bg-[#2494FF]/30 font-body">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(14,26,48,0.5),rgba(5,9,20,1))]" />
        <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-[#18D8FF]/5 to-transparent mix-blend-screen" />
      </div>

      <Navigation />

      <main className="flex-1 flex flex-col h-full relative overflow-hidden z-10 w-full">
        <div className="absolute inset-0 overflow-auto">
          {children}
        </div>
        <MiniPlayer />
        <ControlRoomManager />
      </main>
    </div>
  );
}
