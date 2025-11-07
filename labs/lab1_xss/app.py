# labs/lab1_xss/app.py
from flask import Flask, request, render_template
from markupsafe import Markup

app = Flask(__name__)

@app.route("/", methods=["GET"])
def index():
    # naive: take ?msg and display without escaping -> reflected XSS
    msg = request.args.get("msg", "")
    # intentionally vulnerable: Markup() used to simulate unsafe rendering for learning
    return render_template("index.html", user_msg=Markup(msg))

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
