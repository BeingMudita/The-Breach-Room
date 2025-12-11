# backend/app/main.py
import os
from fastapi import FastAPI, HTTPException, Header, Request, Path
from pydantic import BaseModel
from typing import List, Optional
from app.labs_config import LABS
from fastapi import Path


# CORS
from fastapi.middleware.cors import CORSMiddleware

# Firestore (firebase-admin)
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from datetime import datetime, timezone, date, timedelta

# initialize FastAPI
app = FastAPI(title="Vuln Trainer API")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Firestore init (server-side)
FIRE_CREDS_PATH = os.getenv("GOOGLE_APPLICATION_CREDENTIALS", "/app/serviceAccountKey.json")
if not firebase_admin._apps:
    if os.path.exists(FIRE_CREDS_PATH):
        cred = credentials.Certificate(FIRE_CREDS_PATH)
        firebase_admin.initialize_app(cred)
    else:
        firebase_admin.initialize_app()
db = firestore.client()

class Lab(BaseModel):
    id: str
    title: str
    description: str
    url: str

class ProgressUpdate(BaseModel):
    user_id: Optional[str] = None
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

# ------------- Auth helper ----------------
def verify_bearer_token(authorization: Optional[str]) -> str:
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    parts = authorization.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format")
    id_token = parts[1]
    try:
        decoded = firebase_auth.verify_id_token(id_token)
        uid = decoded.get("uid")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token: uid missing")
        return uid
    except firebase_auth.InvalidIdTokenError:
        raise HTTPException(status_code=401, detail="Invalid ID token")
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(status_code=401, detail="ID token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

# ------------- Stats helpers ----------------
XP_PER_LAB = 20

def award_xp_and_update_streak(uid: str, completed_lab_id: str):
    """
    Award XP if this lab wasn't previously completed.
    Update user's streak based on last completion date.
    Returns the updated stats dict.
    """
    user_stats_ref = db.collection("users").document(uid).collection("meta").document("stats")
    progress_lab_ref = db.collection("progress").document(uid).collection("labs").document(completed_lab_id)

    # Read existing progress and stats
    prog_doc = progress_lab_ref.get()
    stats_doc = user_stats_ref.get()

    already_completed = False
    if prog_doc.exists:
        d = prog_doc.to_dict()
        already_completed = d.get("completed", False)

    # If already completed previously, do nothing to XP/streak
    if already_completed:
        # return current stats (create defaults if missing)
        if stats_doc.exists:
            return stats_doc.to_dict()
        else:
            return {"xp": 0, "streak": 0, "last_completed_date": None, "last_streak_date": None}

    # Award XP
    new_xp = (stats_doc.to_dict().get("xp", 0) if stats_doc.exists else 0) + XP_PER_LAB

    # Update streak
    today_utc = datetime.utcnow().date()
    last_completed_date = None
    if stats_doc.exists:
        last_completed_date = stats_doc.to_dict().get("last_completed_date")
        # stored as ISO date string; convert to date if exists
        if last_completed_date:
            try:
                last_completed_date = datetime.fromisoformat(last_completed_date).date()
            except:
                last_completed_date = None

    new_streak = 1
    if last_completed_date:
        if last_completed_date == today_utc:
            # already counted today (shouldn't happen because we checked already_completed, but safe)
            new_streak = stats_doc.to_dict().get("streak", 1)
        elif last_completed_date == (today_utc - timedelta(days=1)):
            # continue streak
            new_streak = stats_doc.to_dict().get("streak", 0) + 1
        else:
            # break and start new
            new_streak = 1

    # write stats
    payload = {
        "xp": new_xp,
        "streak": new_streak,
        "last_completed_date": datetime.utcnow().isoformat(),
        "last_streak_date": datetime.utcnow().isoformat()
    }
    user_stats_ref.set(payload, merge=True)
    return payload

# ------------- Progress endpoint (secured) ----------------
@app.post("/progress")
async def progress(update: ProgressUpdate, request: Request, authorization: Optional[str] = Header(None)):
    uid = verify_bearer_token(authorization)

    # validate lab_id known
    known_ids = {l["id"] for l in LABS}
    if update.lab_id not in known_ids:
        raise HTTPException(status_code=400, detail="Unknown lab_id")

    try:
        coll = db.collection("progress").document(uid).collection("labs")
        doc_ref = coll.document(update.lab_id)
        payload = {
            "completed": bool(update.completed),
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }
        doc_ref.set(payload, merge=True)

        # award xp and update streak only when marking completed true
        if update.completed:
            stats = award_xp_and_update_streak(uid, update.lab_id)
        else:
            stats = db.collection("users").document(uid).collection("meta").document("stats").get().to_dict() if db.collection("users").document(uid).collection("meta").document("stats").get().exists else {}

        return {"status": "ok", "saved": payload, "uid": uid, "stats": stats}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ------------- Stats endpoint (secured read) ----------------
@app.get("/user/stats/{user_id}")
def get_user_stats(user_id: str = Path(...), authorization: Optional[str] = Header(None)):
    token_uid = verify_bearer_token(authorization)
    if token_uid != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: uid mismatch")

    try:
        stats_doc = db.collection("users").document(user_id).collection("meta").document("stats").get()
        if not stats_doc.exists:
            # return default stats
            return {"status": "ok", "stats": {"xp": 0, "streak": 0, "last_completed_date": None}}
        else:
            data = stats_doc.to_dict()
            # compute derived fields
            xp = data.get("xp", 0)
            level = xp // 100
            return {"status": "ok", "stats": {**data, "level": level}}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/progress/{user_id}")
def get_progress(user_id: str = Path(..., description="UID to fetch progress for"),
                 authorization: Optional[str] = Header(None)):
    # Verify token and ensure the caller is the same user
    token_uid = verify_bearer_token(authorization)
    if token_uid != user_id:
        raise HTTPException(status_code=403, detail="Forbidden: uid mismatch")

    try:
        coll = db.collection("progress").document(user_id).collection("labs")
        docs = coll.stream()
        result = {}
        for d in docs:
            result[d.id] = d.to_dict()
        return {"status": "ok", "progress": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))