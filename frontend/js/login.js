function togglePassword() {

    const password = document.getElementById("passwordInput");
    const eyeOpen = document.getElementById("eyeOpen");
    const eyeClosed = document.getElementById("eyeClosed");

    if (password.type === "password") {
        password.type = "text";
        eyeOpen.style.display = "none";
        eyeClosed.style.display = "block";
    } else {
        password.type = "password";
        eyeOpen.style.display = "block";
        eyeClosed.style.display = "none";
    }
}


const loginForm = document.getElementById('loginForm');

if (loginForm) {

    loginForm.addEventListener("submit", function (event) {

        event.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('passwordInput').value;

        console.log(username);
        console.log(password);

        const formdata = new URLSearchParams();
        formdata.append("username", username);
        formdata.append("password", password);
        formdata.append("grant_type", "password");

        fetch("https://showza-vlhs.onrender.com/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: formdata
        })

        
        .then(async (response) => {

            if (!response.ok) {

                const err = await response.json();
                throw new Error(err.detail || "Invalid Email or Password");

            }

            return response.json();
        })

        
        .then(data => {

            console.log("Login success:", data);

            localStorage.setItem("showza_access_token", data.access_token);
            localStorage.setItem("showza_user_email", username);

            console.log("Token saved");

            window.location.href = "index.html";

        })

    
        .catch((error) => {

            console.log("Login error:", error);
            alert(error.message);

        });

    });

}
