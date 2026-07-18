
// COMMUNITY HERO AI DASHBOARD


// Local Storage se issues lo
let issues = [];
let currentView = "Pending";;
async function loadIssues() {
    let res = await fetch("/issues_data");
    issues = await res.json();
     
    
    showIssues(currentView);
    updateUI();

     // Refresh the chart image (prevent browser cache)
    const chart = document.getElementById("chartImage");
    if (chart) {
        chart.src = "/static/images/chart.png?" + new Date().getTime();
    }
}

// Page load hone par
window.onload = function () {
    loadIssues();
    setInterval(loadIssues, 3000);
};



// SHOW ISSUES


function showIssues(type = "Pending") {

    let container = document.getElementById("issuesList");

    container.innerHTML = "";

    let filteredIssues = issues.filter(issue => issue.status === type);

    if (filteredIssues.length === 0) {
        container.innerHTML = `<p>No ${type.toLowerCase()} issues found.</p>`;
        return;
    }

    filteredIssues.forEach(issue => {

        let issueId = issue.id;

        let card = document.createElement("div");

        card.className = "issue-card";

        card.innerHTML = `
            <h3>${issue.title}</h3>

            <p><b>Description:</b> ${issue.description}</p>

            <p><b>Location:</b> ${issue.location}</p>

            <p><b>Category:</b> ${issue.category}</p>
            
            <p><b>Department:</b> ${issue.department}</p>

            <p><b>Status:</b> ${issue.status}</p>

            <p><b>Supports:</b> ${issue.supports || 0}</p>

            ${type === "Pending" ? `
                <button onclick="supportIssue(${issue.id})">
                    👍 Support Issue
                </button>

                <button onclick="resolveIssue(${issue.id})">
                    ✅ Mark Resolved
                </button>
            ` : ""}
        `;

        container.appendChild(card);
    });
}


// FILTER FUNCTIONS


function showPending() {
    currentView = "Pending";
    showIssues(currentView);
}

function showResolved() {
    currentView = "Resolved";
    showIssues(currentView);
}


// AI INSIGHTS

function updateInsights() {

    let road = 0;
    let water = 0;
    let garbage = 0;
    let light = 0;

    issues.forEach(issue => {

        let category = (issue.category || "").toLowerCase();

        if (category.includes("road")) {
            road++;
        }

        else if (category.includes("water")) {
            water++;
        }

        else if (category.includes("waste") || category.includes("garbage")) {
            garbage++;
        }

        else if (category.includes("street") || category.includes("light")) {
            light++;
        }

    });


    let cards = document.querySelectorAll(".card");

    if(cards.length >= 4){

        cards[0].innerHTML = `🚧 Road Issues<br><h3>${road}</h3>`;

        cards[1].innerHTML = `💧 Water Issues<br><h3>${water}</h3>`;

        cards[2].innerHTML = `🗑 Garbage Issues<br><h3>${garbage}</h3>`;

        cards[3].innerHTML = `💡 Streetlight Issues<br><h3>${light}</h3>`;
    }


    let maxCount = Math.max(road, water, garbage, light);

    let prediction = "No Data";


    if(maxCount === road && road > 0){
        prediction = "Road Damage";
    }

    else if(maxCount === water && water > 0){
        prediction = "Water Leakage";
    }

    else if(maxCount === garbage && garbage > 0){
        prediction = "Waste Management";
    }

    else if(maxCount === light && light > 0){
        prediction = "Streetlight Issue";
    }


    document.getElementById("prediction").innerText = prediction;
}


// COMMUNITY VERIFICATION


function supportIssue(issue_id) {
    fetch(`/support/${issue_id}`, { method: "POST" })
        .then(res => res.json())
        .then(data => {
            alert(data.message);   // 👈 THIS shows "Already supported"
            loadIssues();
        });
}
function resolveIssue(id) {
    fetch(`/resolve/${id}`, { method: "POST" })
        .then(() => loadIssues());
}



function updateUI() {

    document.getElementById("totalIssues").innerText = issues.length;

    let pending = issues.filter(i => i.status === "Pending").length;
    let resolved = issues.filter(i => i.status === "Resolved").length;

    document.getElementById("pendingIssues").innerText = pending;
    document.getElementById("resolvedIssues").innerText = resolved;

    document.getElementById("activeUsers").innerText = 500;

    
    updateInsights();
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

