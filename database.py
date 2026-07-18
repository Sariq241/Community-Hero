import sqlite3

conn = sqlite3.connect("community.db")

cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS issues (

    id INTEGER PRIMARY KEY AUTOINCREMENT,

    title TEXT,
    description TEXT,
    image TEXT,
    location TEXT,
    priority TEXT,

    category TEXT,
    severity TEXT,
    department TEXT,
    confidence INTEGER,
    action TEXT,

    status TEXT,
    supports INTEGER DEFAULT 0,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
""")
# USERS TABLE (ADD THIS)
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    email TEXT UNIQUE,
    mobile TEXT
)
""")
# SUPPORT VOTES TABLE (ADD THIS)
cursor.execute("""
CREATE TABLE IF NOT EXISTS support_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_email TEXT,
    issue_id INTEGER
)
""")
conn.commit()
conn.close()

print("Database Created Successfully!")