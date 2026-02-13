const API_BASE = "http://127.0.0.1:8000";


document.addEventListener("submit", e => e.preventDefault());
document.addEventListener("keydown", e => {
    if (e.key === "Enter") e.preventDefault();
});



const token = localStorage.getItem("showza_access_token");
const email = localStorage.getItem("showza_user_email");

let selectedSeats = [];
let seatPrices = {};
let totalAmount = 0;
let ticketNumbers = [];



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

    if (!profileDropdown) return;

    profileDropdown.style.display =
        profileDropdown.style.display === "block" ? "none" : "block";
});


document.addEventListener("click", () => {

    if (profileDropdown) profileDropdown.style.display = "none";
});


document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
});

function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
}



function getParams() {

    const params = new URLSearchParams(window.location.search);

    return {
        showId: Number(params.get("show")),
        seatIds: params.get("seats")?.split(",").map(Number) || []
    };
}


let countdownInterval;

function startSeatTimer() {

    const TIMER_KEY = "seat_hold_expiry";
    const timerEl = document.getElementById("countdown");

    if (!timerEl) return;

    let expiry = localStorage.getItem(TIMER_KEY);

    
    if (!expiry) {

        expiry = Date.now() + 60 * 1000;
        localStorage.setItem(TIMER_KEY, expiry);
    }

    expiry = Number(expiry);

    clearInterval(countdownInterval);

    function updateTimer() {

        const remaining = expiry - Date.now();

        if (remaining <= 0) {

            clearInterval(countdownInterval);
            localStorage.removeItem(TIMER_KEY);

            alert("Seat hold expired!");
            window.location.href = "index.html";
            return;
        }

        const seconds = Math.floor(remaining / 1000);
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;

        timerEl.textContent =
            `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }

    updateTimer();
    countdownInterval = setInterval(updateTimer, 1000);
}



async function loadPaymentData(showId, seatIds) {

    if (!showId || seatIds.length === 0) return;

    try {

        const showRes = await fetch(`${API_BASE}/showtimes`, { headers: authHeaders() });
        const shows = await showRes.json();

        const show = shows.find(s => s.id === showId);
        if (!show) return;

        seatPrices = {
            VIP: show.Vip_Seat_price,
            PREMIUM: show.Premium_Seat_price,
            STANDARD: show.Standard_Seat_price
        };

        const showDate = new Date(show.Showtime);

        document.querySelector(".show-details").textContent =
            `${showDate.toDateString()} • ${showDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

        const movie = await fetch(`${API_BASE}/movies/${show.Movie_id}`, { headers: authHeaders() }).then(r => r.json());

        document.querySelector(".movie-name").textContent = movie.movie_name;
        document.querySelector(".movie-thumb img").src = movie.movie_poster_url;

        const allSeats = await fetch(`${API_BASE}/seats`, { headers: authHeaders() }).then(r => r.json());

        selectedSeats = allSeats.filter(
            s => seatIds.includes(s.id) && s.Showtime_id === showId
        );

        renderSummary();

    } catch (err) {
        console.error(err);
    }
}



function renderSummary() {

    const seatNumbers = selectedSeats.map(s => s.seat_number).join(", ");

    document.querySelector(".ticket-details .label").textContent =
        `${selectedSeats.length} Tickets`;

    document.querySelector(".ticket-details .value").textContent = seatNumbers;

    totalAmount = selectedSeats.reduce((sum, seat) =>
        sum + (seatPrices[seat.seat_type.toUpperCase()] || 0), 0
    );

    document.querySelectorAll(".detail-row .value")[1].textContent = `₹${totalAmount}`;
    document.querySelector(".total-value").textContent = `₹${totalAmount}`;
    document.getElementById("pay-amount").textContent = totalAmount;
}



function validateForm() {

    const cardNumber = document.getElementById("card-number").value.trim();
    const cardHolder = document.getElementById("card-holder").value.trim();

    document.getElementById("pay-btn").disabled =
        !(cardNumber.length >= 4 && cardHolder.length >= 3);
}

document.getElementById("card-number")?.addEventListener("input", validateForm);
document.getElementById("card-holder")?.addEventListener("input", validateForm);



document.getElementById("pay-btn")?.addEventListener("click", async () => {

    const fullname = document.getElementById("card-holder").value.trim();
    const cardnumber = Number(document.getElementById("card-number").value.slice(-4));

    const loadingOverlay = document.getElementById("loading-overlay");
    const successModal = document.getElementById("success-modal");

    loadingOverlay.classList.add("active");

    try {

        ticketNumbers = [];

        for (const seat of selectedSeats) {

            const res = await fetch(`${API_BASE}/payment/${seat.id}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...authHeaders()
                },
                body: JSON.stringify({ fullname, cardnumber })
            });

            const data = await res.json();

            if (!res.ok || data.payment_status !== "Success") {
                throw new Error("Payment failed");
            }

            ticketNumbers.push(data.Ticket_number);
        }

        localStorage.removeItem("seat_hold_expiry");

        loadingOverlay.classList.remove("active");
        successModal.classList.add("active");

    } catch (err) {

        loadingOverlay.classList.remove("active");
        alert(err.message);
    }
});



document.querySelector(".view-tickets-btn")?.addEventListener("click", () => {

    if (!ticketNumbers.length) return;

    window.location.href = `ticket.html?ticket=${ticketNumbers.join(",")}`;
});



document.addEventListener("DOMContentLoaded", () => {

    const { showId, seatIds } = getParams();

    loadPaymentData(showId, seatIds);

    startSeatTimer();
});
