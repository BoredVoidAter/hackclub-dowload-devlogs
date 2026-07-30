import JSZip from 'jszip';

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function htmlToMarkdown(html) {
  let md = html.replace(/<br\s*\/?>/gi, '\n');
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  md = md.replace(/<em>(.*?)<\/em>/gi, '*$1*');
  md = md.replace(/<i>(.*?)<\/i>/gi, '*$1*');
  md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');
  md = md.replace(/<a href="(.*?)".*?>(.*?)<\/a>/gi, '[$2]($1)');
  md = md.replace(/<p>(.*?)<\/p>/gi, '$1\n\n');
  return md.replace(/<[^>]+>/g, ''); // strip remaining tags safely
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
    
    let content = '';
    let ext = format;

    if (format === 'html') {
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${log.project}</title></head><body>`;
      content += `<h1>${log.project}</h1><h3>by @${log.author}</h3><p><i>${log.timestamp}</i></p>`;
      content += `<div>${log.html}</div></body></html>`;
    } else if (format === 'txt') {
      content = `Project: ${log.project}\nAuthor: @${log.author}\nDate: ${log.timestamp}\n\n${log.text}`;
    } else {
      ext = 'md';
      content = `# ${log.project}\n**By:** @${log.author}\n**Date:** ${log.timestamp}\n\n${htmlToMarkdown(log.html)}`;
    }

    folder.file(`devlog.${ext}`, content);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const base64Url = await blobToBase64(zipBlob);

  chrome.downloads.download({
    url: base64Url,
    filename: 'stardance-devlogs.zip',
    saveAs: true
  });
}
