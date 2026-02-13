let ALL_MOVIES = [];
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
    if (profileContainer) profileContainer.style.display = "block";
}

if (profileAvatar) {
    profileAvatar.addEventListener("click", (e) => {
        e.stopPropagation();
        document.getElementById("profileDropdown")?.classList.toggle("show");
    });

    document.addEventListener("click", () => {
        document.getElementById("profileDropdown")?.classList.remove("show");
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
        location.reload();
    });
}

function getSelectedCity() {
    return localStorage.getItem("showza_user_city") || "Bengaluru";
}



const navLinks = document.querySelectorAll(".nav-links a");

const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

navLinks.forEach(link => {
    if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
    }
});

function openMovie(id) {
    window.location.href = `movieinfo.html?id=${id}`;
}



document.addEventListener("DOMContentLoaded", () => {

    let currentSlide = 0;

    const slides = document.querySelectorAll('.carousel-slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.querySelector('.carousel-arrow.left');
    const nextBtn = document.querySelector('.carousel-arrow.right');

    const totalSlides = slides.length;

    function updateCarousel() {

        slides.forEach((slide, index) => {
            slide.classList.toggle('active', index === currentSlide);
        });

        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }

    function moveCarousel(direction) {
        currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
        updateCarousel();
    }

    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            currentSlide = index;
            updateCarousel();
        });
    });

    if (prevBtn) prevBtn.addEventListener('click', () => moveCarousel(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => moveCarousel(1));

    setInterval(() => moveCarousel(1), 4000);
});



const reveals = document.querySelectorAll('.reveal');

const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
        }
    });
}, { threshold: 0.15 });

reveals.forEach(el => observer.observe(el));



const searchBtn = document.querySelector('.search-btn');
const searchSection = document.querySelector('#searchSection');
const searchInput = document.querySelector('.search-box input');

if (searchBtn && searchSection) {
    searchBtn.addEventListener('click', () => {

        searchSection.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        if (searchInput) {
            setTimeout(() => searchInput.focus(), 500);
        }
    });
}
if (searchInput) {
    searchInput.addEventListener("input", () => {

        const value = searchInput.value.toLowerCase();

        const filtered = ALL_MOVIES.filter(movie =>
            movie.movie_name.toLowerCase().includes(value) ||
            movie.genre.toLowerCase().includes(value) ||
            movie.language.toLowerCase().includes(value)
        );

        renderFilteredMovies(filtered);
    });
}
window.addEventListener("load", () => {

    const carousel = document.querySelector(".carousel-container");

    if (carousel) {
        carousel.classList.add("loaded");
    }

});




async function loadMovies() {

    try {

        const token = localStorage.getItem("showza_access_token");
        const city = getSelectedCity();

        const response = await fetch("https://showza-vlhs.onrender.com/movies", {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const movies = await response.json();
        ALL_MOVIES = movies;


        const container = document.getElementById("moviesContainer");

        if (!container) return;

        let html = "";

        movies.forEach(movie => {

            html += `
            <div class="movie-card">
                <div class="movie-poster">
                    <img src="${movie.movie_poster_url}">
                    
                    <div class="rating-badge">
                        <span>${movie.rating}</span>
                    </div>

                    <div class="movie-overlay">
                        <button class="book-btn" data-id="${movie.id}">Book Now</button>
                    </div>
                </div>

                <div class="movie-info">
                    <h3>${movie.movie_name}</h3>
                    <span class="genre">${movie.genre}</span>
                </div>
            </div>`;
        });

        container.innerHTML = html;
        loadRecommendedMovies(movies);


        container.querySelectorAll(".book-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                const id = btn.dataset.id;
                window.location.href = `movieinfo.html?id=${id}&city=${city}`;
            });
        });

    } catch (error) {
        console.log(error);
    }
}

loadMovies();



function initMovieCarousel() {

    const grid = document.querySelector(".movies-grid");
    const leftArrow = document.querySelector(".movies-carousel .nav-arrow.left");
    const rightArrow = document.querySelector(".movies-carousel .nav-arrow.right");

    if (!grid || !leftArrow || !rightArrow) return;

    rightArrow.addEventListener("click", () => {
        grid.scrollBy({ left: 300, behavior: "smooth" });
    });

    leftArrow.addEventListener("click", () => {
        grid.scrollBy({ left: -300, behavior: "smooth" });
    });
}

initMovieCarousel();

function renderFilteredMovies(movies) {

    const container = document.getElementById("moviesContainer");
    if (!container) return;

    const city = getSelectedCity();

    let html = "";

    movies.forEach(movie => {

        html += `
        <div class="movie-card">
            <div class="movie-poster">
                <img src="${movie.movie_poster_url}">
                <div class="rating-badge">
                    <span>${movie.rating}</span>
                </div>

                <div class="movie-overlay">
                    <button class="book-btn" data-id="${movie.id}">
                        Book Now
                    </button>
                </div>
            </div>

            <div class="movie-info">
                <h3>${movie.movie_name}</h3>
                <span class="genre">${movie.genre}</span>
            </div>
        </div>`;
    });

    container.innerHTML = html;

    container.querySelectorAll(".book-btn").forEach(btn => {
        btn.onclick = () => {
            window.location.href =
                `movieinfo.html?id=${btn.dataset.id}&city=${city}`;
        };
    });
}
function loadRecommendedMovies(movies) {

    const container = document.getElementById("recommendedContainer");
    if (!container) return;

    const randomMovies = [...movies]
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);

    const city = getSelectedCity();

    let html = "";

    randomMovies.forEach(movie => {

        html += `
        <div class="movie-card">
            <div class="movie-poster">
                <img src="${movie.movie_poster_url}">

                <div class="movie-overlay">
                    <button class="book-btn" data-id="${movie.id}">
                        Book Now
                    </button>
                </div>
            </div>

            <div class="movie-info">
                <h3>${movie.movie_name}</h3>
                <span class="genre">${movie.genre}</span>
            </div>
        </div>`;
    });

    container.innerHTML = html;

    container.querySelectorAll(".book-btn").forEach(btn => {
        btn.onclick = () => {
            window.location.href =
                `movieinfo.html?id=${btn.dataset.id}&city=${city}`;
        };
    });
}
