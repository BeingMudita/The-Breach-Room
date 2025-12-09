# backend/app/main.py
import os
from fastapi import FastAPI, HTTPException, Header, Request
from pydantic import BaseModel
from typing import List, Optional
from app.labs_config import LABS

# CORS
from fastapi.middleware.cors import CORSMiddleware

# Firestore (firebase-admin)
import firebase_admin
from firebase_admin import credentials, firestore, auth as firebase_auth
from datetime import datetime

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
        # initialize default app (will raise later if missing credentials)
        firebase_admin.initialize_app()
db = firestore.client()

class Lab(BaseModel):
    id: str
    title: str
    description: str
    url: str

class ProgressUpdate(BaseModel):
    # client may send user_id but it will be ignored in favour of verified token
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

def verify_bearer_token(authorization: Optional[str]) -> str:
    """
    Verify Firebase ID token passed in Authorization: Bearer <token>.
    Returns verified uid.
    Raises HTTPException on failure.
    """
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
        # catch-all for other firebase_admin errors
        raise HTTPException(status_code=401, detail=f"Token verification failed: {str(e)}")

# Accept progress updates and store to Firestore (requires valid Firebase ID token)
@app.post("/progress")
async def progress(update: ProgressUpdate, request: Request, authorization: Optional[str] = Header(None)):
    # 1) Verify token and extract uid
    uid = verify_bearer_token(authorization)

    # 2) Use verified uid regardless of client-supplied user_id
    try:
        coll = db.collection("progress").document(uid).collection("labs")
        doc_ref = coll.document(update.lab_id)
        payload = {
            "completed": bool(update.completed),
            "updated_at": datetime.utcnow().isoformat() + "Z"
        }
        doc_ref.set(payload, merge=True)
        return {"status": "ok", "saved": payload, "uid": uid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
