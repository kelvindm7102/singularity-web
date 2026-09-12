# Singularity Admin UI Design Specification

## 1. Purpose

This document defines the visual and interaction design language for the **Singularity Admin frontend**.

Singularity Admin is the technical/library-management interface for the Singularity karaoke system. It is used primarily on laptop/desktop for:

* managing the karaoke song library
* importing `.spk` packages
* viewing and editing song metadata
* inspecting lyrics and media assets
* previewing available media
* deleting songs
* searching and navigating the library

The Admin interface must feel like part of the same product as the Singularity Display and Control interfaces, while having its own personality.

The three interfaces have different priorities:

| Interface | Primary feeling           | Primary priority              |
| --------- | ------------------------- | ----------------------------- |
| Display   | Cinematic                 | Immersion                     |
| Control   | Fast / tactile            | Speed                         |
| Admin     | Futuristic system console | Information density + control |

The Admin interface should therefore feel like a **futuristic system**, not a futuristic SaaS website.

---

# 2. Core Design Philosophy

## 2.1 Futuristic, but usable

The visual language is inspired by:

* outer space
* futuristic system interfaces
* sci-fi operating consoles
* floating system overlays
* futuristic HUD geometry
* Chinese short-drama-style “system” interfaces

The interface should communicate:

> “This is a powerful system managing a media library.”

It should **not** communicate:

> “This is a generic dark SaaS dashboard with some cyan added.”

Usability always wins.

If a decorative futuristic effect makes the interface harder to understand, interact with, or scan, remove the effect.

---

## 2.2 Space is part of the UI

The background should establish a subtle sense of depth.

The default environment is:

* deep space / blue-black
* tiny star points
* extremely subtle nebula/light bloom
* faint atmospheric illumination
* mostly static
* low visual noise

The background must remain visible behind parts of the interface.

Example conceptual layering:

```text
┌─────────────────────────────────────────────────────────────┐
│  ·                    ·                    ✦                │
│          ·                         ·                        │
│                                                             │
│  ┌───────────────┐   ┌──────────────────────────────────┐  │
│  │               │   │                                  │  │
│  │   SIDEBAR     │   │       ADMIN CONTENT              │  │
│  │               │   │                                  │  │
│  │               │   │                                  │  │
│  └───────────────┘   └──────────────────────────────────┘  │
│                     ·                         ·              │
│          ✦                              ·                   │
└─────────────────────────────────────────────────────────────┘
```

Large UI surfaces may use approximately **90% opacity** rather than completely opaque backgrounds.

The purpose is not glassmorphism.

The purpose is:

> “There is a system floating inside space.”

---

# 3. What the Design Must Avoid

The following are explicit anti-patterns.

## 3.1 No generic SaaS dashboard

Avoid:

* giant rounded cards
* excessive cards
* dashboard tiles everywhere
* excessive whitespace
* pastel status badges
* generic dark-mode SaaS layouts
* “AI dashboard” aesthetics

---

## 3.2 No Material-style UI

Avoid:

* excessive rounded containers
* floating Material cards
* pill-shaped everything
* generic Material buttons
* overly soft elevation

---

## 3.3 No glassmorphism

Do not turn every component into:

```text
background: rgba(...)
backdrop-filter: blur(...)
border: rgba(...)
```

Transparency is allowed.

Heavy glass effects are not.

The user should see **space behind the interface**, not frosted glass.

---

## 3.4 No excessive neon

Neon represents:

* active state
* focus
* important information
* system activity
* selected elements

Neon should not become the default color of every border.

The interface should still have areas of calm darkness.

---

## 3.5 No excessive gradients

Gradients may be used for:

* subtle atmospheric background lighting
* very restrained highlights
* selected/active states

Do not use large obvious gradients on every component.

---

## 3.6 No emoji UI icons

Do not use emoji as interface icons.

Use a proper icon library with a consistent icon style.

Icons should support the interface rather than becoming decoration.

---

# 4. Visual Identity

## 4.1 Color direction

Primary palette:

```text
Deep Space
    ↓
Blue-Black
    ↓
Cold Blue
    ↓
Electric Blue
    ↓
Cyan
```

The palette should feel cold, technical, and energetic.

A conceptual palette:

```css
--color-space-950: #050914;
--color-space-900: #080E1C;
--color-space-850: #0B1324;

--color-blue-700: #1557C0;
--color-blue-600: #1976FF;
--color-blue-500: #2494FF;

--color-cyan-500: #18D8FF;
--color-cyan-400: #43E7FF;

--color-text-primary: #F2F7FF;
--color-text-secondary: #A9B7CC;
--color-text-muted: #64748B;

--color-border: rgba(130, 170, 220, 0.20);
--color-border-strong: rgba(80, 170, 255, 0.40);
```

Exact colors should remain configurable through design tokens.

---

# 5. State Color System

Color should communicate state.

### Normal

Neutral dark surface with restrained borders.

### Hover

Introduce a subtle blue tint.

### Selected

Blue/cyan highlight.

### Active

Cyan accent plus restrained glow.

### Important

Stronger accent and/or stronger glow.

### Destructive

Use a restrained red/orange warning color.

Do not make the entire interface red when a destructive action is available.

---

# 6. Glow Rules

Glow is an accent, not a foundation.

Recommended hierarchy:

```text
Normal
    no glow

Hover
    almost no glow

Selected
    subtle glow

Active
    noticeable but restrained glow

Critical system state
    stronger glow
```

Conceptually:

```css
box-shadow:
    0 0 12px rgba(24, 216, 255, 0.18);
```

Avoid:

```css
box-shadow:
    0 0 50px cyan;
```

on ordinary elements.

Approximately **20% of the visual language may use subtle glow**, while most elements remain crisp.

---

# 7. Background System

The Admin background consists of three conceptual layers.

## Layer 1: Base space

Deep blue-black background.

```css
background: var(--color-space-950);
```

## Layer 2: Starfield

Tiny points distributed across the viewport.

Stars should be:

* small
* sparse
* low opacity
* mostly static
* non-interactive

The starfield must never compete with text.

## Layer 3: Atmospheric light

Very subtle blue/cyan nebula or light bloom.

The atmosphere should provide depth rather than become a visible wallpaper.

Example conceptual result:

```text
·                ·                       ✦

       faint blue atmospheric glow

                ┌─────────────────────┐
       ·        │                     │
                │     CONTENT         │
                │                     │
                └─────────────────────┘

   ✦                      ·
```

---

# 8. Transparency

Transparency is used selectively.

A major content surface may look conceptually like:

```css
background: rgba(8, 14, 28, 0.90);
```

This allows the background to remain perceptible.

Transparency should answer:

> “Can I still feel that the system exists inside space?”

It should not answer:

> “Can I see a blurry version of everything underneath this card?”

Therefore:

* transparency: yes
* subtle background visibility: yes
* heavy blur: no
* giant translucent rounded rectangles: no

---

# 9. Shape Language

Singularity uses a **sharp geometric language**.

Primary characteristics:

* sharp corners
* cut corners
* brackets
* angled edges
* thin technical lines
* floating section markers

Rounded UI should generally be avoided.

A major section may use geometry such as:

```text
╱────────────────────────────────────╲
│                                    │
│  SONG LIBRARY                      │
│                                    │
╲────────────────────────────────────╱
```

Or bracket framing:

```text
┌─ SONG LIBRARY ─────────────────────┐

    content

└────────────────────────────────────┘
```

These are visual concepts, not literal characters that must be rendered in the UI.

---

# 10. Geometric Hierarchy

Not every component should have aggressive sci-fi geometry.

Use hierarchy.

### Major sections

Strongest geometric language.

Examples:

* page headers
* major workspaces
* import workspace
* major media areas

### Important states

Moderate geometric treatment.

Examples:

* selected song
* active navigation
* processing state
* important system status

### Ordinary table

Mostly clean.

The data itself should remain easy to scan.

### Buttons

Sharp/simple.

### Dialogs

Can use stronger futuristic framing.

### Decorative elements

Sparse.

The interface should feel futuristic because of its **system-wide language**, not because every component is screaming “CYBERPUNK”.

---

# 11. Typography

Typography must feel futuristic without sacrificing readability.

Use three configurable font roles:

```css
--font-display
--font-body
--font-mono
```

## Display font

Used for:

* Singularity wordmark
* major page titles
* section titles
* special system labels

Should be:

* geometric
* technical
* slightly futuristic
* bold enough to establish identity

