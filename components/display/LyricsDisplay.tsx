'use client';

/**
 * LyricsDisplay
 *
 * React is responsible for:
 *   - creating the lyric DOM structure
 *   - mounting/unmounting lyric tracks
 *   - changing actual text / switching lyric source
 *
 * LyricRuntime is responsible for:
 *   - progress tracking
 *   - active-line detection
 *   - opacity / scale transitions (directly on DOM elements)
 *   - part-progress CSS variables for word/part highlighting
 *   - smooth scroll interpolation
 *
 * This keeps React completely out of the per-frame animation path.
 * See common.md §8, §9, §10, §17, §18, §19, §20
 */

import { useEffect, useRef } from 'react';
import { usePlaybackStore } from '@/stores/playbackStore';
import { LyricRuntime } from '@/runtime/playback/LyricRuntime';
import { audioElementRef } from '@/runtime/playback/audioElementRef';
import type { LyricLine } from '@/runtime/playback/LyricRuntime';

export type { LyricLine };

/** Replace every regular space with a non-breaking space (U+00A0).
 *  Preserves the text even when it's a lone space character (separator parts). */
function nbsify(text: string | undefined | null): string {
  if (text == null) return '';
  return text.replace(/ /g, '\u00A0');
}

// ─── component ────────────────────────────────────────────────────────────────

