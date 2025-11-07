# backend/app/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from app.labs_config import LABS

# ---- ADD CORS imports ----
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Vuln Trainer API")

# Allow requests from the React dev server
origins = [
    "http://localhost:5173",  # Vite dev server
    "http://127.0.0.1:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)
# --------------------------

class Lab(BaseModel):
    id: str
    title: str
    description: str
    url: str

class ProgressUpdate(BaseModel):
    user_id: str
    lab_id: str
    completed: bool

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/labs", response_model=List[Lab])
def list_labs():
    return LABS

@app.get("/lab/{lab_id}", response_model=Lab)
def get_lab(lab_id: str):
    for l in LABS:
        if l["id"] == lab_id:
            return l
    raise HTTPException(status_code=404, detail="Lab not found")

@app.post("/progress")
def progress(update: ProgressUpdate):
    # TODO: hook this to Firestore / DB
    return {"status": "ok", "received": update.dict()}