Do not use an extreme alien/sci-fi font.

---

## Body font

Used for:

* metadata
* table content
* descriptions
* buttons
* forms
* navigation

Must prioritize readability.

---

## Monospace font

Used selectively for:

* IDs
* technical metadata
* file names
* asset information
* timestamps
* processing information

Do not make the entire application monospace.

---

# 12. Density

Admin should be **moderately dense**.

It should not feel:

* spacious like a marketing page
* cramped like an old terminal

The target is:

```text
comfortable
    ↓
information-rich
    ↓
easy to scan
```

Recommended characteristics:

* compact table rows
* moderate page spacing
* clear section separation
* restrained padding
* no giant empty areas

---

# 13. Application Layout

Primary Admin layout:

```text
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│ ┌───────────────┐ ┌───────────────────────────────────────┐ │
│ │               │ │                                       │ │
│ │   SIDEBAR     │ │             CONTENT                   │ │
│ │               │ │                                       │ │
│ │               │ │                                       │ │
│ │               │ │                                       │ │
│ │               │ │                                       │ │
│ └───────────────┘ └───────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

Sidebar is the primary navigation mechanism.

The content area should feel like the main system workspace.

---

# 14. Sidebar

The sidebar should feel like a **system navigation rail**, not a SaaS menu.

Possible structure:

```text
SINGULARITY

────────────────

LIBRARY
  Songs

IMPORT
  Imports

────────────────

SYSTEM
  ...
```

Use:

* sharp navigation items
* small technical labels where useful
* clear active indicator
* subtle cyan/blue active state
* restrained glow

Active item concept:

```text
│  SONGS
│
│  █
```

or an angled/bracket indicator.

Do not turn navigation items into rounded pills.

---

# 15. Admin Routes

The design must support the following conceptual pages:

```text
/admin
/admin/songs
/admin/songs/[id]
/admin/imports
```

The exact routing implementation belongs to the frontend architecture specification.

This document defines visual behavior only.

---

# 16. Admin Dashboard

The Admin landing page should not become a generic analytics dashboard.

Avoid:

```text
┌───────┐ ┌───────┐ ┌───────┐
│ 1234  │ │  456  │ │  789  │
│ Songs │ │Albums │ │Artists│
└───────┘ └───────┘ └───────┘
```

everywhere.

Instead, prioritize operational information:

```text
ADMIN / OVERVIEW

────────────────────────────────────────────

LIBRARY
1,248 SONGS
Last updated ...

────────────────────────────────────────────

RECENT IMPORTS

...

────────────────────────────────────────────

SYSTEM ACTIVITY

...
```

Information should feel like part of a system console.

---

# 17. Song Library

The primary Admin library representation is a **table**.

This is intentional.

Admin users need to quickly:

* scan many songs
* compare metadata
* search
* sort
* inspect asset availability
* open a song
* perform management actions

The table should therefore be the dominant component.

---

# 18. Song Table

Conceptual structure:

```text
SONG LIBRARY

[ Search songs... ]                         [ IMPORT ]

────────────────────────────────────────────────────────────

COVER   TITLE             ARTIST       ALBUM       TIME   YEAR
        Song Name         Artist       Album       03:42  2026
        Another Song      Artist       Album       04:12  2025
        ...
