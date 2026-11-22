# Tulips, Forget-me-nots & Wildflowers

A fullscreen browser adaptation of the character-art bouquet from the supplied `Ascii-Flower-Bouquet` repository and TikTok screen recording.

## Visual behavior

- A golden-angle 3D arrangement of flower heads, distributed around a compact bouquet volume.
- Tulip heads use the reference's vertically shaped cup silhouette and three visible petal sections.
- Forget-me-nots are small five-petal blue florets grouped into branching sprays.
- Wildflowers use radial scalloped silhouettes with varied petal counts and contrasting centers.
- Fine green character trails connect the blooms into a shared stem neck.
- Point-surface foliage uses the reference's leaf construction and directional shading.
- The full arrangement rotates around its vertical axis with the same camera tilt and perspective projection approach.
- A depth buffer preserves front-to-back overlap.
- ANSI-256 palette colors and terminal-style glyph shading recreate the source's visual language.
- Slow glyph shimmer changes character shading without turning the flowers into random particle clouds.

There is intentionally no title, dedication, message, hearts, paper wrapping, ribbon, butterflies, sparkles, controls, or visible interface. The screen contains only the flowers, their stems, and foliage.

## Run locally on Windows

Double-click `START WEBSITE.bat`. It opens `index.html` in the default browser. No Node.js, Python, packages, or local server are required.

## Deploy to Render

Create a **Static Site** connected to your GitHub repository.

- Build Command: leave blank
- Publish Directory: `.`

Place the contents of this project folder directly in the repository root so `index.html` is at the top level. See `DEPLOY TO RENDER.md`.

## Attribution

The rendering approach adapts visual construction principles from `Ascii-Flower-Bouquet` by Alish Sharma, supplied by the user: golden-angle 3D bloom placement, perspective rotation and projection, depth buffering, point-surface foliage, camera-facing flower silhouettes, and ANSI-style character shading. The supplied source is MIT-licensed; its original license notice is included in `REFERENCE-MIT-LICENSE.txt`.
