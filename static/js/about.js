// COMMUNITY HERO AI - ABOUT


// Page load message
window.onload = function () {
    console.log("Community Hero AI About Page Loaded");
};



// CARD HOVER EFFECT

let cards = document.querySelectorAll(".card");

cards.forEach(card => {

    card.addEventListener("mouseover", function () {
        card.style.background = "#dbeafe";
    });

    card.addEventListener("mouseout", function () {
        card.style.background = "#f8fafc";
    });

});



// HERO TEXT ANIMATIO

let heading = document.querySelector(".hero h1");

if (heading) {

    heading.style.opacity = "0";

    setTimeout(() => {
        heading.style.opacity = "1";
        heading.style.transition = "1s";
    }, 300);

}

function checkLoginAccess(url) {
    fetch(url)
        .then(res => {
            if (res.status === 401) {
                alert("Login required");
            } else {
                window.location.href = url;
            }
        });
}



