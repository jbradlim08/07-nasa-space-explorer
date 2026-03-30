// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const imageModal = document.getElementById('imageModal');
const modalCloseButton = document.getElementById('modalClose');
const modalMedia = document.getElementById('modalMedia');
const modalTitle = document.getElementById('modalTitle');
const modalDate = document.getElementById('modalDate');
const modalExplanation = document.getElementById('modalExplanation');

const nasaApiKey = 'gFg9csNJS3YMnJBwbM8WVdP1iVGEUIr7EdFB0SDf';
let currentGalleryItems = [];

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

function renderMessage(message) {
  gallery.innerHTML = `
    <div class="placeholder">
      <p>${message}</p>
    </div>
  `;
}

function escapeHtml(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getVideoEmbedUrl(url) {
  try {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.replace('www.', '');

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      if (parsedUrl.pathname === '/watch') {
        const videoId = parsedUrl.searchParams.get('v');
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }

      if (parsedUrl.pathname.startsWith('/embed/')) {
        return parsedUrl.toString();
      }
    }

    if (host === 'youtu.be') {
      const videoId = parsedUrl.pathname.replace('/', '');
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }

    if (host === 'player.vimeo.com') {
      return parsedUrl.toString();
    }

    if (host === 'vimeo.com') {
      const videoId = parsedUrl.pathname.replace('/', '');
      return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
    }
  } catch (error) {
    return null;
  }

  return null;
}

function getGalleryMediaMarkup(item) {
  if (item.media_type === 'video') {
    const previewUrl = item.thumbnail_url || '';
    const preview = previewUrl
      ? `<img src="${previewUrl}" alt="${escapeHtml(item.title)} video preview" loading="lazy" />`
      : `<div class="gallery-video-fallback">Video Entry</div>`;

    return `
      <div class="gallery-media video-card">
        ${preview}
        <span class="media-badge">VIDEO</span>
      </div>
    `;
  }

  return `
    <div class="gallery-media">
      <img src="${item.url}" alt="${escapeHtml(item.title)}" loading="lazy" />
    </div>
  `;
}

function openModal(item) {
  if (item.media_type === 'video') {
    const embedUrl = getVideoEmbedUrl(item.url);

    if (embedUrl) {
      modalMedia.innerHTML = `
        <iframe
          class="modal-video"
          src="${embedUrl}"
          title="${escapeHtml(item.title)}"
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen
        ></iframe>
        <a class="modal-video-link" href="${item.url}" target="_blank" rel="noopener noreferrer">Open video in new tab</a>
      `;
    } else {
      modalMedia.innerHTML = `
        <div class="modal-video-fallback">This APOD entry is a video.</div>
        <a class="modal-video-link" href="${item.url}" target="_blank" rel="noopener noreferrer">Open video link</a>
      `;
    }
  } else {
    const imageUrl = item.hdurl || item.url;
    modalMedia.innerHTML = `<img class="modal-image" src="${imageUrl}" alt="${escapeHtml(item.title)}" />`;
  }

  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = item.explanation || 'No explanation available.';

  imageModal.classList.add('is-open');
  imageModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  imageModal.classList.remove('is-open');
  imageModal.setAttribute('aria-hidden', 'true');
  modalMedia.innerHTML = '';
}

function renderGallery(items) {
  if (!items.length) {
    renderMessage('No APOD entries were returned for this date range.');
    return;
  }

  const cards = items.map((item) => `
    <article class="gallery-item" data-date="${item.date}" tabindex="0" role="button" aria-label="Open details for ${escapeHtml(item.title)}">
      ${getGalleryMediaMarkup(item)}
      <p><strong>${escapeHtml(item.title)}</strong></p>
      <p>${escapeHtml(item.date)}</p>
    </article>
  `);

  gallery.innerHTML = cards.join('');
}

async function getSpaceImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    renderMessage('Please select both a start date and an end date.');
    return;
  }

  renderMessage('🔄 Loading space photos…');

  const url = `https://api.nasa.gov/planetary/apod?api_key=${nasaApiKey}&start_date=${startDate}&end_date=${endDate}&thumbs=true`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : [data];
    const filteredItems = items
      .filter((item) => (item.media_type === 'image' || item.media_type === 'video') && item.url)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    currentGalleryItems = filteredItems;
    renderGallery(filteredItems);
  } catch (error) {
    renderMessage('Unable to load images right now. Please try again.');
  }
}

getImagesButton.addEventListener('click', getSpaceImages);

gallery.addEventListener('click', (event) => {
  const card = event.target.closest('.gallery-item');

  if (!card) {
    return;
  }

  const selectedItem = currentGalleryItems.find((item) => item.date === card.dataset.date);

  if (selectedItem) {
    openModal(selectedItem);
  }
});

gallery.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter' && event.key !== ' ') {
    return;
  }

  const card = event.target.closest('.gallery-item');

  if (!card) {
    return;
  }

  event.preventDefault();
  const selectedItem = currentGalleryItems.find((item) => item.date === card.dataset.date);

  if (selectedItem) {
    openModal(selectedItem);
  }
});

modalCloseButton.addEventListener('click', closeModal);

imageModal.addEventListener('click', (event) => {
  if (event.target === imageModal) {
    closeModal();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && imageModal.classList.contains('is-open')) {
    closeModal();
  }
});
