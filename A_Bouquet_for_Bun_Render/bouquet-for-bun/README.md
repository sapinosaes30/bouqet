# A little something for you, bun.

A mobile-first, real-time generative bouquet. The flowers, leaves, stems, ribbon, and butterflies are drawn from colored letters, numbers, and symbols on 3D surfaces. The bouquet assembles itself, then rotates and moves continuously. An original ambient soundscape is synthesized in the browser.

## Publish it online with Render (recommended)

This is a **static website**. It does not need a Node.js server, a database, or a build command. The repository includes `render.yaml` to define the Render Static Site.

1. Extract the ZIP.
2. Create a GitHub repository and upload the **contents** of the `bouquet-for-bun` folder to the repository root. `index.html`, `render.yaml`, and the `src` folder must be at the top level.
3. In Render, choose **New → Static Site** and connect that GitHub repository, or choose **New → Blueprint** to use `render.yaml`.
4. For a manually configured Static Site, leave **Build Command** blank and set **Publish Directory** to `.`.
5. Deploy. Render will provide an HTTPS `onrender.com` link that you can send to bun. Opening the link on her phone does not require downloading the ZIP or installing anything.

See [DEPLOY TO RENDER.md](./DEPLOY%20TO%20RENDER.md) for detailed steps.

## Run it on Windows (local preview)

1. Extract the ZIP.
2. Open the extracted `bouquet-for-bun` folder.
3. Double-click **START WEBSITE.bat**.
4. Your browser should open automatically at **http://localhost:4173/**.
5. Tap or click anywhere once to start the soundscape.

Keep the black command window open while viewing the local preview. To stop the local server, click that window and press **Ctrl+C**.

The local Windows launcher uses built-in PowerShell. It does not require Node.js, npm, Python, administrator rights, or `npm install`.

## Controls and behavior

There are no visible controls. The visual animation begins automatically. The first tap/click anywhere activates the audio because browsers restrict audio autoplay. Desktop pointer movement produces very subtle camera parallax; phones do not need any pointer or motion permissions.

## Technical notes

- Three.js 0.187.0, loaded through an import map from jsDelivr.
- Procedural 3D flower geometry with character glyphs attached to the surfaces.
- 32 flower heads across 12 flower species.
- Eight independently animated, character-built butterflies.
- A roughly 10-second character-assembly opening.
- Original Web Audio API piano-like tones, string pads, breeze, and birdsong; no external music files are used.
- A seeded composition so the bouquet arrangement remains consistent between visits.

## Internet requirement

Three.js is loaded from the jsDelivr CDN using the pinned Three.js 0.187.0 module. Visitors need an internet connection when the website first loads so the browser can download the 3D library.

## License note

The Three.js library is distributed under the MIT License. See [THIRD-PARTY-NOTICES.md](./THIRD-PARTY-NOTICES.md).
