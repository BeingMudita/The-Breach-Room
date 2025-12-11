# labs/lab2_sqli/app.py
from flask import Flask, request, render_template
import sqlite3
import os
import pathlib

app = Flask(__name__)
BASE = pathlib.Path(__file__).parent
DB_PATH = BASE / "users.db"

def init_db():
    if not DB_PATH.exists():
        conn = sqlite3.connect(str(DB_PATH))
        c = conn.cursor()
        c.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, password TEXT)")
        # insert a sample user: user / pass123
        c.execute("INSERT INTO users (username, password) VALUES (?, ?)", ("user", "pass123"))
        conn.commit()
        conn.close()

@app.route("/", methods=["GET", "POST"])
def index():
    init_db()
    msg = ""
    if request.method == "POST":
        uname = request.form.get("username", "")
        pwd = request.form.get("password", "")
        # DELIBERATELY VULNERABLE: constructing SQL with string formatting (DO NOT DO THIS IRL)
        query = f"SELECT * FROM users WHERE username = '{uname}' AND password = '{pwd}'"
        conn = sqlite3.connect(str(DB_PATH))
        c = conn.cursor()
        try:
            c.execute(query)
            row = c.fetchone()
            if row:
                msg = f"Welcome, {row[1]}! (login success)"
            else:
                msg = "Login failed"
        except Exception as e:
            msg = f"Error: {str(e)}"
        finally:
            conn.close()
    return render_template("index.html", message=msg, mode="vuln")

@app.route("/fixed", methods=["GET", "POST"])
def fixed():
    init_db()
    msg = ""
    if request.method == "POST":
        uname = request.form.get("username", "")
        pwd = request.form.get("password", "")
        # SAFE: use parameterized queries; never interpolate user input into SQL strings
        conn = sqlite3.connect(str(DB_PATH))
        c = conn.cursor()
        try:
            c.execute("SELECT * FROM users WHERE username = ? AND password = ?", (uname, pwd))
            row = c.fetchone()
            if row:
                msg = f"Welcome, {row[1]}! (login success - safe)"
            else:
                msg = "Login failed (safe)"
        except Exception as e:
            msg = f"Error: {str(e)}"
        finally:
            conn.close()
    return render_template("index.html", message=msg, mode="fixed")

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000)
