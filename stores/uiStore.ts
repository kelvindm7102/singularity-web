import { create } from 'zustand';

export type OsdPriority = 'low' | 'medium' | 'high';

export interface OsdMessageData {
  title: string;
  content?: string | string[];
}

interface UiState {
  sidebarOpen: boolean;
  controlsVisible: boolean;
  osdMessage: OsdMessageData | null;
  osdPriority: OsdPriority | null;
  connectOverlayOpen: boolean;
  activeDialog: string | null;
  
  // Actions
  setSidebarOpen: (open: boolean) => void;
  setControlsVisible: (visible: boolean) => void;
  showOsd: (title: string, content?: string | string[], priority?: OsdPriority, durationMs?: number) => void;
  setConnectOverlayOpen: (open: boolean) => void;
  setActiveDialog: (dialogId: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  controlsVisible: false,
  osdMessage: null,
  osdPriority: null,
  connectOverlayOpen: false,
  activeDialog: null,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setControlsVisible: (visible) => set({ controlsVisible: visible }),
  showOsd: (title, content, priority = 'low', durationMs = 3000) => {
    const newMessage = { title, content };
    set({ osdMessage: newMessage, osdPriority: priority });
    if (durationMs > 0) {
      setTimeout(() => {
        set((state) => {
          if (state.osdMessage?.title === title) {
            return { osdMessage: null, osdPriority: null };
          }
          return state;
        });
      }, durationMs);
    }
  },
  setConnectOverlayOpen: (open) => set({ connectOverlayOpen: open }),
  setActiveDialog: (dialogId) => set({ activeDialog: dialogId }),
}));
