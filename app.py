from flask import Flask, render_template, request, jsonify, session, redirect, abort
import sqlite3
import google.generativeai as genai
from PIL import Image
import io
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "community_hero_secret")
# Gemini API Key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY environment variable not found.")

genai.configure(api_key=GEMINI_API_KEY)


UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
DB_PATH = os.getenv("DATABASE_PATH", "community.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn
model = genai.GenerativeModel("gemini-2.0-flash")
# matplotlib chart

def generate_chart():

    conn = get_db_connection()

    issues = conn.execute("SELECT category FROM issues").fetchall()

    conn.close()

    road = 0
    water = 0
    garbage = 0
    streetlight = 0

    for issue in issues:

        category = (issue["category"] or "").lower()
        print(category)
        
        if "road" in category:
            road += 1

        elif "water" in category:
            water += 1

        elif "waste" in category or "garbage" in category:
            garbage += 1

        elif "street" in category or "light" in category:
            streetlight += 1
        print(road, water, garbage, streetlight)
        
    plt.figure(figsize=(8,4))
    colors = ["#ff4d4d", "#3399ff", "#2ecc71", "#f1c40f"]
    bars=plt.bar(
        ["Road", "Water", "Garbage", "Streetlight"],
        [road, water, garbage, streetlight],
        color=colors
    )
    
    for bar in bars:
        height = bar.get_height()
        plt.text(
            bar.get_x() + bar.get_width()/2,
            height + 0.1,          # text thoda upar dikhe
            f"{int(height)}",
            ha="center",
            va="bottom",
            fontsize=11,
            fontweight="bold"
        )

    plt.title("Community Issues")
    plt.xlabel("Issue Category")
    plt.ylabel("Total Issues")
    plt.grid(axis="y", linestyle="--", alpha=0.4)

    plt.tight_layout()



    os.makedirs("static/images", exist_ok=True)

    plt.savefig("static/images/chart.png")
    plt.close()
    
    

# DASHBOARD REAL-TIME APi

@app.route("/issues_data")
def issues_data():

    conn = get_db_connection()

    issues = conn.execute("SELECT * FROM issues ORDER BY id DESC").fetchall()

    conn.close()

    return jsonify([dict(issue) for issue in issues])
@app.route("/")
def home():
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    try:
        text = request.form.get("text")
        image = request.files.get("image")
        video = request.files.get("video")

        prompt = f"""
You are an AI assistant for a Community Hero platform.

Analyze BOTH the user's description and the uploaded image/video.

Description:
{text}

Choose one category only from:

- Road Damage
- Water Leakage
- Water Pollution
- Waste Management
- Streetlight Issue
- Drainage Issue
- Sewage Overflow
- General Community Issue

Return ONLY in this EXACT format.

Category: <one category only>
Severity: <Low, Medium, or High>
Department: <Department name>
Confidence: <A NUMBER between 0 and 100 >
Recommended Action: <one short sentence>
"""

        if image:
            print("Processing Image...")
            img = Image.open(image)

            response = model.generate_content([
                prompt,
                img
            ])
        elif video:
            import time

            try:
                filename = str(int(time.time())) + "_" + video.filename
                video_path = os.path.join(UPLOAD_FOLDER, filename)
                video.save(video_path)
                

                uploaded_video = genai.upload_file(path=video_path)

                # wait until ready
                while uploaded_video.state.name == "PROCESSING":
                    time.sleep(2)
                    uploaded_video = genai.get_file(uploaded_video.name)

                if uploaded_video.state.name == "FAILED":
                    return jsonify({"error": "Video processing failed"}), 500

                response = model.generate_content([prompt, uploaded_video])
            except Exception as e:
                print("VIDEO ERROR:", e)
                return jsonify({"error": "Video upload failed"}), 500

        else:
            print("Text Only...")
            response = model.generate_content(prompt)

        answer = response.text
        print(answer)

        category = answer.split("Category:")[1].split("\n")[0].strip()
        severity = answer.split("Severity:")[1].split("\n")[0].strip()
        department = answer.split("Department:")[1].split("\n")[0].strip()
        confidence = answer.split("Confidence:")[1].split("\n")[0].strip()

        try:
            confidence = int(confidence)
        except:
            confidence = 0

        action = answer.split("Recommended Action:")[1].strip()

        return jsonify({
            "result": answer,
            "category": category,
            "severity": severity,
            "department": department,
            "confidence": confidence,
            "action": action
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500



@app.route("/add_issue", methods=["POST"])
def add_issue():
    data = request.json
    print(data)
    conn = get_db_connection()
    conn.execute("""
        INSERT INTO issues (
            title, description, image, location, priority,
            category, severity, department, confidence, action,
            status, supports
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        data["title"],
        data["description"],
        data.get("image", ""),
        data["location"],
        data["priority"],
        data["category"],
        data["severity"],
        data["department"],
        data["confidence"],
        data["action"],
        "Pending",
        0
    ))

    conn.commit()
    conn.close()

    generate_chart()   # Generate updated chart

    return jsonify({"message": "Issue saved successfully"})

    


@app.route("/resolve/<int:id>", methods=["POST"])
def resolve(id):
    conn = get_db_connection()
    conn.execute("UPDATE issues SET status = 'Resolved' WHERE id = ?", (id,))
    conn.commit()
    conn.close()

    generate_chart()   # Update chart after resolving

    return jsonify({"message": "resolved"})


@app.route("/login", methods=["POST"])
def login():
    data = request.json

    name = data.get("name")
    email = data.get("email")
    mobile = data.get("mobile")

    conn = get_db_connection()

    # Check if user already exists
    user = conn.execute(
        "SELECT * FROM users WHERE email = ?",
        (email,)
    ).fetchone()

    # Agar user pehli baar login kar raha hai
    if not user:
        conn.execute(
            """
            INSERT INTO users (name, email, mobile)
            VALUES (?, ?, ?)
            """,
            (name, email, mobile)
        )
        conn.commit()

    conn.close()

    # Session create
    session["user"] = email

    return jsonify({"message": "logged in"})

@app.route("/logout", methods=["POST"])
def logout():
    session.pop("user", None)   # session se user hata do
    return jsonify({"message": "Logged out successfully"})

@app.route("/report")
def report():
    if "user" not in session:
        return jsonify({"message": "Login required"}), 401
    return render_template("report.html")

@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return jsonify({"message": "Login required"}), 401

    generate_chart()    # Create/update chart

    return render_template("dashboard.html")

@app.route("/about")
def about():
    if "user" not in session:
       return jsonify({"message": "Login required"}), 401
    return render_template("about.html")

@app.route("/support/<int:issue_id>", methods=["POST"])
def support(issue_id):

    if "user" not in session:
        return jsonify({"message": "Login required"}), 401

    email = session["user"]

    conn = get_db_connection()

    # check already voted
    vote = conn.execute(
        "SELECT * FROM support_votes WHERE user_email=? AND issue_id=?",
        (email, issue_id)
    ).fetchone()

    if vote:
        return jsonify({"message": "Already supported"}), 400

    # insert vote
    conn.execute(
        "INSERT INTO support_votes (user_email, issue_id) VALUES (?, ?)",
        (email, issue_id)
    )

    # increase support
    conn.execute(
        "UPDATE issues SET supports = supports + 1 WHERE id = ?",
        (issue_id,)
    )

    conn.commit()
    conn.close()

    return jsonify({"message": "supported"})


@app.route("/check-session")
def check_session():
    if "user" in session:
        return jsonify({"ok": True})
    return jsonify({"ok": False}), 401

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port)
    
  