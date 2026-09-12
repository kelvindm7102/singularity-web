
# interface for lyric files
```typescript
interface LyricPackInterface {
  version: string;
  lyrics: LyricLine[];
  musicVideoSynced: boolean;
  source: string;
  sourceHref: string;
  language?: string;
}

interface LyricLine {
  words: string;
  startTimeMs: number;
  durationMs: number;
  // Optional fields
  parts?: LyricPart[];
  romanization?: string;
  timedRomanization?: LyricPart[];
  translation?: string;
  timedTranslation?: LyricPart[];
  agent?: string;
}

interface LyricPart {
  words: string;
  startTimeMs: number;
  durationMs: number;
  // Optional fields
  isBackground?: boolean;
  explicit?: boolean;
}
```




# Singularity Package Kit Format
Singularity Package Kit (SPK) is a bundled package of music, video, lyrics, and metadata into a single importable compressed file.
## metadata.json
This is the metadata file that contains all the metadata of the song. Some fields are auto imported from YouTube Music, but some are still not yet filled.
```typescript
interface metadataInterface {
    title: string; // auto imported from YouTube Music's title
    artist?: string; // auto imported from YouTube Music's artist, if exists
    album?: string; // auto imported from YouTube Music's album, if exists
    duration: number; // auto imported from YouTube Music's duration
    genre?: string; // user instertable field
    year?: number; // user instertable field
    paths: {
        art?: string; // path to original audio file inside the SPK
        audio: string; // path to original audio file inside the SPK
        video?: string; // path to video file inside the SPK,
        cover?: string; // path to cover art inside the SPK,
        stem?: string; // path to stem file inside the SPK,
        lyrics: string[]; // list of path to lyrics file inside the SPK, sorted by most to least recommended ones.
    }
}
```

## audio.mp3
This is the audio file that contains the song's original audio in mp3 format.
## video.{webm/mp4}
This is the video file that contains the song's original video in either webm or mp4 format.
## stems.opus
This is the stems file that contains the song's stems in opus format. Total channels in this file are 6. Each stereo (2) channel is for original, instrumental, and vocal tracks.
## cover.jpg
This is the cover image file that contains the song's cover image in jpg format. But musicia not yet support downloading cover arts. In the future, it will be downloaded from YouTube Music's cover arts.
