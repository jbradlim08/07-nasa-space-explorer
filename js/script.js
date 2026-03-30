// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const imageModal = document.getElementById('imageModal');
const modalCloseButton = document.getElementById('modalClose');
const modalImage = document.getElementById('modalImage');
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

function openModal(item) {
  modalImage.src = item.hdurl || item.url;
  modalImage.alt = item.title;
  modalTitle.textContent = item.title;
  modalDate.textContent = item.date;
  modalExplanation.textContent = item.explanation || 'No explanation available.';

  imageModal.classList.add('is-open');
  imageModal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  imageModal.classList.remove('is-open');
  imageModal.setAttribute('aria-hidden', 'true');
}

function renderGallery(items) {
  if (!items.length) {
    renderMessage('No image results were returned for this date range.');
    return;
  }

  const cards = items.map((item) => `
    <article class="gallery-item" data-date="${item.date}" tabindex="0" role="button" aria-label="Open details for ${escapeHtml(item.title)}">
      <img src="${item.url}" alt="${escapeHtml(item.title)}" loading="lazy" />
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

  renderMessage('Loading space images...');

  const url = `https://api.nasa.gov/planetary/apod?api_key=${nasaApiKey}&start_date=${startDate}&end_date=${endDate}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const data = await response.json();
    const items = Array.isArray(data) ? data : [data];
    const filteredItems = items
      .filter((item) => item.media_type === 'image' && item.url)
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
