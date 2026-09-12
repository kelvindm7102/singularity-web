# Singularity API Contract

This document outlines the API endpoints exposed by the Singularity API Backend for consumption by the Display, Control, and Admin UIs.

## Prequisites
* There's postman collection that you can read and use to understand the API. It's located at `../singularity-api/singularity_api_postman_collection.json`. Feel free to use CURL, the development server is active on `http://localhost:8080`.
* There's also example spk to be used for request development. Please use it to test and understand the API before making changes.
* There's also known interface while developing other project that might be useful for development.

## Global Concepts

### Authentication & Authorization
*Currently, the API has no authentication. In the future, endpoints under `/api/admin` will be restricted.*

### Responses
All endpoints return JSON by default unless otherwise specified (like Media Streaming). Standard responses on failure will be a JSON object containing an `error` field.

### Media Streaming (HTTP Range Requests)
The `/api/assets/*` endpoints serve physical files and support **HTTP Range requests (`Accept-Ranges: bytes`)**. 
This means standard `<audio>`, `<video>`, and native media players will be able to scrub, buffer, and stream files efficiently. Simply pass the endpoint URL directly into the `src` attribute of your HTML5 media elements.

---

## 1. Search & Library API

### Get All Songs
`GET /api/songs`
Returns a paginated list of all songs in the library.

**Query Parameters:**
- `page` (optional): Page number (0-indexed). Default is `0`.
- `size` (optional): Number of records per page. Default is `50`.
- `sort` (optional): Sorting criteria in the format: `property(,asc|desc)`. Default is `id,asc`.

### Search Songs
`GET /api/songs/search?q={query}`
Returns a paginated list of songs matching the query using fuzzy trigram matching on title, artist, and album.

**Query Parameters:**
- `q`: Search query string.
- `page` (optional): Page number (0-indexed). Default is `0`.
- `size` (optional): Number of records per page. Default is `50`.
- `sort` (optional): Sorting criteria in the format: `property(,asc|desc)`. Default is `id,asc`.

**Response (Page Object):**
```json
{
  "content": [
    {
      "id": "uuid",
      "title": "Song Title",
      "artist": "Artist Name",
      "album": "Album Name",
      "duration": 215,
      "genre": "Pop",
      "year": 2024
    }
  ],
  "pageable": { ... },
  "totalPages": 1,
  "totalElements": 1,
  "last": true,
  "size": 50,
  "number": 0,
  "sort": { ... },
  "numberOfElements": 1,
  "first": true,
  "empty": false
}
```

---

## 2. Asset Streaming API

These endpoints stream raw binary data for media playback and UI rendering.

### Stream Audio
`GET /api/assets/audio/{songId}`
Returns the primary audio track (e.g. `audio/mpeg`, `audio/flac`).

### Stream Video
`GET /api/assets/video/{songId}`
Returns the primary video track (e.g. `video/mp4`).

### Get Cover Art
`GET /api/assets/cover/{songId}`
Returns the album art image (e.g. `image/jpeg`).

### Stream Stems
`GET /api/assets/stem/{songId}`
Returns a multitrack stem file, if available.

---

## 3. Lyrics API

### Get Lyrics Manifest
`GET /api/songs/{songId}/lyrics` *(alias: `GET /api/lyrics/manifest/{songId}`)*
Returns all available lyric tracks for a given song, sorted by priority.

**Response:**
```json
[
  {
    "id": "uuid",
    "provider": "NetEase",
    "format": "richsynced",
    "recommended": true,
    "priority": 0,
    "url": "/api/lyrics/uuid"
  }
]
```

### Get Lyric File Content
`GET /api/lyrics/{lyricId}` *(alias: `GET /api/lyrics/file/{lyricId}`)*
Returns the raw JSON or plain text content of the requested lyric file.

---

## 4. Admin API

### Import SPK Package (Asynchronous)
`POST /api/admin/import`
Uploads a `.spk` package. This creates a background job.

**Request:** `multipart/form-data` with field `file`.

**Response:**
```json
{
  "success": true,
  "jobId": "uuid"
}
```

### Check Import Job Status
`GET /api/admin/import/{jobId}`
Check the status of an ongoing import job.

**Response:**
```json
{
  "jobId": "uuid",
  "songId": "uuid", 
  "status": "IMPORTING", 
  "errorMessage": null
}
```
*Note: `status` can be `PENDING`, `IMPORTING`, `SUCCESS`, or `FAILED`. `songId` is populated when `SUCCESS`.*

### 3. Update Song Metadata & Assets
`PATCH /api/admin/songs/{id}`

Updates song metadata and replaces physical assets. **Must be sent as `multipart/form-data`**.

#### Request Format (Form Data)
| Key | Type | Description |
|-----|------|-------------|
| title | text | Update song title |
| artist | text | Update artist |
| album | text | Update album |
| genre | text | Update genre |
| year | number | Update release year |
| duration | number | Update duration (in seconds) |
| cover | file | Replace cover/art image |
| video | file | Replace background video |
| audio | file | Replace primary audio |
| stem | file | Replace instrumental stem |
| lyric | file | Append a new recommended lyric file |

#### Response (200 OK)
Returns the updated `Song` entity.
*(All fields are optional)*

**Response:** Returns the updated Song object.

### Delete Song
`DELETE /api/admin/songs/{songId}`
Deletes the song from the database and permanently deletes all associated physical files from the storage library.

**Response:**
```json
{
  "success": true
}
```

### Delete Song Asset
`DELETE /api/admin/songs/{songId}/assets/{assetType}`
Deletes a specific physical asset (`cover`, `video`, `audio`, `stem`) and removes its record from the database.

**Response:**
```json
{
  "success": true
}
```

### Delete Lyric File
`DELETE /api/admin/lyrics/{lyricId}`
Deletes a specific lyric file from storage and removes its record from the database.

**Response:**
```json
{
  "success": true
}
```

### Reorder Lyric Priority
`PUT /api/admin/songs/{songId}/lyrics/reorder` (or alias `PUT /api/songs/{songId}/lyrics/reorder`)
Reorders the priority of lyric files for a song based on the submitted list of UUIDs. The element at index 0 automatically receives `priority: 0` and `recommended: true`.

**Request Body:**
```json
[
  "93ad3b00-e3bd-4fd8-8e64-f55760805bd7",
  "b59b2405-ed9a-4d1d-a039-4ee6543fe85f"
]
```

**Response:**
Returns the updated list of `SongLyric` objects sorted by priority ascending.
