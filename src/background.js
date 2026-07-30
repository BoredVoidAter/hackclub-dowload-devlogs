import JSZip from 'jszip';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'DOWNLOAD_DEVLOGS') {
    handleDownload(request.devlogs, request.format)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  }
});

async function handleDownload(devlogs, format) {
  const zip = new JSZip();

  for (let i = 0; i < devlogs.length; i++) {
    const log = devlogs[i];
    const dateStr = new Date(log.timestamp).toISOString().split('T')[0];
    const cleanAuthor = log.author.replace(/[^a-z0-9]/gi, '_');
    const cleanProject = log.project.replace(/[^a-z0-9]/gi, '_');
    
    const folderName = `${dateStr}-${cleanAuthor}-${cleanProject}-${i}`;
    const folder = zip.folder(folderName);
    
    const content = log.text;
    folder.file('devlog.txt', content);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const base64Url = await blobToBase64(zipBlob);

  chrome.downloads.download({
    url: base64Url,
    filename: 'stardance-devlogs.zip',
    saveAs: true
  });
}
