# backend/app/main.py
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
from app.labs_config import LABS

app = FastAPI(title="Vuln Trainer API")

class Lab(BaseModel):
    id: str
    title: str
    description: str
    url: str

class ProgressUpdate(BaseModel):
    user_id: str
    lab_id: str
    completed: bool

# Basic health
@app.get("/health")
def health():
    return {"status": "ok"}

# List labs
@app.get("/labs", response_model=List[Lab])
def list_labs():
    return LABS

# Get lab by id
@app.get("/lab/{lab_id}", response_model=Lab)
def get_lab(lab_id: str):
    for l in LABS:
        if l["id"] == lab_id:
            return l
    raise HTTPException(status_code=404, detail="Lab not found")

# Accept progress updates (for now we just echo back)
@app.post("/progress")
def progress(update: ProgressUpdate):
    # TODO: hook this to Firestore / DB
    return {"status": "ok", "received": update.dict()}
