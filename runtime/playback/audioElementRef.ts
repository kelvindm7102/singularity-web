/**
 * audioRef — a singleton mutable ref that holds the live <audio> element.
 *
 * Player writes it once on mount. LyricRuntime reads audio.currentTime
 * directly inside its rAF loop, giving sub-millisecond clock precision
 * without going through Zustand or triggering any React renders.
 *
 * See common.md §6, §7: do NOT use timeupdate or Zustand currentTime
 * as the lyric synchronization mechanism.
 */
export const audioElementRef: { current: HTMLAudioElement | null } = { current: null };
