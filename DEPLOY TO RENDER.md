# Deploy this bouquet to Render

Use **Render → New → Static Site**.

1. Put the contents of this project folder directly in the root of your GitHub repository. `index.html` must be visible at the repository's top level.
2. Connect that repository to Render.
3. Select the `main` branch.
4. Leave **Build Command** blank.
5. Set **Publish Directory** to `.`.
6. Create the Static Site.

The included `render.yaml` uses the same static-site configuration. This project has no server, build step, package installation, or external JavaScript dependencies.

After the first deployment, each push to `main` can trigger an automatic redeploy. Render provides the public `.onrender.com` URL.
