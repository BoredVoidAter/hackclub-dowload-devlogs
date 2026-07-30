function extractDevlogs() {
  // Only target actual Devlog posts and exclude clones hidden inside modal dialogs
  const cards = Array.from(document.querySelectorAll('article.feed-post-card[data-feed-engagement-post-type-value="Post::Devlog"]'))
    .filter(card => !card.closest('dialog'));

  const devlogs = [];

  cards.forEach((card, index) => {
    const bodyEl = card.querySelector('.markdown-content');
    if (!bodyEl) return;

    const authorEl = card.querySelector('.feed-post-card__author');
    const author = authorEl ? authorEl.innerText.trim().replace(/^@/, '') : 'unknown';
    
    const timeEl = card.querySelector('time');
    const timestamp = timeEl ? timeEl.getAttribute('datetime') : new Date().toISOString();
    
    const projectEl = card.querySelector('.feed-post-card__project');
    const project = projectEl ? projectEl.innerText.trim() : 'unknown-project';

    // Extract Media
    const images = Array.from(card.querySelectorAll('img.feed-post-card__image')).map(img => img.src);
    const videos = Array.from(card.querySelectorAll('video source, video.feed-post-card__video')).map(v => v.src).filter(Boolean);
    
    // Extract Slack Emotes
    const emotes = Array.from(bodyEl.querySelectorAll('img.slack-emote')).map(img => ({ 
      src: img.src, 
      alt: img.alt 
    }));

    devlogs.push({
      id: `devlog-${index}`,
      author: author,
      timestamp: timestamp,
      project: project,
      html: bodyEl.innerHTML,
      text: bodyEl.innerText,
      images: images,
      videos: videos,
      emotes: emotes
    });
  });

  return devlogs;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'EXTRACT_DEVLOGS') {
    sendResponse({ devlogs: extractDevlogs() });
  }
});
