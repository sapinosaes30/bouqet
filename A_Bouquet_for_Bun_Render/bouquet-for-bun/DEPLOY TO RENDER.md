# Deploy A little something for you, bun. to Render

This project is a static website. It does not need a Node.js server, build step, database, or paid web-service instance.

## Render configuration

The repository includes `render.yaml`, which defines a Render Static Site:

- Service type: Static Site (`type: web`, `runtime: static`)
- Build command: leave blank
- Publish directory: `.` (the repository root)
- Public URL: Render assigns an `onrender.com` address
- HTTPS: provided by Render

## Deploy with Render's dashboard

1. Extract the project ZIP.
2. Create a new repository on GitHub.
3. Upload the **contents** of the `bouquet-for-bun` folder to the root of the repository. Make sure `index.html`, `render.yaml`, and the `src` folder are at the repository root—not inside an extra nested folder.
4. Sign in to Render and choose **New → Static Site** (or **New → Blueprint** to use `render.yaml`).
5. Connect the GitHub repository and select its `main` branch.
6. For a Static Site, set **Build Command** to blank and **Publish Directory** to `.`. If using **New → Blueprint**, Render reads `render.yaml` and proposes the same static-site configuration.
7. Create/deploy the site. When the deploy finishes, open its `onrender.com` URL on a phone and share that URL with bun.

## Future updates

When the repository is connected to Render, pushes to the linked branch automatically trigger a new deploy.

## Important

Three.js is loaded from the pinned jsDelivr CDN in `index.html`, so visitors need an internet connection for the initial 3D library download. The website itself is served by Render's static-site CDN over HTTPS.
