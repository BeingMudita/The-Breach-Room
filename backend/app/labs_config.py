# backend/app/labs_config.py
"""
Simple static lab registry.
In future we will replace this with dynamic lab lifecycle (spin up / tear down).
"""
LABS = [
    {
        "id": "lab1_xss",
        "title": "Reflected XSS - Comment Box",
        "description": "Reflected XSS in a comment box. Learn about input validation & escaping.",
        "url": "http://lab1:5000"   # docker-compose service name (lab1)
    }
]
