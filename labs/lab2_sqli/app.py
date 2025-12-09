from flask import Flask, request, render_template, redirect, url_for
import sqlite3
import os

app = Flask(__name__)
DB_PATH = "users.db"

def init_db():
    if not os.path.exists(DB_PATH):
        conn = sqlite3.connect(DB_PATH)
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
        conn = sqlite3.connect(DB_PATH)
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
    return render_template("index.html", message=msg)

if __name__ == "__main__":
    init_db()
    app.run(host="0.0.0.0", port=5000)
