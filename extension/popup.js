<README.md>
```markdown
# Hack Club Devlog Downloader (Firefox Extension)

A Firefox extension (Manifest V3) that extracts devlogs, images, videos, and custom Slack emotes from Stardance and other Hack Club platforms, zipping them into local Markdown, HTML, or Plain Text files.

## Features

- **DOM Extraction**: Targets `.feed-post-card` elements on Stardance pages.
- **Media Ingestion**: Bundles images, videos, and custom Slack emotes directly into an `assets/` subfolder inside the ZIP.
- **Multiple Formats**:
  - **Markdown (.md)**: Converts formatting and links images locally (`![alt](assets/filename.png)`).
  - **HTML (.html)**: Preserves original DOM markup with relative asset links.
  - **Plain Text (.txt)**: Simple text summary for easy reading.

## Local Development & Testing

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Extension**:
   ```bash
   npm run build
   ```

3. **Load in Firefox**:
   - Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
   - Click **Load Temporary Add-on...**.
   - Select `extension/manifest.json`.

## Automatic GitHub Builds

This repository uses GitHub Actions (`.github/workflows/build.yml`) to automatically build and bundle the extension whenever code is pushed.

### How to Download Pre-Built Extension from GitHub:
1. Go to your GitHub repository.
2. Click the **Actions** tab.
3. Click the latest workflow run.
4. Scroll down to **Artifacts** and download `hackclub-devlog-downloader`.
5. Unzip the artifact, then load `manifest.json` into Firefox via `about:debugging`.
