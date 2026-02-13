

const token = localStorage.getItem('showza_access_token');
const email = localStorage.getItem('showza_user_email');

const signinbtn = document.getElementById('signinbtn');
const profileContainer = document.getElementById('profileContainer');
const profileAvatar = document.getElementById("profileAvatar");
const profileEmail = document.getElementById("profileEmail");

if (token && email && profileAvatar && profileEmail) {
    profileEmail.textContent = email;
    profileAvatar.textContent = email.substring(0, 2).toUpperCase();

    if (signinbtn) signinbtn.style.display = "none";
    if (profileContainer) profileContainer.style.display = "flex";
}

if (profileAvatar) {
    profileAvatar.addEventListener("click", () => {
        const dropdown = document.getElementById("profileDropdown");
        if (dropdown) dropdown.classList.toggle("show");
    });
}

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("showza_access_token");
        localStorage.removeItem("showza_user_email");
        window.location.href = "login.html";
    });
}




const cityDropdown = document.querySelector(".city-dropdown");

if (cityDropdown) {

    const savedCity = localStorage.getItem("showza_user_city");

    if (savedCity) {
        cityDropdown.value = savedCity;
    } else {
        localStorage.setItem("showza_user_city", cityDropdown.value);
    }

    cityDropdown.addEventListener("change", () => {
        localStorage.setItem("showza_user_city", cityDropdown.value);
    });
}




function getMovieId() {
    const params = new URLSearchParams(window.location.search);
    return params.get("id");
}

async function loadMovieDetails() {

    try {

        const movieId = getMovieId();
        if (!movieId) return;

        const token = localStorage.getItem("showza_access_token");

        const response = await fetch(
            `http://127.0.0.1:8000/movies/${movieId}`,
            {
                headers: { Authorization: `Bearer ${token}` }
            }
        );

        if (!response.ok) return;

        const movie = await response.json();
        fillMovieData(movie);

    } catch (error) {
        console.log(error);
    }
}

function fillMovieData(movie) {

    if (!movie) return;

    const words = movie.movie_name.split(" ");

    const white = document.getElementById("movieTitleWhite");
    const accent = document.getElementById("movieTitleAccent");
    const rating = document.getElementById("movieRating");
    const duration = document.getElementById("movieDuration");
    const year = document.getElementById("movieYear");
    const description = document.getElementById("movieDescription");
    const poster = document.getElementById("moviePoster");
    const genre = document.getElementById("movieGenre");

    if (white) white.textContent = words[0];
    if (accent) accent.textContent = words.slice(1).join(" ");
    if (rating) rating.textContent = movie.rating;
    if (duration) duration.textContent = movie.watching_hours + " hrs";
    if (year) year.textContent = new Date(movie.released_on).getFullYear();
    if (description) description.textContent = movie.description;
    if (poster) poster.src = movie.movie_poster_url;
    if (genre) genre.textContent = movie.genre;

    const watchBtn = document.querySelector(".btn-watch");
    if (watchBtn) {
        watchBtn.onclick = () => {
            window.open(movie.Trailer_link, "_blank");
        };
    }

    const bookBtn = document.querySelector(".btn-book");
    if (bookBtn) {
        bookBtn.onclick = () => {

            const city =
                localStorage.getItem("showza_user_city") ||
                document.querySelector(".city-dropdown")?.value ||
                "Bengaluru";

            window.location.href =
                `showtime.html?movie=${movie.id}&city=${encodeURIComponent(city)}`;
        };
    }
}



function openMovie(id) {
    window.location.href = `movieinfo.html?id=${id}`;
}

async function loadTrendingMovies() {

    try {

        const token = localStorage.getItem("showza_access_token");

        const response = await fetch("http://127.0.0.1:8000/movies", {
            headers: { Authorization: `Bearer ${token}` }
        });

        const movies = await response.json();

        const container = document.getElementById("trendingContainer");
        if (!container) return;

        let html = "";

        movies.slice(0, 4).forEach(movie => {

            html += `
            <article class="movie-card" onclick="openMovie(${movie.id})">

                <div class="card-image-wrapper">
                    <img src="${movie.movie_poster_url}" class="card-image">

                    <div class="card-overlay">
                        <div class="card-rating">
                            ${movie.rating}
                        </div>
                    </div>

                </div>

                <div class="card-info">
                    <h3 class="card-title">${movie.movie_name}</h3>
                    <p class="card-meta">
                        ${movie.genre} • ${new Date(movie.released_on).getFullYear()}
                    </p>
                </div>

            </article>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.log(error);
    }
}




document.addEventListener("DOMContentLoaded", () => {
    loadMovieDetails();
    loadTrendingMovies();
});
