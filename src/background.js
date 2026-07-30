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
  return md.replace(/<[^>]+>/g, '');
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'DOWNLOAD_DEVLOGS') {
    handleDownload(request.devlogs, request.format)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; 
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
    const assets = folder.folder('assets');
    
    let content = '';
    let ext = format;

    if (format === 'html') {
      content = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${log.project}</title></head><body>`;
      content += `<h1>${log.project}</h1><h3>by @${log.author}</h3><p><i>${log.timestamp}</i></p>`;
      content += `<div>${log.html}</div>`;
    } else if (format === 'txt') {
      content = `Project: ${log.project}\nAuthor: @${log.author}\nDate: ${log.timestamp}\n\n${log.text}`;
    } else {
      ext = 'md';
      content = `# ${log.project}\n**By:** @${log.author}\n**Date:** ${log.timestamp}\n\n${htmlToMarkdown(log.html)}`;
    }

    // Fetch Standard Images
    let assetIndex = 1;
    for (const imgUrl of log.images) {
      try {
        const res = await fetch(imgUrl);
        const blob = await res.blob();
        const fileExt = imgUrl.split('.').pop().split('?')[0] || 'png';
        const filename = `image-${assetIndex}.${fileExt}`;
        assets.file(filename, blob);

        if (format === 'md') content += `\n\n![Attached Image ${assetIndex}](assets/${filename})`;
        else if (format === 'html') content += `<br><img src="assets/${filename}" style="max-width: 100%;">`;
        assetIndex++;
      } catch (e) { console.error('Failed to fetch image', imgUrl); }
    }

    // Fetch Videos
    let vidIndex = 1;
    for (const vidUrl of log.videos) {
      try {
        const res = await fetch(vidUrl);
        const blob = await res.blob();
        const fileExt = vidUrl.split('.').pop().split('?')[0] || 'mp4';
        const filename = `video-${vidIndex}.${fileExt}`;
        assets.file(filename, blob);

        if (format === 'md') content += `\n\n[Attached Video ${vidIndex}](assets/${filename})`;
        else if (format === 'html') content += `<br><video src="assets/${filename}" controls style="max-width: 100%;"></video>`;
        vidIndex++;
      } catch (e) { console.error('Failed to fetch video', vidUrl); }
    }

    // Fetch Slack Emotes & replace inline
    for (const emote of log.emotes) {
      try {
        const res = await fetch(emote.src);
        const blob = await res.blob();
        const fileExt = emote.src.split('.').pop().split('?')[0] || 'png';
        const safeName = emote.alt.replace(/[^a-z0-9_-]/gi, '');
        const filename = `emote-${safeName}.${fileExt}`;
        assets.file(filename, blob);

        if (format === 'md') {
          content = content.replaceAll(emote.alt, `![${emote.alt}](assets/${filename})`);
        }
      } catch (e) { console.error('Failed to fetch emote', emote.src); }
    }

    if (format === 'html') content += `</body></html>`;
    
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
