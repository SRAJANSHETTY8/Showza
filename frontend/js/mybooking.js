const API_BASE = "http://127.0.0.1:8000";


const token = localStorage.getItem("showza_access_token");
const email = localStorage.getItem("showza_user_email");

function authHeaders() {
    return token ? { Authorization: `Bearer ${token}` } : {};
}



const signinbtn = document.getElementById("signinbtn");
const profileContainer = document.getElementById("profileContainer");
const profileAvatar = document.getElementById("profileAvatar");
const profileEmail = document.getElementById("profileEmail");

if (token && email) {
    if (profileEmail) profileEmail.textContent = email;
    if (profileAvatar) profileAvatar.textContent = email.substring(0, 2).toUpperCase();
    if (signinbtn) signinbtn.style.display = "none";
    if (profileContainer) profileContainer.style.display = "flex";
}



profileAvatar?.addEventListener("click", () => {
    document.getElementById("profileDropdown")?.classList.toggle("show");
});

document.getElementById("logoutBtn")?.addEventListener("click", () => {
    localStorage.clear();
    window.location.href = "login.html";
});




async function loadMyBookings() {

    try {

        const bookingRes = await fetch(`${API_BASE}/mybookings`, {
            headers: authHeaders()
        });

        const bookings = await bookingRes.json();

        
        const activeBookings = bookings.filter(
            b => b.payment_status !== "cancelled"
        );

        if (!activeBookings.length) {
            document.getElementById("emptyState").style.display = "flex";
            return;
        }

        
        document.getElementById("ticketCount").textContent =
            activeBookings.length;

        const seats = await fetch(`${API_BASE}/seats`).then(r => r.json());

        const seatlocks = await fetch(`${API_BASE}/seatlocks`, {
            headers: authHeaders()
        }).then(r => r.json());

        const shows = await fetch(`${API_BASE}/showtimes`).then(r => r.json());

        const movies = await fetch(`${API_BASE}/movies`, {
            headers: authHeaders()
        }).then(r => r.json());

        const theatres = await fetch(`${API_BASE}/theaters/Bengaluru`, {
            headers: authHeaders()
        }).then(r => r.json());

        
        renderBookings(activeBookings, seatlocks, seats, shows, movies, theatres);

    } catch (err) {
        console.error("Bookings Error:", err);
    }
}




function renderBookings(bookings, seatlocks, seats, shows, movies, theatres) {

    const grid = document.getElementById("bookingsGrid");
    grid.innerHTML = "";

    bookings.forEach(booking => {

        const seatlock = seatlocks.find(sl => sl.id === booking.seatlock_id);
        if (!seatlock) return;

        const seat = seats.find(s => s.id === seatlock.seat_id);
        if (!seat) return;

        const show = shows.find(sh => sh.id === seat.Showtime_id);
        if (!show) return;

        const movie = movies.find(m => m.id === show.Movie_id);
        if (!movie) return;

        const theatre = theatres.find(t => t.id === show.Theater_id);

        const dt = new Date(show.Showtime);

        const date = dt.toLocaleDateString("en-IN");
        const time = dt.toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit"
        });

        const statusClass =
            booking.payment_status === "cancelled"
                ? "cancelled"
                : "confirmed";

        const card = document.createElement("div");
        card.className = "booking-card";

        card.innerHTML = `
        <div class="card-poster">
            <img src="${movie.movie_poster_url}">
        </div>

        <div class="card-content">
            <h3 class="movie-title">${movie.movie_name}</h3>

            <div class="theatre-info">
                <span>${theatre?.Theater_name || "Unknown Theatre"}</span>
            </div>

            <div class="showtime-info">
                <div>${date}</div>
                <div>${time}</div>
            </div>

            <div class="seat-info">
                Seat ${seat.seat_number}
            </div>

            <div class="card-footer">
                <span class="status-badge ${statusClass}">
                    ${booking.payment_status.toUpperCase()}
                </span>

                <span class="ticket-number">
                    ${booking.Ticket_number}
                </span>
            </div>
        </div>
        `;

        card.onclick = () =>
            openModal(booking, seat, show, movie, theatre);

        grid.appendChild(card);
    });
}




async function openModal(booking, seat, show, movie, theatre) {

    const modal = document.getElementById("ticketModal");
    modal.classList.add("active");

    document.getElementById("modalMovieTitle").textContent = movie.movie_name;
    document.getElementById("detailMovie").textContent = movie.movie_name;
    document.getElementById("detailGuest").textContent = booking.fullname;

    document.getElementById("detailTheatre").textContent =
        `${theatre?.Theater_name}, ${theatre?.Theater_location}`;

    document.getElementById("detailSeat").textContent =
        `${seat.seat_type} — ${seat.seat_number}`;

    document.getElementById("detailTicketNum").textContent =
        booking.Ticket_number;

    document.getElementById("detailPayment").textContent =
        booking.payment_status;

    document.getElementById("detailAmount").textContent =
        `₹${booking.amount}`;

    const dt = new Date(show.Showtime);

    document.getElementById("detailShowtime").textContent =
        dt.toLocaleString("en-IN");

    document.getElementById("detailBookedOn").textContent =
        new Date(booking.created_at).toLocaleDateString("en-IN");

    
    const qr = await fetch(`${API_BASE}/ticket/${booking.Ticket_number}`, {
        headers: authHeaders()
    });

    const blob = await qr.blob();

    document.getElementById("qrCode").innerHTML =
        `<img src="${URL.createObjectURL(blob)}" style="width:100%">`;

    
    document.getElementById("downloadBtn").onclick = async () => {

        const res = await fetch(`${API_BASE}/ticket/${booking.Ticket_number}`, {
            headers: authHeaders()
        });

        const blob = await res.blob();
        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `${booking.Ticket_number}.png`;
        link.click();
    };


    document.getElementById("cancelBtn").onclick = async () => {

        if (!confirm("Cancel this ticket?")) return;

        await fetch(`${API_BASE}/cancelbooking`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                ...authHeaders()
            },
            body: JSON.stringify({
                Ticketnumber: booking.Ticket_number
            })
        });

        location.reload();
    };
}




document.getElementById("closeModal")?.addEventListener("click", () => {
    document.getElementById("ticketModal").classList.remove("active");
});

window.addEventListener("click", e => {
    if (e.target.id === "ticketModal") {
        document.getElementById("ticketModal").classList.remove("active");
    }
});




document.addEventListener("DOMContentLoaded", loadMyBookings);
