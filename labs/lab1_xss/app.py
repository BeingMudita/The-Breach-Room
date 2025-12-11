# labs/lab1_xss/app.py
from flask import Flask, request, render_template
from markupsafe import Markup
import html

app = Flask(__name__)

@app.route("/", methods=["GET"])
def index():
    """
    Vulnerable page: intentionally reflects the ?msg= parameter into the page unsafely.
    This demonstrates reflected XSS.
    """
    msg = request.args.get("msg", "")
    # intentionally vulnerable rendering using Markup in vulnerable route (kept for learning)
    return render_template("index.html", user_msg_vulnerable=Markup(msg), user_msg_safe="", mode="vuln")

@app.route("/fixed", methods=["GET"])
def fixed():
    """
    Fixed page: same UI but the message is escaped on render (no raw HTML execution).
    Demonstrates how escaping prevents XSS.
    """
    msg = request.args.get("msg", "")
    # escape input using html.escape or let Jinja autoescape by passing raw string
    safe_msg = html.escape(msg)
    # pass the safe string to the template; do NOT mark it as safe
    return render_template("index.html", user_msg_vulnerable="", user_msg_safe=safe_msg, mode="fixed")

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
