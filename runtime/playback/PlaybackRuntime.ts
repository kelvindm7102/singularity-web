import { resolveApiBase } from '@/lib/api/client';

import { Song } from '@/lib/api/library';

export class PlaybackRuntime {
  audio: HTMLAudioElement;
  video?: HTMLVideoElement;

  private audioContext: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private merger: ChannelMergerNode | null = null;

  private originalGainL: GainNode | null = null;
  private originalGainR: GainNode | null = null;
  private instrumentalGainL: GainNode | null = null;
  private instrumentalGainR: GainNode | null = null;
  private vocalGainL: GainNode | null = null;
  private vocalGainR: GainNode | null = null;
  private masterGain: GainNode | null = null;

  public onEnded?: () => void;
  public onStatusChange?: (status: 'loading' | 'playing' | 'paused' | 'error') => void;

  private generation = 0;
  public currentSongId: string | null = null;
  public hasVideo = false;
  public hasStem = false;
  public currentMode: 'karaoke' | 'original' = 'karaoke';
  public currentVocalVol = 0;
  public currentMainVol = 0.8;
  private isVideoPlayPending = false;

  constructor(audioEl: HTMLAudioElement, videoEl?: HTMLVideoElement) {
    this.audio = audioEl;
    this.video = videoEl;

    this.audio.addEventListener('ended', this.handleEnded);
    this.audio.addEventListener('playing', () => this.onStatusChange?.('playing'));
    this.audio.addEventListener('pause', () => this.onStatusChange?.('paused'));
  }

  private handleEnded = () => {
    if (this.onEnded) this.onEnded();
  };

  unload() {
    this.pause();
    this.currentSongId = null;
    this.audio.src = '';
    this.audio.removeAttribute('src');
    this.audio.load();
    if (this.video) {
      this.video.src = '';
      this.video.removeAttribute('src');
      this.video.load();
      this.video.style.display = 'none';
      this.hasVideo = false;
    }
    this.onStatusChange?.('paused');
  }

  async loadSong(song: Song): Promise<void> {
    const generation = ++this.generation;
    this.currentSongId = song.id;

    this.pause();
    this.onStatusChange?.('loading');
    this.hasStem = !!song.hasStem;

    // Stem is prioritized. If not present, fallback to original audio.
    this.audio.src = song.hasStem
      ? `${resolveApiBase()}/api/assets/stem/${song.id}`
      : `${resolveApiBase()}/api/assets/audio/${song.id}`;

    this.setMode(this.currentMode, this.currentVocalVol, this.currentMainVol);

    if (this.video) {
      if (song.hasVideo) {
        this.hasVideo = true;
        this.video.src = `${resolveApiBase()}/api/assets/video/${song.id}`;
        this.video.style.display = 'block';
        this.video.load();
      } else {
        this.hasVideo = false;
        this.video.removeAttribute('src');
        this.video.load();
        this.video.style.display = 'none';
      }
    } else {
      this.hasVideo = false;
    }

    this.audio.load();

    return new Promise((resolve, reject) => {
      const onCanPlay = () => {
        cleanup();
        if (this.generation !== generation) {
          resolve(); // stale request
          return;
        }
        this.audio.currentTime = 0;
        this.onStatusChange?.('paused');
        resolve();
      };

      const onError = (e: Event) => {
        cleanup();
        if (this.generation === generation) {
          this.onStatusChange?.('error');
          reject(new Error('Media load failed'));
        }
      };

      const cleanup = () => {
        this.audio.removeEventListener('canplay', onCanPlay);
        this.audio.removeEventListener('error', onError);
      };

      this.audio.addEventListener('canplay', onCanPlay);
      this.audio.addEventListener('error', onError);
    });
  }

  initAudioGraph() {
    if (this.audioContext) return;

    // We only init the audio context after user interaction or when safe
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    this.audioContext = new AudioContextClass();

    // Ensure media element volume is at unity so Web Audio gain nodes control output
    this.audio.volume = 1.0;

    // Create source
    this.sourceNode = this.audioContext.createMediaElementSource(this.audio);

    // Split 6 channels (Singularity stem standard: 0/1 original, 2/3 inst, 4/5 vocal)
    this.splitter = this.audioContext.createChannelSplitter(6);
    this.sourceNode.connect(this.splitter);

    // Create a 2-channel Stereo Merger (input 0 = Left, input 1 = Right)
    this.merger = this.audioContext.createChannelMerger(2);

    // Master Gain
    this.masterGain = this.audioContext.createGain();
    this.merger.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);

