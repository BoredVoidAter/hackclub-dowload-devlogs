// Background script is intentionally left empty.
// In Firefox MV3, the popup runs in the extension context and inherits 
// the <all_urls> host_permissions, allowing it to fetch external media directly 
// without needing this background script as a CORS proxy.

console.log("Devlog Downloader background script initialized.");
