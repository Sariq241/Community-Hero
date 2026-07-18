document.addEventListener("DOMContentLoaded", function () {

    console.log("Community Hero AI Loaded Successfully");

    // HERO TITLE ANIMATION
   
    const heroTitle = document.querySelector(".hero h1");

    if (heroTitle) {
        heroTitle.style.opacity = "0";
        heroTitle.style.transform = "translateY(-20px)";

        setTimeout(() => {
            heroTitle.style.transition = "1s";
            heroTitle.style.opacity = "1";
            heroTitle.style.transform = "translateY(0)";
        }, 300);
    }

    
    // TOAST SYSTEM
   
    let toastTimeout;

    function showToast(msg) {

        const existing = document.querySelector(".toast");
        if (existing) existing.remove();

        const toast = document.createElement("div");
        toast.className = "toast";
        toast.innerText = msg;

        toast.style.position = "fixed";
        toast.style.bottom = "20px";
        toast.style.right = "20px";
        toast.style.background = "#1f2937";
        toast.style.color = "white";
        toast.style.padding = "10px 15px";
        toast.style.borderRadius = "8px";
        toast.style.zIndex = "9999";

        document.body.appendChild(toast);

        clearTimeout(toastTimeout);

        toastTimeout = setTimeout(() => {
            toast.remove();
        }, 2000);
    }

    
    // AI TYPING EFFECT
    
    function aiTypingEffect(text, callback) {

        let i = 0;
        let displayText = "";

        const interval = setInterval(() => {
            if (i < text.length) {
                displayText += text[i];
                showToast(displayText + " | AI Processing...");
                i++;
            } else {
                clearInterval(interval);
                if (callback) callback();
            }
        }, 50);
    }

    
    // FEATURE CARD CLICK (AI MODE)
    
    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {

        card.addEventListener("click", function () {

            let feature = card.innerText.toLowerCase(); // ✅ FIX HERE

            showToast("AI analyzing: " + feature);

            setTimeout(() => {

                let category = "General Issue";

                if (feature.includes("issue")) category = "Infrastructure Issue";
                else if (feature.includes("location")) category = "Geo Tracking";
                else if (feature.includes("dashboard")) category = "Analytics Panel";
                else if (feature.includes("water")) category = "Water Leakage";
                else if (feature.includes("garbage")) category = "Waste Management";
                else if (feature.includes("light")) category = "Streetlight Issue";

                showToast("AI Detected: " + category);

            }, 1500);

        });

    });

    
    // LIVE COUNTER (FAKE DATA)
    
    let counter = 0;
    const interval = setInterval(() => {

        counter += 7;

        if (counter > 120) clearInterval(interval);

        console.log("Issues Analyzed: " + counter);

    }, 500);

});


// OPEN LOGIN MODAL
function openLogin() {
    document.getElementById("loginModal").style.display = "block";
    document.getElementById("overlay").style.display = "block";
}

// CLOSE LOGIN MODAL
function closeLogin() {
    document.getElementById("loginModal").style.display = "none";
    document.getElementById("overlay").style.display = "none";
}

// LOGIN FUNCTION
async function login() {
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let mobile = document.getElementById("mobile").value;

    if (!name || !email || !mobile) {
        alert("Please fill all fields");
        return;
    }

    try {
        let res = await fetch("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, mobile })
        });

        let data = await res.json();

        console.log("LOGIN RESPONSE:", data);

        if (data.message === "logged in") {

            alert("Login successful");

            closeLogin();

            document.querySelector(".login-btn").style.display = "none";
            document.querySelector(".logout-btn").style.display = "inline-block";
        } 
        else {
            alert("Login failed");
        }

    } catch (err) {
        console.error(err);
        alert("Server error during login");
    }
}

function checkLoginAccess(url) {
    fetch(url)
        .then(res => {
            if (res.status === 401) {
                alert("Login required");
                openLogin(); // modal open
            } else {
                window.location.href = url;
            }
        });
}


async function logout() {

    let res = await fetch("/logout", {
        method: "POST"
    });

    if (!res.ok) {
        alert("Logout failed");
        return;
    }

    let data = await res.json();

    alert(data.message);

    window.location.href = "/";
}

fetch("/check-session")
    .then(res => {

        const loginBtn = document.querySelector(".login-btn");
        const logoutBtn = document.querySelector(".logout-btn");

        if (!loginBtn || !logoutBtn) return;

        if (res.ok) {
            loginBtn.style.display = "none";
            logoutBtn.style.display = "inline-block";
        } else {
            loginBtn.style.display = "inline-block";
            logoutBtn.style.display = "none";
        }
    });