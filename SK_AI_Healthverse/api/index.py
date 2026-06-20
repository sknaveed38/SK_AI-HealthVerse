from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import uuid
from dotenv import load_dotenv
import google.generativeai as genai
from PIL import Image
import io
import pandas as pd
import cv2
import numpy as np
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from datetime import timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, engine, init_db, User, Patient, MedicalReport, HealthVital, Appointment

# Initialize Database
init_db()

# Load environment variables
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Auth Configuration
SECRET_KEY = "SUPER_SECRET_HEALTH_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Secure Hashing Helpers
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

class UserAuth(BaseModel):
    username: str
    password: str
    name: Optional[str] = None

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/api/register")
async def register(user: UserAuth, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(
        username=user.username,
        hashed_password=hash_password(user.password),
        name=user.name or user.username.split('@')[0]
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"status": "success", "message": "User registered successfully"}

@app.post("/api/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": user.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {"name": user.name, "email": user.username}
    }

@app.get("/api/health")
async def health_check():
    ai_status = "Gemini Active" if get_gemini_model() else "Simulated"
    return {
        "status": "healthy", 
        "service": "AI HealthVerse API", 
        "version": "1.2.0",
        "ai_engine": ai_status
    }

@app.get("/api/patient/{patient_id}")
async def get_patient(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@app.post("/api/patient/{patient_id}")
async def update_patient(patient_id: str, updated_data: dict, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    for key, value in updated_data.items():
        if hasattr(patient, key):
            setattr(patient, key, value)
    
    db.commit()
    db.refresh(patient)
    return {"status": "success", "patient": patient}

@app.get("/api/vitals/{patient_id}")
async def get_vitals(patient_id: str, db: Session = Depends(get_db)):
    vitals = db.query(HealthVital).filter(HealthVital.patient_id == patient_id).order_by(HealthVital.timestamp.desc()).first()
    if not vitals:
        return HealthVital(patient_id=patient_id, timestamp=datetime.utcnow(), heart_rate=70, steps=0, oxygen_level=99, calories=0)
    return vitals

@app.get("/api/risk/{patient_id}")
async def get_risk_analysis(patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    vitals = db.query(HealthVital).filter(HealthVital.patient_id == patient_id).order_by(HealthVital.timestamp.desc()).first()
    
    cv_score = 0.15 
    cv_recommendation = "Heart rate is optimal."
    if vitals and vitals.heart_rate > 90:
        cv_score = 0.45
        cv_recommendation = "Elevated heart rate detected."
    
    diabetes_score = 0.45
    if patient and patient.blood_markers:
        glucose = patient.blood_markers.get("glucose", {}).get("value", 0)
        if glucose > 100: diabetes_score = min(0.95, 0.45 + (glucose - 100) / 100)
    
    return [
        {"category": "Cardiovascular", "score": cv_score, "trend": "stable", "recommendation": cv_recommendation},
        {"category": "Diabetes Type 2", "score": diabetes_score, "trend": "stable", "recommendation": "Monitor sugar intake."},
        {"category": "Hypertension", "score": 0.20, "trend": "stable", "recommendation": "Blood pressure is normal."}
    ]

@app.get("/api/health-plan/{patient_id}")
async def get_health_plan(patient_id: str, db: Session = Depends(get_db)):
    vitals = db.query(HealthVital).filter(HealthVital.patient_id == patient_id).order_by(HealthVital.timestamp.desc()).first()
    gemini = get_gemini_model()
    if not gemini: return [{"task": "Hydration: Drink 2L of water", "completed": False}]
    
    prompt = f"Generate a daily health checklist for a patient with these vitals: {vitals}. Return 4 tasks."
    try:
        response = gemini.generate_content(prompt)
        tasks = [line.strip("- ").strip() for line in response.text.split("\n") if line.strip()][:4]
        return [{"task": t, "completed": False} for t in tasks]
    except: return [{"task": "Check hydration", "completed": False}]

@app.get("/api/alerts/{patient_id}")
async def get_alerts(patient_id: str, db: Session = Depends(get_db)):
    vitals = db.query(HealthVital).filter(HealthVital.patient_id == patient_id).order_by(HealthVital.timestamp.desc()).first()
    alerts = []
    if vitals:
        if vitals.heart_rate > 100: alerts.append({"id": str(uuid.uuid4()), "patient_id": patient_id, "type": "CRITICAL", "message": f"High Heart Rate: {vitals.heart_rate} BPM", "timestamp": datetime.utcnow()})
        if vitals.oxygen_level < 94: alerts.append({"id": str(uuid.uuid4()), "patient_id": patient_id, "type": "CRITICAL", "message": f"Low Oxygen: {vitals.oxygen_level}%", "timestamp": datetime.utcnow()})
    return alerts

@app.get("/api/vitals/{patient_id}/history")
async def get_vitals_history(patient_id: str, db: Session = Depends(get_db)):
    history = db.query(HealthVital).filter(HealthVital.patient_id == patient_id).order_by(HealthVital.timestamp.desc()).limit(7).all()
    return [{"date": v.timestamp.strftime("%b %d"), "heart_rate": v.heart_rate, "oxygen_level": v.oxygen_level, "steps": v.steps} for v in history]

# Seed Data (Run once or on startup if db is empty)
@app.on_event("startup")
async def startup_event():
    db = SessionLocal()
    if not db.query(Patient).filter(Patient.id == "P124").first():
        new_patient = Patient(id="P124", name="Shaik Naveed", age=28, gender="Male", blood_group="O+")
        db.add(new_patient)
        db.commit()
    db.close()

@app.post("/api/chat")
async def health_assistant_chat(message: str, patient_id: str, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    vitals = db.query(HealthVital).filter(HealthVital.patient_id == patient_id).order_by(HealthVital.timestamp.desc()).first()
    
    context_parts = []
    if vitals: 
        context_parts.append(f"Vitals: Heart Rate {vitals.heart_rate} BPM, Steps {vitals.steps}, Oxygen {vitals.oxygen_level}%, Calories {vitals.calories}.")
    if patient:
        if patient.medical_history: context_parts.append(f"Medical History: {', '.join(patient.medical_history)}")
        if patient.medications: context_parts.append(f"Medications: {', '.join(patient.medications)}")
        if patient.allergies: context_parts.append(f"Allergies: {', '.join(patient.allergies)}")
        if patient.lifestyle: context_parts.append(f"Lifestyle: {str(patient.lifestyle)}")

    vitals_context = " ".join(context_parts)
    gemini = get_gemini_model()
    
    if not gemini:
        raise HTTPException(status_code=503, detail="AI engine not configured.")

    try:
        system_instruction = f"You are a 'Clinical Panel of Experts'. Respond based on context: {vitals_context}"
        full_prompt = f"{system_instruction}\n\nUser Message: {message}"
        response = gemini.generate_content(full_prompt)
        return {"response": response.text, "context": "multi_agent_panel"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error communicating with AI: {str(e)}")

class AppointmentCreate(BaseModel):
    doctor_name: str
    date_time: datetime
    reason: str

@app.post("/api/appointments/{patient_id}")
async def create_appointment(patient_id: str, appointment: AppointmentCreate, db: Session = Depends(get_db)):
    new_app = Appointment(
        patient_id=patient_id,
        doctor_name=appointment.doctor_name,
        date_time=appointment.date_time,
        reason=appointment.reason
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

@app.get("/api/appointments/{patient_id}")
async def get_appointments(patient_id: str, db: Session = Depends(get_db)):
    return db.query(Appointment).filter(Appointment.patient_id == patient_id).all()

# --- AI Provider Configuration ---
_gemini_model = None
def get_gemini_model():
    global _gemini_model
    if _gemini_model is None:
        GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
        if GOOGLE_API_KEY:
            try:
                genai.configure(api_key=GOOGLE_API_KEY)
                _gemini_model = genai.GenerativeModel('gemini-flash-latest')
            except Exception as e:
                print(f"Error configuring Gemini: {e}")
                _gemini_model = False
    return _gemini_model
