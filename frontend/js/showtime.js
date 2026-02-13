

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
    profileAvatar.addEventListener("click", () => {
        document.getElementById("profileDropdown")?.classList.toggle("show");
    });
}

document.getElementById("logoutBtn")?.addEventListener("click", () => {

    localStorage.removeItem("showza_access_token");
    localStorage.removeItem("showza_user_email");

    window.location.href = "login.html";
});




function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function getParams() {

    const params = new URLSearchParams(window.location.search);

    return {
        movieId: params.get("movie"),
        city: params.get("city")
    };
}


async function loadShowtimeData(movieId, city) {

    if (!movieId || !city) return;

    try {

        
        const movieRes = await fetch(
            `http://127.0.0.1:8000/movies/${movieId}`,
            { headers: authHeaders() }
        );

        const movie = await movieRes.json();
        fillMovieInfo(movie);

        
        const theatreRes = await fetch(
            `http://127.0.0.1:8000/theaters/${city}`,
            { headers: authHeaders() }
        );

        const theatres = await theatreRes.json();

        
        const showtimeRes = await fetch(
            `http://127.0.0.1:8000/showtimes`,
            { headers: authHeaders() }
        );

        const showtimes = await showtimeRes.json();

        
        const now = new Date();

        const filteredShows = showtimes
            .filter(s => {

                if (Number(s.Movie_id) !== Number(movieId)) return false;

                const showDate = new Date(s.Showtime);

                return showDate >= now;
            })
            .sort((a, b) =>
                new Date(a.Showtime) - new Date(b.Showtime)
            );

        fillTheatres(theatres, filteredShows, city);

    } catch (error) {
        console.error("Showtime Load Error:", error);
    }
}




function fillMovieInfo(movie) {

    document.querySelector(".movie-poster").src = movie.movie_poster_url;
    document.querySelector(".movie-title").textContent = movie.movie_name;

    document.querySelector(".rating").textContent =
        `☆ ${movie.rating}/10`;

    document.querySelector(".duration").textContent =
        movie.watching_hours + " hrs";

    document.querySelector(".genre").textContent =
        movie.genre;

    document.querySelector(".movie-description").textContent =
        movie.description;
}




function fillTheatres(theatres, showtimes, city) {

    const section = document.querySelector(".theaters-section");

    let html = `<h2 class="section-title">Now Playing In Theaters</h2>`;

    let found = false;

    theatres.forEach(theatre => {

        const theatreShows = showtimes.filter(
            show => Number(show.Theater_id) === Number(theatre.id)
        );

        if (!theatreShows.length) return;

        found = true;

        html += `
        <div class="theater-card">

            <div class="theater-header">
                <div class="theater-info">
                    <h3 class="theater-name">${theatre.Theater_name}</h3>
                    <p class="theater-address">${theatre.Theater_location}</p>
                </div>
            </div>

            <div class="showtimes-container">
                <div class="showtimes-row">
        `;

        theatreShows.forEach(show => {

            const dt = new Date(show.Showtime);

            const date = dt.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric"
            });

            const time = dt.toLocaleTimeString("en-IN", {
                hour: "2-digit",
                minute: "2-digit"
            });

            html += `
            <a href="booking.html?show=${show.id}&city=${city}" class="showtime-btn">
                <span class="time">${date} • ${time}</span>
                <span class="price">₹${show.Standard_Seat_price}</span>
            </a>
            `;
        });

        html += `
                </div>
            </div>
        </div>
        `;
    });

    if (!found) {
        html += `
        <p style="margin-top:20px;color:#aaa;">
            No upcoming showtimes found for this movie in ${city}
        </p>`;
    }

    section.innerHTML = html;
}




document.addEventListener("DOMContentLoaded", () => {

    const { movieId, city } = getParams();

    const cityDropdown = document.querySelector(".city-dropdown");

    if (cityDropdown && city) {
        cityDropdown.value = city;
    }

    loadShowtimeData(movieId, city);

    cityDropdown?.addEventListener("change", () => {

        const newCity = cityDropdown.value;

        window.history.replaceState(
            null,
            "",
            `?movie=${movieId}&city=${encodeURIComponent(newCity)}`
        );

        loadShowtimeData(movieId, newCity);
    });

});
