
const token = localStorage.getItem("showza_access_token");
const email = localStorage.getItem("showza_user_email");

const signinbtn = document.getElementById("signinbtn");
const profileContainer = document.getElementById("profileContainer");
const profileAvatar = document.getElementById("profileAvatar");
const profileEmail = document.getElementById("profileEmail");

if (token && email && profileAvatar && profileEmail) {
    profileEmail.textContent = email;
    profileAvatar.textContent = email.substring(0, 2).toUpperCase();

    if (signinbtn) signinbtn.style.display = "none";
    if (profileContainer) profileContainer.style.display = "block";
}



profileAvatar?.addEventListener("click", () => {
    document.getElementById("profileDropdown")?.classList.toggle("show");
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
});



function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function normalizeType(type) {
    return type?.toUpperCase();
}

function getSeatPrice(type) {
    return seatPrices[normalizeType(type)] || 0;
}

function getShowId() {
    return new URLSearchParams(window.location.search).get("show");
}

function getCity() {
    return new URLSearchParams(window.location.search).get("city");
}



let selectedSeats = [];
let seatPrices = {};
let currentShowtime = null;



async function loadShowtime() {

    const showId = getShowId();
    if (!showId) return;

    const res = await fetch("http://127.0.0.1:8000/showtimes");
    const shows = await res.json();

    const show = shows.find(s => Number(s.id) === Number(showId));
    if (!show) return;

    currentShowtime = show;

    seatPrices = {
        VIP: show.Vip_Seat_price,
        PREMIUM: show.Premium_Seat_price,
        STANDARD: show.Standard_Seat_price
    };

    const dt = new Date(show.Showtime);

    document.getElementById("showTime").textContent =
        `${dt.toLocaleDateString("en-IN")} • ${dt.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit"
        })}`;

    await loadMovie(show.Movie_id);
    await loadTheatre(show.Theater_id);
    await loadSeats(show.id);
}



async function loadMovie(movieId) {

    const res = await fetch(`http://127.0.0.1:8000/movies/${movieId}`);
    const movie = await res.json();

    document.getElementById("moviePoster").src = movie.movie_poster_url;
    document.getElementById("movieTitle").textContent = movie.movie_name;
    document.getElementById("movieRating").textContent = `☆ ${movie.rating}/10`;
    document.getElementById("movieDuration").textContent =
        movie.watching_hours + " hrs";
}



async function loadTheatre(theatreId) {

    const city = getCity();
    if (!city) return;

    const res = await fetch(`http://127.0.0.1:8000/theaters/${city}`);
    const theatres = await res.json();

    const theatre = theatres.find(t => Number(t.id) === Number(theatreId));
    if (!theatre) return;

    document.getElementById("theatreInfo").textContent =
        `${theatre.Theater_name} • ${theatre.Theater_location}`;
}



async function loadSeats(showId) {

    const res = await fetch("http://127.0.0.1:8000/seats");
    const allSeats = await res.json();

    const seats = allSeats.filter(
        s => Number(s.Showtime_id) === Number(showId)
    );

    renderSeats(seats);
}



function renderSeats(seats) {

    const container = document.getElementById("seatContainer");
    container.innerHTML = "";

    const grouped = { VIP: [], PREMIUM: [], STANDARD: [] };

    seats.forEach(seat => {
        grouped[normalizeType(seat.seat_type)]?.push(seat);
    });

    Object.keys(grouped).forEach(type => {

        const typeSeats = grouped[type];
        if (!typeSeats.length) return;

        const section = document.createElement("div");
        section.className = "seat-section";

        section.innerHTML = `
            <div style="text-align:center;margin-bottom:15px;">
                <h3>${type}</h3>
                <p>₹${getSeatPrice(type)}</p>
            </div>
        `;

        const rows = {};

        typeSeats.forEach(seat => {
            const row = seat.seat_number.charAt(0);
            if (!rows[row]) rows[row] = [];
            rows[row].push(seat);
        });

        Object.keys(rows).sort().forEach(rowLetter => {

            rows[rowLetter].sort(
                (a, b) =>
                    parseInt(a.seat_number.slice(1)) -
                    parseInt(b.seat_number.slice(1))
            );

            const rowDiv = document.createElement("div");
            rowDiv.className = "seat-row";

            rows[rowLetter].forEach(seat => {

                const seatDiv = document.createElement("div");
                seatDiv.className = "seat";
                seatDiv.textContent = seat.seat_number;

                if (seat.status === "Available") {
                    seatDiv.classList.add("available");
                    seatDiv.onclick = () => toggleSeat(seat, seatDiv);
                }
                else if (seat.status === "locked") {
                    seatDiv.classList.add("booked");
                    seatDiv.style.pointerEvents = "none";
                }
                else {
                    seatDiv.classList.add("booked");
                    seatDiv.style.pointerEvents = "none";
                }

                rowDiv.appendChild(seatDiv);
            });

            section.appendChild(rowDiv);
        });

        container.appendChild(section);
    });
}



async function toggleSeat(seat, seatDiv) {

    
    if (!token) {
        alert("Please login to book seats");
        window.location.href = "login.html";
        return;
    }

    const exists = selectedSeats.find(s => s.id === seat.id);

    if (exists) {
        selectedSeats = selectedSeats.filter(s => s.id !== seat.id);
        seatDiv.classList.remove("selected");
        updateSummary();
        return;
    }

    try {

        const res = await fetch(
            `http://127.0.0.1:8000/seatlock/${seat.id}`,
            { method: "POST", headers: authHeaders() }
        );

        if (res.status === 401) {
            alert("Session expired. Please login again.");
            window.location.href = "login.html";
            return;
        }

        if (!res.ok) {
            const err = await res.json();
            alert(err.detail || "Seat unavailable");
            return;
        }

        selectedSeats.push(seat);
        seatDiv.classList.add("selected");
        updateSummary();

    } catch (err) {
        console.error(err);
        alert("Something went wrong");
    }
}



function updateSummary() {

    const summary = document.getElementById("bookingSummary");
    const count = document.querySelector(".seats-count");
    const names = document.getElementById("selectedSeatsList");
    const priceEl = document.getElementById("totalPrice");
    const payBtn = document.getElementById("payButton");

    if (selectedSeats.length === 0) {
        summary?.classList.remove("active");
        count.textContent = "0 seats selected";
        names.textContent = "None";
        priceEl.textContent = "₹0";
        payBtn.disabled = true;
        return;
    }

    summary?.classList.add("active");
    count.textContent = `${selectedSeats.length} seats selected`;
    names.textContent = selectedSeats.map(s => s.seat_number).join(", ");

    const price = selectedSeats.reduce(
        (sum, s) => sum + getSeatPrice(s.seat_type), 0
    );

    priceEl.textContent = `₹${price}`;
    payBtn.disabled = false;
}



document.getElementById("payButton")?.addEventListener("click", () => {

    if (!currentShowtime || selectedSeats.length === 0) return;

    const seatIds = selectedSeats.map(s => s.id).join(",");

    window.location.href =
        `payment.html?show=${currentShowtime.id}&seats=${seatIds}`;
});



document.addEventListener("DOMContentLoaded", loadShowtime);