```

Possible columns:

* cover
* title
* artist
* album
* duration
* year
* asset status
* actions

Only include columns that are useful.

Do not create unnecessary technical columns simply because the backend has the data.

---

# 19. Table Visual Language

The table should not look like a spreadsheet from 2007.

Use:

* dark transparent surface
* thin separators
* subtle blue hover
* crisp typography
* small accent indicators
* restrained header styling

Rows should remain visually distinct without heavy boxes around every cell.

Prefer:

```text
TITLE          ARTIST          ALBUM
────────────────────────────────────────
Song A         Artist A        Album A
────────────────────────────────────────
Song B         Artist B        Album B
```

rather than:

```text
┌────────┬────────┬────────┐
│ Song A │ Artist │ Album  │
├────────┼────────┼────────┤
│ Song B │ Artist │ Album  │
└────────┴────────┴────────┘
```

The latter becomes visually noisy.

---

# 20. Song Row Interaction

### Default

Neutral.

### Hover

Subtle blue background.

### Selected

Blue/cyan edge or indicator.

### Keyboard focus

Clearly visible focus state.

### Action area

Keep destructive actions visually separated from ordinary actions.

Do not fill every row with five glowing buttons.

---

# 21. Search

Search should feel like a system command field.

Concept:

```text
╱────────────────────────────────────────────╲
│  SEARCH SONGS...                           │
╲────────────────────────────────────────────╱
```

Input should be:

* sharp
* dark
* readable
* clear focus state
* subtle cyan/blue focus glow

Avoid pill-shaped search fields.

---

# 22. Buttons

Buttons should use sharp geometry.

Primary:

```text
╱ IMPORT SONGS ╲
```

Secondary:

```text
[ EDIT ]
```

Conceptually, the visual system can use:

* sharp corners
* cut corners
* subtle border
* restrained blue accent

Primary actions may use stronger blue/cyan.

Avoid making every button neon.

---

# 23. Inputs

Inputs should feel like system controls.

Characteristics:

* dark background
* sharp corners
* thin border
* readable placeholder
* strong focus state
* clear validation state

Focus:

```text
normal:
border = subtle

focused:
border = cyan
glow = subtle
```

Do not use giant glowing input boxes.

---

# 24. Song Detail

The Song Detail page should feel more like a **media system page** than a CRUD form.

Song information should be **integrated into the page**, not automatically placed inside a card.

Concept:

```text
SONG / 7F91...

────────────────────────────────────────────

SONG INFORMATION

Title       Song Title
Artist      Artist Name
Album       Album Name
Duration    03:42
Year        2026

────────────────────────────────────────────

MEDIA

[ preview / player ]

────────────────────────────────────────────

LYRICS

...
```

The title, metadata, assets, lyrics, and preview should feel like parts of one system workspace.

---

# 25. Panels

Panels are allowed when they have a real semantic purpose.

Good panel candidates:

* import workspace
* media preview
* confirmation dialog
* special processing state
* grouped technical asset information

Bad usage:

```text
CARD
  CARD
    CARD
      CARD
```

Do not wrap every section in a rounded card.

---

# 26. Media Preview

Media preview can receive stronger visual treatment.

It is one of the places where a panel is justified.

Concept:

```text
╱────────────────────────────────────────────╲
│ MEDIA PREVIEW                              │
│                                            │
│              ▶                             │
│                                            │
╲────────────────────────────────────────────╱
```

The media area may use:

* subtle dark panel
* stronger framing
* cyan playback indicators
* waveform/progress information if useful

The media itself remains the focus.

---

# 27. Assets

Asset information should be technical but readable.

Example:

```text
ASSETS

AUDIO
  Instrumental     READY
  Vocal            READY
  Original         READY

VIDEO
  Karaoke Video    READY

LYRICS
  Lyrics           READY
```

Status indicators should be small and restrained.

Do not create giant colorful badges.

---

# 28. Lyrics

Lyrics should be treated as content, not merely another generic form field.

Possible presentation:

```text
LYRICS

────────────────────────────────────────────

[ lyrics content ]

────────────────────────────────────────────
```

If technical lyric metadata exists, it may be shown separately.

The UI should remain readable and comfortable for inspecting lyric data.

---

# 29. Import Workspace

Import is one of the areas where a dedicated panel/workspace makes sense.

Concept:

```text
IMPORT SONG PACKAGE

╱────────────────────────────────────────────╲
│                                            │
│   DROP .SPK PACKAGE                        │
│                                            │
│   or                                       │
│                                            │
│   [ SELECT FILE ]                          │
│                                            │
╲────────────────────────────────────────────╱
```

Do not make the drop zone a giant rounded rectangle.

Use sharp/cut geometry.

---

# 30. Import Processing

`.spk` imports are asynchronous.

The user uploads the package, the API accepts it, and processing continues in the background.

The interface should therefore distinguish:

```text
UPLOAD
   ↓
ACCEPTED
   ↓
PROCESSING
   ↓
COMPLETED / FAILED
```

The Admin UI should not pretend that processing is synchronous.

Example:

```text
IMPORT ACCEPTED

Song package has been accepted by Singularity
and is being processed in the background.

