// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const getImagesButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');

const nasaApiKey = 'gFg9csNJS3YMnJBwbM8WVdP1iVGEUIr7EdFB0SDf';

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

function renderGallery(items) {
  if (!items.length) {
    renderMessage('No image results were returned for this date range.');
    return;
  }

  const cards = items.map((item) => `
    <article class="gallery-item">
      <img src="${item.url}" alt="${item.title}" loading="lazy" />
      <p><strong>${item.title}</strong></p>
      <p>${item.date}</p>
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
    console.log(data)
    const filteredItems = data
      .filter((item) => item.media_type === 'image' && item.url)
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    renderGallery(filteredItems);
  } catch (error) {
    renderMessage('Unable to load images right now. Please try again.');
  }
}

getImagesButton.addEventListener('click', getSpaceImages);
