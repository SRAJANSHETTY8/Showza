console.log("movie.js loaded");



const token = localStorage.getItem("showza_access_token");
const email = localStorage.getItem("showza_user_email");

const signinbtn = document.getElementById("signinbtn");
const profileContainer = document.getElementById("profileContainer");
const profileAvatar = document.getElementById("profileAvatar");
const profileEmail = document.getElementById("profileEmail");
const profileDropdown = document.getElementById("profileDropdown");



if (token && email && profileAvatar && profileEmail) {

    profileEmail.textContent = email;
    profileAvatar.textContent = email.substring(0, 2).toUpperCase();

    if (signinbtn) signinbtn.style.display = "none";
    if (profileContainer) profileContainer.style.display = "flex";
}



profileAvatar?.addEventListener("click", (e) => {
    e.stopPropagation(); 
    profileDropdown?.classList.toggle("show");
});



document.addEventListener("click", () => {
    profileDropdown?.classList.remove("show");
});



document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.removeItem("showza_access_token");
    localStorage.removeItem("showza_user_email");
    window.location.href = "login.html";
});




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




let moviesCache = null;

async function fetchMovies() {

    if (moviesCache) return moviesCache;

    try {

        const response = await fetch("http://127.0.0.1:8000/movies", {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.status === 401) {
            window.location.href = "login.html";
            return;
        }

        moviesCache = await response.json();
        return moviesCache;

    } catch (error) {
        console.log(error);
    }
}




window.openMovie = function(movieId) {
    window.location.href = `movieinfo.html?id=${movieId}`;
};




async function loadGenre(containerId, genreName) {

    const movies = await fetchMovies();
    const container = document.getElementById(containerId);

    if (!movies || !container || container.dataset.loaded === "true") return;

    let html = "";

    movies.forEach(movie => {

        if (movie.genre === genreName) {

            html += `
            <div class="movie-card">
                <div class="movie-poster">
                    <img src="${movie.movie_poster_url}" loading="lazy">
                    <div class="rating-badge">${movie.rating}</div>

                    <div class="movie-overlay">
                        <button class="watch-btn" data-id="${movie.id}">
                            Book Now
                        </button>
                    </div>
                </div>

                <div class="movie-info">
                    <h3>${movie.movie_name}</h3>
                    <p>${movie.genre}</p>
                </div>
            </div>`;
        }
    });

    container.innerHTML = html;

    container.querySelectorAll(".watch-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            openMovie(btn.dataset.id);
        });
    });

    container.dataset.loaded = "true";
}




const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if (!entry.isIntersecting) return;

        const section = entry.target.id;

        if (section === "action") loadGenre("actionContainer", "Action");
        if (section === "scifi") loadGenre("scifiContainer", "Sci-Fi");
        if (section === "romance") loadGenre("romanceContainer", "Romance");
        if (section === "thriller") loadGenre("thrillerContainer", "Thriller");

    });

}, { threshold: 0.3 });

["action","scifi","romance","thriller"].forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
});




const navLinks = document.querySelectorAll(".nav-links a");

navLinks.forEach(link => {

    const currentPage = window.location.pathname.split("/").pop();

    if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
    }
});
