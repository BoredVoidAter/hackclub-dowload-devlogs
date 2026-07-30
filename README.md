# Hack Club Devlog Downloader (Firefox Extension)

Firefox extension that downloads hackclub devlogs in a selected format. Tested with stardance.

## Installation
### Mozilla Webstore
[url]

### Github Actions
1. Go to the **Actions** tab in this repository.
2. Click the latest successful workflow run.
3. Scroll down to **Artifacts** and download `hackclub-devlog-downloader`.
4. Extract the `.zip` file.
5. In Firefox, go to `about:debugging#/runtime/this-firefox` -> **Load Temporary Add-on...** and select `manifest.json` from the extracted folder.

### Build Locally
1. Clone this repository to your computer.
2. Run `npm install` and `npm run build`.
3. Open Firefox, navigate to `about:debugging#/runtime/this-firefox`, click **Load Temporary Add-on...**, and select `extension/manifest.json`.
