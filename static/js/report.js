
// COMMUNITY HERO AI
// REPORT PAGE JS

// Form submit event
document.getElementById("issueForm").addEventListener("submit", async function(e){

    e.preventDefault();

    // Get form values
    let title = document.getElementById("title").value;
    let desc = document.getElementById("desc").value;
    let location = document.getElementById("location").value;
    let priority = document.getElementById("priority").value;
   
    // AI Prediction from Flask
    let formData = new FormData();

    formData.append("text", desc);
    formData.append("title", title);
    formData.append("location", location);
    formData.append("priority", priority);

    let imageFile = document.getElementById("image").files[0];

    if(imageFile){
        formData.append("image", imageFile);
    }
    
    let videoFile = document.getElementById("video").files[0];

    if (videoFile) {
        formData.append("video", videoFile);
    }

    let response = await fetch("/predict",{
    method: "POST",
    body: formData
    });

    if (!response.ok) {
        alert("Server error: " + response.status);
        return;
    }

    let text = await response.text();

    let aiData;

    try {
       aiData = JSON.parse(text);
    } catch (e) {
        console.log("NOT JSON RESPONSE:", text);
        alert("Backend error (check Flask console)");
        return;
    }
    
    // let result = aiData.result;
    console.log(aiData);
    // console.log(result);
    let category = aiData.category;
    let severity = aiData.severity;
    let department = aiData.department;
    let confidence = aiData.confidence;
    let action = aiData.action;

    

   document.getElementById("aiResult").style.display = "block";

   document.getElementById("aiCategory").innerText = category;
   document.getElementById("aiSeverity").innerText = severity;
   document.getElementById("aiDepartment").innerText = department;
   document.getElementById("aiConfidence").innerText = confidence;
   document.getElementById("aiAction").innerText = action;

    // Create issue object
    let issue = {
         title: title,
         description: desc,
         location: location,
         priority: priority,
         category: category,
         severity: severity,
         department: department,
         confidence: confidence,
         action: action,
         status: "Pending",
         supports: 0
       
    };
    // Send issue to Flask backend (SQLite)

    console.log(issue);

    let saveResponse = await fetch("/add_issue", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
         },
         body: JSON.stringify(issue)
    });

    console.log("Add Issue Status:", saveResponse.status);

    let saveText = await saveResponse.text();
    console.log("Add Issue Response:", saveText);

    if (!saveResponse.ok) {
        alert("Add Issue Error: " + saveResponse.status);
        return;
    }

    alert("✅ Issue Submitted Successfully!");
   
});




let imageInput = document.getElementById("image");

if (imageInput) {

    imageInput.addEventListener("change", function(event) {

        let file = event.target.files[0];

        if (file) {

            let preview = document.getElementById("preview");

            preview.src = URL.createObjectURL(file);

            preview.style.display = "block";
        }
    });
}

// Create Map
let map;
let marker;

window.addEventListener("DOMContentLoaded", function () {

    const mapDiv = document.getElementById("map");

    if (!mapDiv) return;

    map = L.map('map').setView([26.4499, 80.3319], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'OpenStreetMap'
    }).addTo(map);

    map.on("click", async function (e) {

        if (marker) {
            map.removeLayer(marker);
        }

        marker = L.marker(e.latlng).addTo(map);
        // map ko clicked location par le jao
        map.setView(e.latlng, 16);
        let lat = e.latlng.lat;
        let lng = e.latlng.lng;

        try {

           let response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );

           let data = await response.json();

           document.getElementById("location").value =
                data.display_name;

        } catch (error) {

              document.getElementById("location").value =
                  lat + "," + lng;
        }
    });
});
async function getLocation() {

    if (!navigator.geolocation) {
        alert("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async function (position) {

            let lat = position.coords.latitude;
            let lng = position.coords.longitude;
            
            if (marker) {
                map.removeLayer(marker);
            }

            marker = L.marker([lat, lng]).addTo(map);
            map.setView([lat, lng], 16);

            try {

                let response = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
                );

                let data = await response.json();

                document.getElementById("location").value =
                    data.display_name;

            } catch (error) {

                // Agar API fail ho jaye to coordinates dikhao
                document.getElementById("location").value =
                    lat + "," + lng;
            }

        },
        function () {
            alert("Location access denied");
        }
    );
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