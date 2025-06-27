// Constants for API endpoints
const API_URL = 'https://api.tvmaze.com/shows';

const watchlistUrl = 'http://localhost:3000/watchlist';

// Global movie storage
let allMovies = []; 

// When page loads
document.addEventListener('DOMContentLoaded', () => {
  // Fetch and show movies
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      allMovies = data;
      setGenres(data);
      showMovies(data);
      loadWatchlist();
    });

  // Search movies by name
  document.getElementById('search').addEventListener('input', e => {
    const term = e.target.value.toLowerCase();
    const filtered = allMovies.filter(m => m.name.toLowerCase().includes(term));
    showMovies(filtered);
  });


  // Filter movies by genre
  document.getElementById('genre-filter').addEventListener('change', () => {
    const genre = document.getElementById('genre-filter').value;
    const filtered = genre === 'all'
      ? allMovies
      : allMovies.filter(m => m.genres.includes(genre));
    showMovies(filtered);
  });


  // Theme toggle button
  const toggleBtn = document.getElementById('theme-toggle');
  const body = document.body;

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    body.classList.add('dark-mode');
    toggleBtn.textContent = 'Light Mode';
  }

  toggleBtn.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    const isDark = body.classList.contains('dark-mode');
    toggleBtn.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  });
});


// Create genre filter options
function setGenres(movies) {
  const select = document.getElementById('genre-filter');
  select.innerHTML = '<option value="all">All</option>';
  const genres = [...new Set(movies.flatMap(m => m.genres))];
  genres.forEach(genre => {
    const option = document.createElement('option');
    option.value = genre;
    option.textContent = genre;
    select.appendChild(option);
  });
}


// Display movies grouped by genre or filtered
function showMovies(movies) {
  const container = document.getElementById('movie-list');
  container.innerHTML = '';

  // TRENDING: Movies released after or in 2023
  const trending = movies.filter(m => {
    return m.premiered && new Date(m.premiered).getFullYear() <= 2023;
  });

  // POPULAR: Rating >= 8
  const popular = movies.filter(m => {
    return m.rating && m.rating.average >= 8;
  });

  // Render both sections
  renderSection('Trending', trending, container);
  renderSection('Popular', popular, container);
}


function renderSection(title, movies, container) {
  const section = document.createElement('div');
  section.className = 'mb-5';

  const heading = document.createElement('h3');
  heading.textContent = title;
  heading.classList.add('genre-heading', 'mt-4');
  section.appendChild(heading);

  if (movies.length === 0) {
    const noResults = document.createElement('p');
    noResults.textContent = `No ${title.toLowerCase()} movies found.`;
    section.appendChild(noResults);
  } else {
    const row = document.createElement('div');
    row.className = 'row';

    movies.forEach(movie => {
      const card = createMovieCard(movie);
      row.appendChild(card);
    });

    section.appendChild(row);
  }

  container.appendChild(section);
}


// Create a movie card element
function createMovieCard(movie) {
  const card = document.createElement('div');
  card.className = 'col-md-3 mb-3';

  card.innerHTML = `
    <div class="card h-100 shadow-sm">
      <img src="${movie.image?.medium || ''}" class="card-img-top" alt="${movie.name}">
      <div class="card-body">
        <h5 class="card-title">${movie.genres[0] || 'Genre'}: ${movie.name}</h5>
        <button class='btn btn-dark btn-sm'>Add to Watchlist</button>
      </div>
    </div>
  `;

  card.onclick = (e) => {
    if (e.target.tagName !== 'BUTTON') {
      showMovieDetails(movie);
    }
  };

  card.querySelector('button').onclick = (e) => {
    e.stopPropagation();
    addToWatchlist(movie);
  };

  return card;
}

// Show movie info in modal
function showMovieDetails(movie) {
  const details = document.getElementById('movie-details');
  const image = document.getElementById('movie-image');
  const addBtn = document.getElementById('add-to-watchlist-btn');

  const year = movie.premiered ? new Date(movie.premiered).getFullYear() : 'Unknown';
  const description = movie.summary
    ? movie.summary.replace(/<[^>]+>/g, '')
    : 'No description available.';

  details.innerHTML = `
    <h2>${movie.name} (${year})</h2>
    <p>${description}</p>
  `;

  image.src = movie.image?.medium || 'https://via.placeholder.com/210x295';
  image.alt = `${movie.name} Poster`;

  addBtn.onclick = () => addToWatchlist(movie);

  const modalElement = document.getElementById('staticBackdrop');
  const modalInstance = new bootstrap.Modal(modalElement);
  modalInstance.show();
}

// Add movie to watchlist if not already there
function addToWatchlist(movie) {
  movie.id = Number(movie.id);
  fetch(watchlistUrl)
    .then(res => res.json())
    .then(list => {
      const exists = list.some(item => Number(item.id) === movie.id);
      if (exists) {
        alert(`"${movie.name}" is already in your watchlist.`);
      } else {
        fetch(watchlistUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(movie)
        }).then(loadWatchlist);
      }
    });
}

// Load watchlist and show on page
function loadWatchlist() {
  fetch(watchlistUrl)
    .then(res => res.json())
    .then(list => {
      const ul = document.getElementById('watchlist');
      ul.innerHTML = '';

      list.forEach(movie => {
        const li = document.createElement('li');
        li.classList.add('mb-3', 'border', 'p-2', 'rounded', 'd-flex', 'align-items-start', 'gap-3');

        const year = movie.premiered ? new Date(movie.premiered).getFullYear() : 'Unknown';
        const description = movie.summary
          ? movie.summary.replace(/<[^>]+>/g, '').slice(0, 100) + '...'
          : 'No description available.';

        li.innerHTML = `
          <img src="${movie.image?.medium || 'https://via.placeholder.com/80x120'}" alt="${movie.name}" style="width: 80px; height: auto; border-radius: 4px;">
          <div style="flex: 1;">
            <strong>${movie.name}</strong> (${year})<br>
            <small>${description}</small>
          </div>
        `;

        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.classList.add('btn', 'btn-sm', 'btn-dark', 'ms-auto');
        delBtn.onclick = function (e) {
          e.stopPropagation();
          deleteFromWatchlist(Number(movie.id));
        };

        li.style.cursor = 'pointer';
        li.onclick = () => showMovieDetails(movie);

        li.appendChild(delBtn);
        ul.appendChild(li);
      });
    });
}

// Remove movie from watchlist
function deleteFromWatchlist(id) {
  fetch(`${watchlistUrl}/${id}`, {
    method: 'DELETE'
  })
    .then(res => {
      if (!res.ok) throw new Error('Delete failed');
      loadWatchlist();
    })
    .catch(err => console.error('Delete failed:', err));
}
