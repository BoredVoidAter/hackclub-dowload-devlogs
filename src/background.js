// The background script now acts strictly as a CORS proxy so we can fetch external 
// images/videos (like AWS S3) without hitting cross-origin errors in the popup.
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'FETCH_ASSET') {
    fetch(request.url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        const reader = new FileReader();
        reader.onloadend = () => sendResponse({ base64: reader.result });
        reader.onerror = () => sendResponse({ error: 'Failed to read blob' });
        reader.readAsDataURL(blob);
      })
      .catch(err => sendResponse({ error: err.message }));
    return true; // Keep message channel open for async response
  }
});
