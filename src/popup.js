document.getElementById('download-btn').addEventListener('click', async () => {
  const format = document.getElementById('format-select').value;
  const statusEl = document.getElementById('status');

  statusEl.textContent = 'Extracting from page...';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab) {
    statusEl.textContent = 'Error: Cannot access active tab.';
    return;
  }

  chrome.tabs.sendMessage(tab.id, { action: 'EXTRACT_DEVLOGS' }, (response) => {
    if (chrome.runtime.lastError || !response || !response.devlogs) {
      statusEl.textContent = 'No devlogs found. Are you on a Stardance page?';
      return;
    }

    if (response.devlogs.length === 0) {
      statusEl.textContent = 'No devlogs found on this page.';
      return;
    }

    statusEl.textContent = `Found ${response.devlogs.length} devlogs. Zipping...`;

    chrome.runtime.sendMessage({
      action: 'DOWNLOAD_DEVLOGS',
      devlogs: response.devlogs,
      format: format
    }, (bgResponse) => {
      if (bgResponse && bgResponse.success) {
        statusEl.textContent = 'Download started!';
      } else {
        statusEl.textContent = 'Error: ' + (bgResponse ? bgResponse.error : 'Unknown error');
      }
    });
  });
});