STATUS
PROCESSING
```

If the API exposes an import status/history mechanism, the UI can reflect it.

If the API does not expose status polling, realtime updates, or an equivalent mechanism, do not invent one in the design.

The design must remain compatible with the current REST-only architecture.

---

# 31. Loading States

Loading states should feel like system activity.

Avoid generic:

```text
Loading...
```

as the only visual feedback.

Possible visual language:

```text
SYSTEM / LOADING

████████░░░░░░░░

FETCHING SONG LIBRARY
```

However, do not over-animate.

Skeletons are appropriate for tables and structured content.

---

# 32. Empty States

Empty states should remain useful and technical.

Example:

```text
SONG LIBRARY

────────────────────────────────────────────

NO SONGS FOUND

The Singularity library does not contain
any songs matching this query.

[ IMPORT SONGS ]
```

Do not use:

* cute illustrations
* emoji
* giant cartoon graphics
* motivational SaaS copy

---

# 33. Error States

Errors should communicate:

1. what failed
2. whether the system recovered
3. what the user can do next

Example:

```text
LIBRARY LOAD FAILED

Unable to retrieve the song library.

[ RETRY ]
```

Destructive errors should use restrained warning colors.

Do not make the entire page red.

---

# 34. Confirmation Dialogs

Dialogs should use stronger futuristic framing.

Concept:

```text
╱────────────────────────────────────────────╲
│ CONFIRM DELETE                             │
│                                            │
│ Delete "Song Name"?                        │
│                                            │
│ This action cannot be undone.              │
│                                            │
│ [ CANCEL ]                 [ DELETE ]      │
╲────────────────────────────────────────────╱
```

Dialog hierarchy:

* dark background
* sharp geometry
* thin border
* restrained glow
* strong title
* clear actions

Do not use rounded Material dialogs.

---

# 35. Toasts / Notifications

Toasts should be compact system notifications.

Example:

```text
┌────────────────────────────────────┐
│ ✓  SONG IMPORT ACCEPTED             │
│    Processing in background         │
└────────────────────────────────────┘
```

They may use:

* small accent line
* cyan/blue state
* sharp corners
* restrained shadow/glow

Avoid giant notification cards.

---

# 36. Animation

Animation is allowed and encouraged when it improves the feeling of a living system.

However, performance is important, especially on phones and low-powered hardware.

Animation should be:

* short
* subtle
* purposeful
* GPU-friendly
* easy to disable

Good candidates:

* page transitions
* sidebar active indicator
* hover transitions
* selected states
* import processing indicator
* dialog entrance
* subtle ambient background movement

Avoid:

* constantly moving backgrounds
* heavy particle systems
* huge blur animations
* animated gradients everywhere
* dozens of simultaneous box-shadow animations
* unnecessary canvas effects

---

# 37. Mobile Performance

The design must degrade gracefully.

The futuristic visual language must not require expensive rendering.

Prefer:

```text
opacity
transform
simple gradients
CSS borders
small shadows
```

Avoid relying heavily on:

```text
backdrop-filter
large blur regions
massive box-shadows
canvas particle systems
continuous expensive animations
```

On mobile or reduced-motion environments:

* reduce ambient animation
* reduce glow
* simplify background effects
* preserve functionality
* preserve hierarchy

The interface should still look like Singularity when effects are reduced.

---

# 38. Accessibility

Futuristic styling must never sacrifice accessibility.

Required:

* sufficient text contrast
* visible keyboard focus
* semantic HTML
* accessible labels
* usable form controls
* readable table text
* clear error states
* `prefers-reduced-motion` support

Do not rely on color alone for important state.

For example:

```text
READY   ✓
FAILED  !
PROCESSING  ...
```

should have textual/iconic differentiation in addition to color.

---

# 39. Responsive Behavior

Desktop is the primary Admin target.

Mobile should remain functional rather than simply shrinking the desktop UI.

Desktop:

```text
SIDEBAR + TABLE
```

Mobile:

```text
COMPACT NAVIGATION
        +
