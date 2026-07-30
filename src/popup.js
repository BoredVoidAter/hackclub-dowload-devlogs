import JSZip from 'jszip';

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

function fetchAssetViaBackground(url) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'FETCH_ASSET', url }, (response) => {
      if (response && response.base64) resolve(response.base64);
      else reject(new Error(response?.error || 'Unknown fetch error'));
    });
  });
}

document.getElementById('download-btn').addEventListener('click', async () => {
  const format = document.getElementById('format-select').value;
  const statusEl = document.getElementById('status');
  const btnEl = document.getElementById('download-btn');

  btnEl.disabled = true;
  statusEl.textContent = 'Scanning page for devlogs...';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    statusEl.textContent = 'Error: Cannot access active tab.';
    btnEl.disabled = false;
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_DEVLOGS' }, async (response) => {
    if (chrome.runtime.lastError || !response || !response.devlogs) {
      statusEl.textContent = 'No devlogs found. Are you on a Stardance page?';
      btnEl.disabled = false;
      return;
    }

    const devlogs = response.devlogs;
    if (devlogs.length === 0) {
      statusEl.textContent = 'No devlogs found on this page.';
      btnEl.disabled = false;
      return;
    }

    try {
      const zip = new JSZip();

      for (let i = 0; i < devlogs.length; i++) {
        const log = devlogs[i];
        statusEl.textContent = `Processing devlog ${i + 1} of ${devlogs.length}...`;
        
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

        // Fetch Images
        let assetIndex = 1;
        for (const imgUrl of log.images) {
          try {
            const base64Data = await fetchAssetViaBackground(imgUrl);
            const fileExt = imgUrl.split('.').pop().split('?')[0] || 'png';
            const filename = `image-${assetIndex}.${fileExt}`;
            
            assets.file(filename, base64Data.split(',')[1], { base64: true });

            if (format === 'md') content += `\n\n![Attached Image ${assetIndex}](assets/${filename})`;
            else if (format === 'html') content += `<br><img src="assets/${filename}" style="max-width: 100%;">`;
            assetIndex++;
          } catch (e) { console.error('Image fetch failed', e); }
        }

        // Fetch Videos
        let vidIndex = 1;
        for (const vidUrl of log.videos) {
          try {
            const base64Data = await fetchAssetViaBackground(vidUrl);
            const fileExt = vidUrl.split('.').pop().split('?')[0] || 'mp4';
            const filename = `video-${vidIndex}.${fileExt}`;
            
            assets.file(filename, base64Data.split(',')[1], { base64: true });

            if (format === 'md') content += `\n\n[Attached Video ${vidIndex}](assets/${filename})`;
            else if (format === 'html') content += `<br><video src="assets/${filename}" controls style="max-width: 100%;"></video>`;
            vidIndex++;
          } catch (e) { console.error('Video fetch failed', e); }
        }

        // Fetch Emotes
        for (const emote of log.emotes) {
          try {
            const base64Data = await fetchAssetViaBackground(emote.src);
            const fileExt = emote.src.split('.').pop().split('?')[0] || 'png';
            const safeName = emote.alt.replace(/[^a-z0-9_-]/gi, '');
            const filename = `emote-${safeName}.${fileExt}`;
            
            assets.file(filename, base64Data.split(',')[1], { base64: true });

            if (format === 'md') {
              content = content.replaceAll(emote.alt, `![${emote.alt}](assets/${filename})`);
            }
          } catch (e) { console.error('Emote fetch failed', e); }
        }

        if (format === 'html') content += `</body></html>`;
        folder.file(`devlog.${ext}`, content);
      }

      statusEl.textContent = 'Generating ZIP...';
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const downloadUrl = URL.createObjectURL(zipBlob);

      // Create a native link element to trigger the download directly from the popup
      // This completely bypasses Firefox's restrictions on chrome.downloads.download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = 'stardance-devlogs.zip';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }, 1000);

      statusEl.textContent = 'Download started!';
    } catch (err) {
      statusEl.textContent = `Error: ${err.message}`;
    } finally {
      btnEl.disabled = false;
    }
  });
});
