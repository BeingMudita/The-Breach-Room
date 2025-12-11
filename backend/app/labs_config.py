# backend/app/labs_config.py
"""
Registry of labs. Each lab contains:
 - id: unique id used by frontend/backend
 - title: short title
 - description: user-friendly description shown in the dashboard
 - url: internal docker service url (the frontend maps these to host ports)
"""

LABS = [
    {
        "id": "lab1_xss",
        "title": "Reflected XSS — Comment Box",
        "description": (
            "Learn how input reflected into a page can execute JavaScript (Reflected XSS). "
            "Explore the vulnerable demo and the fixed demo which shows proper escaping."
        ),
        "url": "http://lab1:5000"
    },
    {
        "id": "lab2_sqli",
        "title": "SQL Injection — Login Bypass",
        "description": (
            "Classic SQL injection in a login form: learn how unsafe string-built SQL can be bypassed. "
            "Compare the vulnerable flow with the parameterized (safe) version."
        ),
        "url": "http://lab2:5000"
    }
]
