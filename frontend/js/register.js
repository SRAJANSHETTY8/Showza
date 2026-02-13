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

const registerform=document.getElementById('registerForm');
if (registerform){
    registerform.addEventListener("submit",function(event){
        event.preventDefault()
        const email=document.getElementById('email').value;
        const password=document.getElementById('passwordInput').value;
        console.log(email);
        console.log(password);
        fetch("https://showza-vlhs.onrender.com/register",{
            method:"POST",
            headers:{
                "Content-Type":"application/json",
            },
            body:JSON.stringify({
                "email":email,
                "password":password
        })
    })
    .then(response =>{
        if (!response.ok){
            return response.json().then(err=>{throw err;})};
        return response.json();

        })
    .then(data =>{
        console.log("Registration Successful",data);
        alert("Account Created Successfully");
        window.location.href="login.html"
    })
    .catch(error =>{
        console.error("Register error:",error);
        alert(error?.detail||"Registration Falied ,Pls try again After Sometime");
    });

});
}