const API_BASE = "https://showza-vlhs.onrender.com";



const token = localStorage.getItem("showza_access_token");
const email = localStorage.getItem("showza_user_email");

function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
}



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



function getTicketNumber() {
    return new URLSearchParams(window.location.search).get("ticket");
}



async function loadQRCode(ticketNumber) {

    const qrImg = document.querySelector(".qr-code");
    if (!qrImg) return;

    const res = await fetch(`${API_BASE}/ticket/${ticketNumber}`, {
        headers: authHeaders()
    });

    const blob = await res.blob();
    qrImg.src = URL.createObjectURL(blob);
}



async function loadTicketDetails(ticketNumber) {

    const bookings = await fetch(`${API_BASE}/mybookings`, {
        headers: authHeaders()
    }).then(r => r.json());

    const booking = bookings.find(b => b.Ticket_number === ticketNumber);
    if (!booking) return;

    const seatlocks = await fetch(`${API_BASE}/seatlocks`, {
        headers: authHeaders()
    }).then(r => r.json());

    const seats = await fetch(`${API_BASE}/seats`).then(r => r.json());
    const shows = await fetch(`${API_BASE}/showtimes`).then(r => r.json());

    const movies = await fetch(`${API_BASE}/movies`, {
        headers: authHeaders()
    }).then(r => r.json());

    const theatres = await fetch(`${API_BASE}/theaters/Bengaluru`, {
        headers: authHeaders()
    }).then(r => r.json());

    const seatlock = seatlocks.find(sl => sl.id === booking.seatlock_id);
    const seat = seats.find(s => s.id === seatlock.seat_id);
    const show = shows.find(sh => sh.id === seat.Showtime_id);
    const movie = movies.find(m => m.id === show.Movie_id);
    const theatre = theatres.find(t => t.id === show.Theater_id);

    const values = document.querySelectorAll(".detail-value");

    values[0].textContent = movie.movie_name;
    values[1].textContent = `${theatre.Theater_name}, ${theatre.Theater_location}`;
    values[2].textContent = new Date(show.Showtime).toLocaleString("en-IN");
    values[3].textContent = seat.seat_number;
    values[4].textContent = booking.Ticket_number;
}


function showCancelModal(message) {

    const modal = document.createElement("div");
    modal.className = "success-modal active";

    modal.innerHTML = `
        <div class="success-card payment-style">
            <div class="success-icon cancel-icon">✓</div>
            <h2>Ticket Cancelled Successfully</h2>
            <p>${message}</p>
            <button class="success-btn">Explore Movies</button>
        </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector(".success-btn").onclick = () => {
        window.location.href = "index.html";
    };
}



document.querySelector(".btn-cancel")?.addEventListener("click", async () => {

    const ticketNumber = getTicketNumber();
    if (!ticketNumber) return;

    if (!confirm("Are you sure you want to cancel this ticket?")) return;

    const res = await fetch(`${API_BASE}/cancelbooking`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            ...authHeaders()
        },
        body: JSON.stringify({ Ticketnumber: ticketNumber })
    });

    const data = await res.json();

    if (!res.ok) return alert(data.detail);

    showCancelModal(data.message);
});



document.querySelector(".btn-download")?.addEventListener("click", async () => {

    const ticketNumber = getTicketNumber();
    if (!ticketNumber) return;

    try {

        const res = await fetch(`${API_BASE}/ticket/${ticketNumber}`, {
            headers: authHeaders()
        });

        if (!res.ok) throw new Error("Download failed");

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${ticketNumber}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch {
        alert("Download failed");
    }
});



document.addEventListener("DOMContentLoaded", () => {

    const ticketNumber = getTicketNumber();
    if (!ticketNumber) return;

    loadQRCode(ticketNumber);
    loadTicketDetails(ticketNumber);
});
