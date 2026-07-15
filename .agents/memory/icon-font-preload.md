---
name: Vector icon font preloading (Expo / @expo/vector-icons)
description: Why Feather/vector icons can render as a broken-glyph box-with-x, and the fix.
---

When `@expo/vector-icons` icons (e.g. `Feather`) render as a box with an "x" (the font's
fallback/notdef glyph) instead of the actual icon, the icon font itself isn't guaranteed
loaded before render — it loads asynchronously in the background by default.

**Why:** Relying on implicit/automatic font loading is flaky across platforms (web vs.
native, New Architecture) and devices; the symptom is intermittent or persistent tofu
boxes for some or all icons.

**How to apply:** Explicitly include the icon set's font in the same `useFonts()` call
used for the app's text fonts (e.g. `...Feather.font`), and gate rendering (splash screen
hide) on that combined load completing — the same pattern already used for custom text
fonts. This removes the race entirely.