    // Create channel gains
    this.originalGainL = this.audioContext.createGain();
    this.originalGainR = this.audioContext.createGain();
    this.instrumentalGainL = this.audioContext.createGain();
    this.instrumentalGainR = this.audioContext.createGain();
    this.vocalGainL = this.audioContext.createGain();
    this.vocalGainR = this.audioContext.createGain();

    // Route Left channels explicitly to merger input 0 (Left speaker)
    const connectLeft = (channel: number, gainNode: GainNode) => {
      try {
        this.splitter!.connect(gainNode, channel, 0);
        gainNode.connect(this.merger!, 0, 0);
      } catch (e) {
        console.warn(`Could not connect left channel ${channel}`, e);
      }
    };

    // Route Right channels explicitly to merger input 1 (Right speaker)
    const connectRight = (channel: number, gainNode: GainNode) => {
      try {
        this.splitter!.connect(gainNode, channel, 0);
        gainNode.connect(this.merger!, 0, 1);
      } catch (e) {
        console.warn(`Could not connect right channel ${channel}`, e);
      }
    };

    connectLeft(0, this.originalGainL);
    connectRight(1, this.originalGainR);
    connectLeft(2, this.instrumentalGainL);
    connectRight(3, this.instrumentalGainR);
    connectLeft(4, this.vocalGainL);
    connectRight(5, this.vocalGainR);

    // Initialize mode and volumes
    this.setMode(this.currentMode, this.currentVocalVol, this.currentMainVol);
  }

  setMode(mode: 'karaoke' | 'original', vocalVol: number = this.currentVocalVol, mainVol: number = this.currentMainVol) {
    this.currentMode = mode;
    this.currentVocalVol = vocalVol;
    this.currentMainVol = mainVol;

    if (!this.audioContext) {
      return;
    }

    const t = this.audioContext.currentTime;

    const setGain = (node: GainNode | null, value: number) => {
      if (!node) return;
      node.gain.setValueAtTime(value, t);
      node.gain.value = value;
    };

    if (mode === 'original' || !this.hasStem) {
      // In original mode: ONLY channels 0 and 1 (original L/R) are loaded.
      // All other channels (inst, vocal) are explicitly muted (0).
      setGain(this.originalGainL, mainVol);
      setGain(this.originalGainR, mainVol);
      setGain(this.instrumentalGainL, 0);
      setGain(this.instrumentalGainR, 0);
      setGain(this.vocalGainL, 0);
      setGain(this.vocalGainR, 0);
    } else {
      // In karaoke mode:
      // Original channels 0 and 1 are explicitly muted (0).
      // Instrumental channels 2 and 3 get mainVol.
      // Vocal channels 4 and 5 get vocalVol.
      setGain(this.originalGainL, 0);
      setGain(this.originalGainR, 0);
      setGain(this.instrumentalGainL, mainVol);
      setGain(this.instrumentalGainR, mainVol);
      setGain(this.vocalGainL, vocalVol);
      setGain(this.vocalGainR, vocalVol);
    }
  }

  async play() {
    this.initAudioGraph();
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    try {
      await this.audio.play();
      if (this.video && this.hasVideo && (this.video.currentSrc || this.video.src) && this.video.readyState > 0) {
        await this.video.play().catch(console.warn);
      }
    } catch (error) {
      console.error('Play failed:', error);
      this.onStatusChange?.('error');
    }
  }

  pause() {
    this.audio.pause();
    if (this.video && this.hasVideo) {
      this.video.pause();
    }
  }

  seek(positionMs: number) {
    const timeSec = positionMs / 1000;
    this.audio.currentTime = timeSec;
    if (this.video && this.hasVideo && this.video.readyState > 0) {
      this.video.currentTime = timeSec;
    }
  }

  syncVideo() {
    if (!this.video || !this.hasVideo) return;
    if (!this.video.currentSrc && !this.video.src) return;
    if (this.video.readyState === 0) return;

    // Prevent continuous assignment if playing nicely
    if (this.audio.paused && !this.video.paused) {
      this.video.pause();
    } else if (!this.audio.paused && this.video.paused && !this.isVideoPlayPending) {
      this.isVideoPlayPending = true;
      this.video.play()
        .catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn('Video play warning:', err);
          }
        })
        .finally(() => {
          this.isVideoPlayPending = false;
        });
    }

    const drift = Math.abs(this.video.currentTime - this.audio.currentTime);
    // If drift is larger than 0.3 seconds, correct it
    if (drift > 0.3) {
      this.video.currentTime = this.audio.currentTime;
    }
  }

  destroy() {
    this.pause();
    this.audio.removeEventListener('ended', this.handleEnded);
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
