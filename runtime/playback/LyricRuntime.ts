/**
 * LyricRuntime — drives all lyric visual state directly on DOM elements.
 *
 * React is responsible for creating/destroying the DOM structure.
 * This runtime is responsible for all per-frame visual updates:
 *  - active line detection
 *  - opacity / scale transitions
 *  - smooth scroll interpolation toward anchor
 *  - word/part progress (CSS variable --part-progress)
 *
 * This keeps React completely out of the high-frequency animation path.
 * (see common.md §8, §9, §10, §18, §19, §20)
 */

export interface LyricPart {
  words: string;
  startTimeMs: number;
  durationMs: number;
  isBackground?: boolean;
}

export interface LyricLine {
  words?: string;
  startTimeMs?: number;
  durationMs?: number;
  parts?: LyricPart[];
  romanization?: string;
  timedRomanization?: LyricPart[];
  translation?: string;
  timedTranslation?: LyricPart[];
  isInstrumental?: boolean;
}

interface RuntimeLineRefs {
  root: HTMLElement;
  originalEl: HTMLElement | null;
  romanizationEl: HTMLElement | null;
  translationEl: HTMLElement | null;
  partEls: HTMLElement[];           // original word parts
  romaPartEls: HTMLElement[];       // romanization parts
  transPartEls: HTMLElement[];      // translation parts
}

const TRANSITION_MS = 400;
// Active line scrolls to true vertical center of the container
const ANCHOR = 0.5;

export class LyricRuntime {
  private lines: LyricLine[] = [];
  private refs: RuntimeLineRefs[] = [];
  private container: HTMLElement | null = null;
  private activeIdx = -1;
  private rafId: number | null = null;
  private destroyed = false;
  private lastScrollTarget = 0;
  private currentScrollY = 0;

  constructor() {}

  /** Called by React when the container div mounts/unmounts */
  setContainer(el: HTMLElement | null) {
    this.container = el;
  }

  /** Called by React when line refs are available */
  setLineRefs(refs: RuntimeLineRefs[]) {
    this.refs = refs;
  }

  /** Called by React when lyric data changes */
  setLines(lines: LyricLine[]) {
    this.lines = lines;
    this.activeIdx = -1;
    this.currentScrollY = 0;
    this.lastScrollTarget = 0;
    if (this.container) this.container.scrollTop = 0;
  }

  /** Main tick — called from requestAnimationFrame in the Player/Display */
  tick(currentTimeSec: number) {
    if (!this.lines.length || !this.refs.length) return;

    const currentMs = currentTimeSec * 1000;
    const newActive = this.findActiveLine(currentMs);

    if (newActive !== this.activeIdx) {
      this.activeIdx = newActive;
      this.updateLineStyles();
      this.scheduleScroll();
    }

    // Update part progress for active (and adjacent) lines
    this.updatePartProgress(currentMs);
  }

  private findActiveLine(currentMs: number): number {
    let idx = -1;
    for (let i = 0; i < this.lines.length; i++) {
      const line = this.lines[i];
      const start = line.startTimeMs;
      if (start !== undefined && start <= currentMs) {
        idx = i;
      }
    }
    return idx;
  }

  private updateLineStyles() {
    const active = this.activeIdx;
    this.refs.forEach((ref, i) => {
      if (!ref.root) return;
      const dist = Math.abs(i - active);
      const isPast = i < active;
      const isActive = i === active;
      // isFuture = !isPast && !isActive

      let opacity: number;
      let scale: number;
      let glowAlpha = 0;

      if (isActive) {
        opacity = 1;
        scale = 1.07;
        glowAlpha = 0.5;
      } else {
        // Flat uniform opacity for all inactive lines — every line equally readable
        opacity = 0.80;
        scale = 1.0;
        glowAlpha = 0;
      }

      ref.root.style.transition = `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`;
      ref.root.style.opacity = String(opacity);
      ref.root.style.transform = `scale(${scale})`;
      ref.root.style.setProperty('--line-glow', String(isActive ? 1 : 0));
      ref.root.style.setProperty('--line-glow-alpha', String(glowAlpha));
    });
  }

  private scheduleScroll() {
    if (!this.container || this.activeIdx < 0 || !this.refs[this.activeIdx]) return;
    const containerH = this.container.offsetHeight;
    const activeRef = this.refs[this.activeIdx];
    if (!activeRef?.root) return;

    // Target: active line top = container scrollTop + anchor% of container
    const lineOffsetTop = activeRef.root.offsetTop;
    const lineH = activeRef.root.offsetHeight;
    const target = lineOffsetTop - containerH * ANCHOR + lineH / 2;
    this.lastScrollTarget = target;

    // Kick off smooth interpolation via rAF
    this.animateScroll();
  }

  private scrollRafId: number | null = null;
  private animateScroll() {
    if (this.scrollRafId !== null) return; // already running
    const step = () => {
      if (!this.container || this.destroyed) { this.scrollRafId = null; return; }
      const diff = this.lastScrollTarget - this.container.scrollTop;
      if (Math.abs(diff) < 0.5) {
        this.container.scrollTop = this.lastScrollTarget;
        this.scrollRafId = null;
        return;
      }
      this.container.scrollTop += diff * 0.1;
      this.scrollRafId = requestAnimationFrame(step);
    };
    this.scrollRafId = requestAnimationFrame(step);
  }

  private updatePartProgress(currentMs: number) {
    // Only update the active line and the one just before it
    const range = [this.activeIdx - 1, this.activeIdx, this.activeIdx + 1];
    for (const idx of range) {
      if (idx < 0 || idx >= this.lines.length) continue;
      const line = this.lines[idx];
      const ref = this.refs[idx];
      if (!ref) continue;

      this.applyPartProgress(currentMs, line.parts, ref.partEls);
      this.applyPartProgress(currentMs, line.timedRomanization, ref.romaPartEls);
      this.applyPartProgress(currentMs, line.timedTranslation, ref.transPartEls);
    }
  }

  private applyPartProgress(currentMs: number, parts: LyricPart[] | undefined, els: HTMLElement[]) {
    if (!parts || !els.length) return;
    parts.forEach((part, i) => {
      const el = els[i];
      if (!el) return;
      const elapsed = currentMs - part.startTimeMs;
      const progress = part.durationMs > 0
        ? Math.max(0, Math.min(1, elapsed / part.durationMs))
        : (elapsed >= 0 ? 1 : 0);
      el.style.setProperty('--part-progress', String(progress));
    });
  }

  reset() {
    this.lines = [];
    this.refs = [];
    this.activeIdx = -1;
    if (this.container) this.container.scrollTop = 0;
  }

  destroy() {
    this.destroyed = true;
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    if (this.scrollRafId !== null) cancelAnimationFrame(this.scrollRafId);
  }
}
