"""
CareBank AI – FastAPI Backend
"""

import io
import os

from dotenv import load_dotenv
import pandas as pd
import pdfplumber
from typing import Optional

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import timedelta, datetime
from sqlalchemy import func

import agents
from database import engine, get_db
import models
import auth

# Load env
load_dotenv()

# ✅ SINGLE APP INSTANCE (IMPORTANT)
app = FastAPI(title="CareBank Unified API", version="1.0.0")

# ✅ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ DB INIT
models.Base.metadata.create_all(bind=engine)

orchestrator = agents.Orchestrator()
_latest_context: dict = {}

# ---------------------
# MODELS
# ---------------------

class UserCreate(BaseModel):
    username: str
    password: str
    role: Optional[str] = "customer"

class ResetPassword(BaseModel):
    username: str
    new_password: str

class ChatRequest(BaseModel):
    message: str
    context: str = ""

class SavingsGoalCreate(BaseModel):
    name: str
    target: float
    deadline: str

class SavingsGoalUpdate(BaseModel):
    saved: float

class FlagRequest(BaseModel):
    reason: str


# ---------------------
# BASIC ROUTES
# ---------------------

@app.get("/")
def root():
    return {"status": "CareBank AI API is running"}


# ---------------------
# AUTH
# ---------------------

@app.post("/api/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(models.User).filter(models.User.username == user.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already registered")

    hashed_pw = auth.get_password_hash(user.password)

    new_user = models.User(
        username=user.username,
        hashed_password=hashed_pw,
        role=user.role if user.role in ["customer", "banker"] else "customer"
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    token = auth.create_access_token(data={"sub": new_user.username})
    return {"access_token": token, "role": new_user.role}


@app.post("/api/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()

    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = auth.create_access_token(data={"sub": user.username})
    return {"access_token": token, "role": user.role}


# ---------------------
# RESET PASSWORD (FIXED)
# ---------------------

@app.post("/api/reset-password")
def reset_password(data: ResetPassword, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        func.lower(models.User.username) == data.username.lower()
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.hashed_password = auth.get_password_hash(data.new_password)
    db.commit()

    return {"message": "Password updated successfully"}


# ---------------------
# FILE UPLOAD
# ---------------------

@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    contents = await file.read()

    if file.filename.endswith(".csv"):
        df = pd.read_csv(io.StringIO(contents.decode("utf-8")))
    else:
        raise HTTPException(status_code=400, detail="Only CSV supported in demo")

    for _, row in df.iterrows():
        txn = models.Transaction(
            user_id=current_user.id,
            date=str(row.get("Date")),
            description=str(row.get("Description")),
            amount=float(row.get("Amount")),
            category="Pending"
        )
        db.add(txn)

    db.commit()
    return {"status": "Uploaded successfully"}


# ---------------------
# DASHBOARD
# ---------------------

@app.get("/api/dashboard")
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user)
):
    txns = db.query(models.Transaction).filter(
        models.Transaction.user_id == current_user.id
    ).all()

    if not txns:
        return None

    df = pd.DataFrame([{
        "Date": t.date,
        "Description": t.description,
        "Amount": t.amount
    } for t in txns])

    result = orchestrator.execute(df)

    return result


# ---------------------
# CHAT
# ---------------------

@app.post("/api/chat")
async def chat(request: ChatRequest):
    return {"reply": "AI response placeholder"}


# ---------------------
# RUN
# ---------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)