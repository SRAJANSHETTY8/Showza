console.log("aboutus.js loaded");



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
    if (profileContainer) profileContainer.style.display = "flex";
}




profileAvatar?.addEventListener("click", () => {

    const dropdown = document.getElementById("profileDropdown");

    dropdown.classList.toggle("show");
});




document.getElementById("logoutBtn")?.addEventListener("click", () => {

    localStorage.removeItem("showza_access_token");
    localStorage.removeItem("showza_user_email");

    window.location.href = "login.html";
});




const navLinks = document.querySelectorAll(".nav-links a");

const currentPage =
    window.location.pathname.split("/").pop();

navLinks.forEach(link => {

    if (link.getAttribute("href") === currentPage) {
        link.classList.add("active");
    }
});
