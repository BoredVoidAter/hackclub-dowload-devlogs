function extractDevlogs() {
  const cards = document.querySelectorAll('article.feed-post-card');
  const devlogs = [];

  cards.forEach((card, index) => {
    const bodyEl = card.querySelector('.markdown-content');
    if (!bodyEl) return; // Not a standard devlog or ship post

    const authorEl = card.querySelector('.feed-post-card__author');
    const author = authorEl ? authorEl.innerText.trim().replace(/^@/, '') : 'unknown';
    
    const timeEl = card.querySelector('time');
    const timestamp = timeEl ? timeEl.getAttribute('datetime') : new Date().toISOString();
    
    const projectEl = card.querySelector('.feed-post-card__project');
    const project = projectEl ? projectEl.innerText.trim() : 'unknown-project';

    devlogs.push({
      id: `devlog-${index}`,
      author: author,
      timestamp: timestamp,
      project: project,
      html: bodyEl.innerHTML,
      text: bodyEl.innerText
    });
  });

  return devlogs;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_DEVLOGS') {
    sendResponse({ devlogs: extractDevlogs() });
  }
});