export default function LyricsDisplay() {
  const activeLyricData = usePlaybackStore(s => s.activeLyricData);
  const songId = usePlaybackStore(s => s.songId);

  // Stable refs for runtime
  const containerRef = useRef<HTMLDivElement>(null);
  const runtimeRef = useRef<LyricRuntime | null>(null);
  const lineRootRefs = useRef<(HTMLDivElement | null)[]>([]);
  const origElRefs = useRef<(HTMLElement | null)[]>([]);
  const romaElRefs = useRef<(HTMLElement | null)[]>([]);
  const transElRefs = useRef<(HTMLElement | null)[]>([]);
  const partElsFlat = useRef<(HTMLElement | null)[]>([]);
  const romaPartsFlat = useRef<(HTMLElement | null)[]>([]);
  const transPartsFlat = useRef<(HTMLElement | null)[]>([]);
  const rafIdRef = useRef<number | null>(null);

  const lines: LyricLine[] =
    activeLyricData?.lyrics && activeLyricData.lyrics.length > 0
      ? (activeLyricData.lyrics as LyricLine[])
      : [];

  const rawText: string | null =
    lines.length === 0 && activeLyricData?.content
      ? activeLyricData.content
      : null;

  // ── Init runtime once ──────────────────────────────────────────────────────
  useEffect(() => {
    runtimeRef.current = new LyricRuntime();
    return () => {
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
    };
  }, []);

  // ── Pass container ref to runtime (every render, cheap) ───────────────────
  useEffect(() => {
    runtimeRef.current?.setContainer(containerRef.current);
  });

  // ── When lyric data changes, update runtime with new lines ─────────────────
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.setLines(lines);

    // Build structured refs after React has rendered the new DOM
    requestAnimationFrame(() => {
      const structured = lines.map((line, i) => {
        const partEls: HTMLElement[] = [];
        const romaPartEls: HTMLElement[] = [];
        const transPartEls: HTMLElement[] = [];

        line.parts?.forEach((_, pi) => {
          const el = partElsFlat.current[i * 1000 + pi];
          if (el) partEls.push(el);
        });
        line.timedRomanization?.forEach((_, pi) => {
          const el = romaPartsFlat.current[i * 1000 + pi];
          if (el) romaPartEls.push(el);
        });
        line.timedTranslation?.forEach((_, pi) => {
          const el = transPartsFlat.current[i * 1000 + pi];
          if (el) transPartEls.push(el);
        });

        return {
          root: lineRootRefs.current[i]!,
          originalEl: origElRefs.current[i],
          romanizationEl: romaElRefs.current[i],
          translationEl: transElRefs.current[i],
          partEls,
          romaPartEls,
          transPartEls,
        };
      }).filter(r => !!r.root);

      runtime.setLineRefs(structured);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLyricData]);

  // ── rAF tick: reads audio.currentTime DIRECTLY — not Zustand ─────────────
  // §6: do not use timeupdate as lyric clock
  // §7: use high-resolution clock from audio element itself
  useEffect(() => {
    const tick = () => {
      const audio = audioElementRef.current;
      const currentTime = audio ? audio.currentTime : 0;
      runtimeRef.current?.tick(currentTime);
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  // ── Reset on song change ───────────────────────────────────────────────────
  useEffect(() => {
    runtimeRef.current?.reset();
  }, [songId]);

  // ─── Render ───────────────────────────────────────────────────────────────

  if (!activeLyricData || (!lines.length && !rawText)) return null;

  // Raw-text fallback (non-timed format)
  if (rawText) {
    return (
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <pre className="text-white/60 text-lg font-sans whitespace-pre-wrap text-center leading-loose max-w-2xl mx-12">
          {rawText}
        </pre>
      </div>
    );
  }

  return (
    <>
      {/* Lyric-part highlight CSS — clip-path fill on ::after, no blur */}
      <style>{`
        .lyric-part {
          display: inline;
          position: relative;
          white-space: pre;
        }
        .lyric-part::after {
          content: attr(data-w);
          position: absolute;
          inset: 0;
          color: #ffffff;
          clip-path: inset(0 calc((1 - var(--part-progress, 0)) * 100%) 0 0);
                    text-shadow: 0 0 calc(10px * var(--line-glow, 0)) rgba(34, 211, 238, var(--line-glow-alpha, 0));
          transition: text-shadow 200ms ease;
        }
        .lyric-bg-part {
          opacity: 0.80;
        }
      `}</style>

      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
        <div
          ref={containerRef}
          className="w-full max-w-[90vw] mx-auto px-6 overflow-y-hidden flex flex-col items-center"
          style={{
            height: '100%',
            gap: '2.75rem',
            paddingTop: '50vh',
            paddingBottom: '50vh',
            scrollbarWidth: 'none',
          }}
        >
          {lines.map((line, i) => {
            const hasRoma = !!(line.romanization || line.timedRomanization);
            const hasTrans = !!(line.translation || line.timedTranslation);
            const isInstrumental = line.isInstrumental;

            return (
              <div
                key={i}
                ref={el => { lineRootRefs.current[i] = el; }}
                className="lyric-line text-center select-none will-change-transform"
                style={{ opacity: 0.90, transform: 'scale(1.0)' }}
              >
                {isInstrumental ? (
                  <span
                    ref={el => { origElRefs.current[i] = el; }}
                    className="text-2xl text-white/40"
                  >
                    ♪
                  </span>
                ) : (
                  <>
                    {/* ── Original lyric track ─── §13 */}
                    <div
                      ref={el => { origElRefs.current[i] = el; }}
                      className="text-5xl font-bold text-white leading-snug tracking-wide"
                    >
                      {line.parts && line.parts.length > 0 ? (
                        line.parts.map((p, pi) => (
                          <span
                            key={pi}
                            ref={el => { partElsFlat.current[i * 1000 + pi] = el; }}
                            className={`lyric-part${p.isBackground ? ' lyric-bg-part' : ''}`}
                            data-w={nbsify(p.words)}
                            style={{ color: 'rgba(255,255,255,0.3)' }}
                          >
                            {nbsify(p.words)}
                          </span>
                        ))
                      ) : (
                        <span>{nbsify(line.words)}</span>
                      )}
                    </div>

                    {/* ── Romanization track ─── §14 */}
                    {hasRoma && (
                      <div
                        ref={el => { romaElRefs.current[i] = el; }}
                        className="text-2xl font-semibold text-white/60 mt-1 leading-snug"
                      >
                        {line.timedRomanization && line.timedRomanization.length > 0 ? (
                          line.timedRomanization.map((p, pi) => (
                            <span
                              key={pi}
                              ref={el => { romaPartsFlat.current[i * 1000 + pi] = el; }}
                              className="lyric-part"
                              data-w={nbsify(p.words)}
                              style={{ color: 'rgba(255,255,255,0.25)' }}
                            >
                              {nbsify(p.words)}
                            </span>
                          ))
                        ) : (
                          <span>{nbsify(line.romanization)}</span>
                        )}
                      </div>
                    )}

                    {/* ── Translation track ─── §15 */}
                    {hasTrans && (
                      <div
                        ref={el => { transElRefs.current[i] = el; }}
                        className="text-lg font-normal text-white/40 mt-0.5 leading-snug"
                      >
                        {line.timedTranslation && line.timedTranslation.length > 0 ? (
                          line.timedTranslation.map((p, pi) => (
                            <span
                              key={pi}
                              ref={el => { transPartsFlat.current[i * 1000 + pi] = el; }}
                              className="lyric-part"
                              data-w={nbsify(p.words)}
                              style={{ color: 'rgba(255,255,255,0.2)' }}
                            >
                              {nbsify(p.words)}
                            </span>
                          ))
                        ) : (
                          <span>{nbsify(line.translation)}</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
