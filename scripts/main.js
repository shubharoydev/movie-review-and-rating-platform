const API_KEY = '326b9e68';
const API_URL = 'https://www.omdbapi.com/?apikey=' + API_KEY;

const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const movieDetails = document.getElementById('movie-details');
const myReviews = document.getElementById('my-reviews');
const reviewsList = document.getElementById('reviews-list');
const homeBtn = document.querySelector('nav #home-btn');
const myReviewsBtn = document.querySelector('nav #my-reviews-btn');
const loading = document.getElementById('loading');
const errorDiv = document.getElementById('error');

let currentMovieId = null;
let reviews = JSON.parse(localStorage.getItem('movieReviews')) || {};

// Navigation
homeBtn.addEventListener('click', showHome);
myReviewsBtn.addEventListener('click', showMyReviews);

function showHome() {
    document.querySelector('.hero').style.display = 'flex';
    searchResults.classList.add('hidden');
    movieDetails.classList.add('hidden');
    myReviews.classList.add('hidden');
}

function showMyReviews() {
    document.querySelector('.hero').style.display = 'none';
    searchResults.classList.add('hidden');
    movieDetails.classList.add('hidden');
    myReviews.classList.remove('hidden');
    renderMyReviews();
}

function renderMyReviews() {
    reviewsList.innerHTML = '';
    Object.keys(reviews).forEach(imdbID => {
        const movie = reviews[imdbID];
        const card = document.createElement('div');
        card.classList.add('movie-card');
        card.innerHTML = `
            <img src="${movie.poster}" alt="${movie.title}">
            <h3>${movie.title} (${movie.year})</h3>
            <p>Rating: ${movie.rating} ⭐</p>
            <p>Review: ${movie.review || 'No review'}</p>
        `;
        reviewsList.appendChild(card);
    });
}

// Search
searchBtn.addEventListener('click', searchMovies);
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchMovies();
});

async function searchMovies() {
    const query = searchInput.value.trim();
    if (!query) return;

    showLoading(true);
    errorDiv.classList.add('hidden');
    document.querySelector('.hero').style.display = 'none';

    try {
        const res = await fetch(`${API_URL}&s=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data.Response === 'True') {
            renderSearchResults(data.Search);
        } else {
            showError(data.Error);
        }
    } catch (err) {
        showError('Failed to fetch movies. Check your connection.');
    } finally {
        showLoading(false);
    }
}

function renderSearchResults(movies) {
    searchResults.classList.remove('hidden');
    searchResults.innerHTML = '';
    movies.forEach(movie => {
        const card = document.createElement('div');
        card.classList.add('movie-card');
        card.innerHTML = `
            <img src="${movie.Poster !== 'N/A' ? movie.Poster : 'assets/images/placeholder-poster.jpg'}" alt="${movie.Title}">
            <h3>${movie.Title} (${movie.Year})</h3>
        `;
        card.addEventListener('click', () => showMovieDetails(movie.imdbID));
        searchResults.appendChild(card);
    });
}

async function showMovieDetails(imdbID) {
    showLoading(true);
    currentMovieId = imdbID;

    try {
        const res = await fetch(`${API_URL}&i=${imdbID}`);
        const data = await res.json();

        if (data.Response === 'True') {
            document.getElementById('movie-poster').src = data.Poster !== 'N/A' ? data.Poster : 'assets/images/placeholder-poster.jpg';
            document.getElementById('movie-title').textContent = data.Title;
            document.getElementById('movie-year').textContent = `Year: ${data.Year}`;
            document.getElementById('movie-plot').textContent = `Plot: ${data.Plot}`;

            const saved = reviews[imdbID] || { rating: 0, review: '' };
            setStars(saved.rating);
            document.getElementById('review-text').value = saved.review;

            searchResults.classList.add('hidden');
            movieDetails.classList.remove('hidden');
        } else {
            showError(data.Error);
        }
    } catch (err) {
        showError('Failed to fetch movie details.');
    } finally {
        showLoading(false);
    }
}

// Star Rating
const stars = document.querySelectorAll('#star-rating i');
stars.forEach(star => {
    star.addEventListener('click', () => {
        const value = parseInt(star.dataset.value);
        setStars(value);
    });
});

function setStars(value) {
    stars.forEach((s, index) => {
        s.classList.toggle('fas', index < value);
        s.classList.toggle('far', index >= value);
    });
}

function getRating() {
    return Array.from(stars).filter(s => s.classList.contains('fas')).length;
}

// Save Review
document.getElementById('save-review-btn').addEventListener('click', saveReview);

async function saveReview() {
    if (!currentMovieId) return;

    const rating = getRating();
    const review = document.getElementById('review-text').value.trim();

    const res = await fetch(`${API_URL}&i=${currentMovieId}`);
    const data = await res.json();

    reviews[currentMovieId] = {
        title: data.Title,
        year: data.Year,
        poster: data.Poster,
        rating,
        review
    };

    localStorage.setItem('movieReviews', JSON.stringify(reviews));
    alert('Review saved!');
    showHome();
}

function showLoading(show) {
    loading.classList.toggle('hidden', !show);
}

function showError(msg) {
    errorDiv.textContent = msg;
    errorDiv.classList.remove('hidden');
}

// Initial view
showHome();