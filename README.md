# Hack Club Devlog Downloader (Firefox Extension)

Firefox extension that downloads hackclub devlogs in a selected format. Tested with stardance.

## Installation

### Mozilla Webstore
[![Get the add-on](assets/get-the-addon.png)](https://addons.mozilla.org/en-US/firefox/addon/hackclub-devlog-downloader/)

### Github Actions
1. Go to the **Actions** tab in this repository on GitHub.
2. Click on the latest successful workflow run.
3. Scroll down to the **Artifacts** section at the bottom of the page.
4. Download the `hackclub-devlog-downloader` ZIP file and extract it to a folder on your computer.
5. Open Firefox and navigate to `about:debugging#/runtime/this-firefox`.
6. Click **Load Temporary Add-on...** and select the `manifest.json` file inside the extracted folder.

### Build Locally
1. Clone this repository to your computer.
2. Open a terminal in the project folder and run `npm install` to grab the dependencies.
3. Run `npm run build` to bundle the extension.
4. Open Firefox, navigate to `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on...**, and select `extension/manifest.json`.