STACKED / ADAPTED DATA
```

Do not attempt to force a 10-column desktop table onto a phone.

For mobile, table data may:

* hide low-priority columns
* move secondary metadata below title
* use responsive row layouts
* expose actions through a compact action menu

The same visual language must remain intact.

---

# 40. Design Tokens

All important visual properties should be tokenized.

At minimum:

```css
:root {
  /* Colors */
  --color-space-950: ...;
  --color-space-900: ...;
  --color-space-850: ...;

  --color-blue-700: ...;
  --color-blue-600: ...;
  --color-blue-500: ...;

  --color-cyan-500: ...;
  --color-cyan-400: ...;

  --color-text-primary: ...;
  --color-text-secondary: ...;
  --color-text-muted: ...;

  --color-border: ...;
  --color-border-strong: ...;

  /* Typography */
  --font-display: ...;
  --font-body: ...;
  --font-mono: ...;

  /* Geometry */
  --radius-none: 0px;
  --radius-small: ...;

  /* Effects */
  --glow-subtle: ...;
  --glow-active: ...;

  /* Transparency */
  --surface-opacity: 0.90;

  /* Motion */
  --duration-fast: ...;
  --duration-normal: ...;
}
```

Exact values may evolve during implementation.

The important requirement is that the visual system is centralized and easy to tune.

---

# 41. Shared Product DNA

Admin, Control, and Display must clearly belong to the same product.

Shared characteristics:

* space-inspired environment
* blue/cyan energy
* technical typography
* sharp geometry
* restrained glow
* futuristic system language

But each interface has a different emphasis.

```text
DISPLAY
cinematic
    ↓
large visual hierarchy
    ↓
lyrics first


CONTROL
fast
    ↓
tactile
    ↓
library + queue


ADMIN
technical
    ↓
dense
    ↓
library + management
```

Admin must not accidentally become the same UI as the karaoke Display.

---

# 42. Singularity Wordmark

There is currently no finalized logo.

Use:

```text
SINGULARITY
```

as the temporary wordmark.

The wordmark should rely primarily on typography.

It should feel:

* futuristic
* geometric
* premium
* technical

Do not create a complicated logo solely for the initial Admin implementation.

A dedicated logo can be introduced later without changing the core design system.

---

# 43. Visual Composition Example

A typical Songs page should conceptually look like:

```text
        ·                      ✦
                 ·

┌─────────────────┐
│ SINGULARITY     │
│                 │
│ LIBRARY         │
│   SONGS         │
│                 │
│ IMPORT          │
│   IMPORTS       │
│                 │
│                 │
│ SYSTEM          │
└─────────────────┘

     ╱──────────────────────────────────────────────╲
     │ SONG LIBRARY                                 │
     │                                              │
     │ [ SEARCH SONGS... ]              [ IMPORT ]  │
     │                                              │
     │ ──────────────────────────────────────────── │
     │                                              │
     │ COVER  TITLE       ARTIST     ALBUM    TIME │
     │                                              │
     │        Song A      Artist A   Album A  03:42│
     │        Song B      Artist B   Album B  04:11│
     │        Song C      Artist C   Album C  02:58│
     │                                              │
     ╲──────────────────────────────────────────────╱

                         ·
              ✦
```

The exact UI should not literally reproduce this ASCII layout.

It represents the intended composition:

**dark space + integrated workspace + sharp geometry + restrained cyan energy.**

---

# 44. Design Rules Summary

When implementing a new component, ask:

### 1. Does it feel like Singularity?

If not, reconsider its shape, typography, color, or framing.

### 2. Is it useful?

If the futuristic effect does not improve hierarchy, state, or identity, remove it.

### 3. Is it too rounded?

Prefer sharp geometry.

### 4. Is it too neon?

Reduce the glow.

### 5. Is it too opaque?

Consider whether the space background should remain subtly visible.

### 6. Is it too transparent?

Avoid turning it into glassmorphism.

### 7. Is it too much like SaaS?

Remove unnecessary cards, pills, excessive whitespace, and dashboard decoration.

### 8. Is the content still easy to scan?

If not, simplify the decoration.

### 9. Will this run well on a phone?

Reduce expensive effects and animation.

### 10. Does the interface feel like a system rather than a website?

That is the final test.

---

# 45. Final Design Principle

The visual identity of Singularity Admin can be summarized as:

> **A futuristic media-management system floating inside deep space.**

Not:

> a dark SaaS dashboard.

Not:

> a cyberpunk game lobby.

Not:

> a glassmorphism website.

Not:

> a Material dark theme with cyan buttons.

The desired result is a UI where the user can glance at it and think:

**“This looks like a floating space system.”**

while still being able to comfortably manage hundreds of songs without fighting the interface.
