from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import os
import uuid
from dotenv import load_dotenv
import google.generativeai as genai
# from transformers import pipeline # Removed to save memory
from PIL import Image
import io
import pandas as pd
import cv2
import numpy as np

# Load environment variables from .env file
load_dotenv()

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; refine for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Data Models ---

class Patient(BaseModel):
    id: str
    name: str
    age: int
    gender: str
    blood_group: str
    global_id: str
    profile_image: Optional[str] = None
    location: Optional[str] = "Los Angeles, CA"
    medical_history: List[str] = []
    medications: List[str] = []
    allergies: List[str] = []
    family_history: List[str] = []
    lifestyle: dict = {"smoking": "Never", "alcohol": "Occasional", "exercise": "Regular"}
    blood_markers: dict = {}

class MedicalReport(BaseModel):
    id: str
    patient_id: str
    filename: str
    upload_date: datetime
    analysis_summary: str
    abnormal_flags: bool

class HealthVital(BaseModel):
    patient_id: str
    timestamp: datetime
    heart_rate: int
    steps: int
    oxygen_level: int
    calories: int

# --- Mock Database ---
mock_patients = {
    "P123": Patient(id="P123", name="Shaik Naveed", age=28, gender="Male", blood_group="O+", global_id="GLOB-001")
}

current_vitals = {
    "P123": HealthVital(
        patient_id="P123",
        timestamp=datetime.now(),
        heart_rate=72,
        steps=8432,
        oxygen_level=98,
        calories=450
    )
}

# --- AI Provider Configuration (Lazy Loaded) ---
# _image_classifier = None # Removed to save memory
_gemini_model = None

def get_image_classifier():
    # Local transformers model removed to fit Render's 512MB RAM limit
    return False

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

from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
import bcrypt
from datetime import timedelta

# Auth Configuration
SECRET_KEY = "SUPER_SECRET_HEALTH_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Secure Hashing Helpers (Replacing broken passlib in Python 3.13)
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

# Mock User Database
mock_users = {
    "admin@healthverse.ai": {
        "username": "admin@healthverse.ai",
        "hashed_password": hash_password("health2026"),
        "name": "Dr. Shaik Naveed"
    }
}

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/api/register")
async def register(user: UserAuth):
    if user.username in mock_users:
        raise HTTPException(status_code=400, detail="User already exists")
    
    mock_users[user.username] = {
        "username": user.username,
        "hashed_password": hash_password(user.password),
        "name": user.name or user.username.split('@')[0]
    }
    
    # Also create a patient record for this new user
    patient_id = f"P{len(mock_patients) + 123}"
    mock_patients[patient_id] = Patient(
        id=patient_id, 
        name=mock_users[user.username]["name"], 
        age=25, gender="Not Specified", 
        blood_group="N/A", 
        global_id=f"GLOB-{len(mock_patients) + 1:03d}"
    )
    
    return {"status": "success", "message": "User registered successfully"}

@app.get("/api/admin/users")
async def get_all_users():
    """Returns a list of all registered users (for admin monitoring)"""
    users_list = []
    for username, data in mock_users.items():
        users_list.append({
            "username": username,
            "name": data.get("name", "N/A")
        })
    return {
        "total_users": len(users_list),
        "users": users_list
    }

@app.post("/api/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = mock_users.get(form_data.username)
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(data={"sub": form_data.username})
    return {
        "access_token": access_token, 
        "token_type": "bearer", 
        "user": {"name": user["name"], "email": user["username"]}
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
async def get_patient(patient_id: str):
    if patient_id not in mock_patients:
        raise HTTPException(status_code=404, detail="Patient not found")
    return mock_patients[patient_id]

@app.post("/api/patient/{patient_id}")
async def update_patient(patient_id: str, updated_data: dict):
    if patient_id not in mock_patients:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    patient = mock_patients[patient_id]
    if "name" in updated_data: patient.name = updated_data["name"]
    if "age" in updated_data: patient.age = updated_data["age"]
    if "gender" in updated_data: patient.gender = updated_data["gender"]
    if "blood_group" in updated_data: patient.blood_group = updated_data["blood_group"]
    if "profile_image" in updated_data: patient.profile_image = updated_data["profile_image"]
    if "location" in updated_data: patient.location = updated_data["location"]
    if "medical_history" in updated_data: patient.medical_history = updated_data["medical_history"]
    if "medications" in updated_data: patient.medications = updated_data["medications"]
    if "allergies" in updated_data: patient.allergies = updated_data["allergies"]
    if "family_history" in updated_data: patient.family_history = updated_data["family_history"]
    if "lifestyle" in updated_data: patient.lifestyle = updated_data["lifestyle"]
    
    return {"status": "success", "patient": patient}

@app.post("/api/patient/{patient_id}/upload-image")
async def upload_profile_image(patient_id: str, file: UploadFile = File(...)):
    if patient_id not in mock_patients:
        raise HTTPException(status_code=404, detail="Patient not found")
    mock_url = f"https://api.dicebear.com/7.x/avataaars/svg?seed={file.filename}"
    mock_patients[patient_id].profile_image = mock_url
    return {"status": "success", "image_url": mock_url}

@app.post("/api/analyze")
async def analyze_report(file: UploadFile = File(...)):
    markers = {
        "glucose": {"name": "Glucose", "value": 115, "min": 70, "max": 99, "unit": "mg/dL"},
        "cholesterol": {"name": "Total Cholesterol", "value": 195, "min": 100, "max": 200, "unit": "mg/dL"},
        "hemoglobin": {"name": "Hemoglobin", "value": 14.2, "min": 13.5, "max": 17.5, "unit": "g/dL"}
    }
    
    analysis_text = (
        f"AI Report Analysis for {file.filename}:\n"
        "- Glucose: 115 mg/dL (High)\n"
        "- Cholesterol: 195 mg/dL (Normal)\n"
        "- Hemoglobin: 14.2 g/dL (Normal)\n"
        "Recommendation: Monitor glucose levels and consider a low-sugar diet."
    )
    
    mock_patients["P123"].blood_markers = markers
    report = MedicalReport(
        id=str(uuid.uuid4()),
        patient_id="P123",
        filename=file.filename,
        upload_date=datetime.now(),
        analysis_summary=analysis_text,
        abnormal_flags=True
    )
    return {"status": "success", "report": report, "markers": markers}

@app.get("/api/vitals/{patient_id}")
async def get_vitals(patient_id: str):
    if patient_id not in current_vitals:
        return HealthVital(patient_id=patient_id, timestamp=datetime.now(), heart_rate=70, steps=0, oxygen_level=99, calories=0)
    return current_vitals[patient_id]

@app.post("/api/simulate/{patient_id}")
async def simulate_health_impact(patient_id: str, changes: dict):
    vitals = current_vitals.get(patient_id)
    patient = mock_patients.get(patient_id)
    if not vitals: return {"error": "Vitals not found"}
    
    sim_glucose = 100
    if patient and patient.blood_markers:
        sim_glucose = patient.blood_markers.get("glucose", {}).get("value", 100)
    sim_glucose -= changes.get("sugar_reduction_pct", 0) * 0.5
    
    cv_score = 0.15
    if changes.get("steps_increase", 0) > 2000: cv_score = 0.10
    
    diabetes_score = min(0.95, 0.45 + (sim_glucose - 100) / 100) if sim_glucose > 100 else 0.20
    
    return {
        "cv_risk": cv_score,
        "diabetes_risk": diabetes_score,
        "improvement_pct": max(0, (0.45 - diabetes_score) * 100)
    }

@app.post("/api/analyze-heart")
async def analyze_heart_image(file: UploadFile = File(...)):
    classifier = get_image_classifier()
    if not classifier:
        return {
            "status": "simulated",
            "prediction": "Normal",
            "confidence": 0.95,
            "explanation": "The AI model is in simulation mode or failed to load. No heart disease detected."
        }
    
    try:
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        cv_img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if cv_img is None: raise HTTPException(status_code=400, detail="Invalid image file")
        cv_img_rgb = cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB)
        image = Image.fromarray(cv_img_rgb)
        
        results = classifier(image)
        top_result = results[0]
        label = top_result['label']
        score = top_result['score']
        is_abnormal = score > 0.5
        prediction = "Heart Disease Detected" if is_abnormal else "No Heart Disease Detected"
        
        explanation = f"Based on the visual analysis, the AI detected patterns associated with {label} (Confidence: {score:.2f})."
        if is_abnormal: explanation += " Consult a cardiologist for a thorough clinical evaluation."
        else: explanation += " The heart structure appears within normal parameters."

        return {"status": "success", "prediction": prediction, "confidence": score, "explanation": explanation}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image analysis failed: {str(e)}")

@app.post("/api/chat")
async def health_assistant_chat(message: str, patient_id: str):
    patient = mock_patients.get(patient_id)
    vitals = current_vitals.get(patient_id)
    context_parts = []
    if vitals: context_parts.append(f"Vitals: Heart Rate {vitals.heart_rate} BPM, Steps {vitals.steps}, Oxygen {vitals.oxygen_level}%, Calories {vitals.calories}.")
    if patient:
        if patient.medical_history: context_parts.append(f"Medical History: {', '.join(patient.medical_history)}")
        if patient.medications: context_parts.append(f"Medications: {', '.join(patient.medications)}")
        if patient.allergies: context_parts.append(f"Allergies: {', '.join(patient.allergies)}")
        if patient.lifestyle: context_parts.append(f"Lifestyle: {patient.lifestyle}")

    vitals_context = " ".join(context_parts)
    gemini = get_gemini_model()
    if not gemini: return {"response": f"[MOCK MODE] Dr. Heart says your HR is fine. Vitals: {vitals_context}", "context": "mock_chat"}

    try:
        system_instruction = f"You are a 'Clinical Panel of Experts'. Respond based on context: {vitals_context}"
        full_prompt = f"{system_instruction}\n\nUser Message: {message}"
        response = gemini.generate_content(full_prompt)
        return {"response": response.text, "context": "multi_agent_panel"}
    except Exception as e:
        return {"response": f"I encountered an error: {str(e)}", "context": "error"}

class RiskScore(BaseModel):
    category: str
    score: float
    trend: str
    recommendation: str

@app.get("/api/risk/{patient_id}")
async def get_risk_analysis(patient_id: str):
    patient = mock_patients.get(patient_id)
    vitals = current_vitals.get(patient_id)
    cv_score = 0.15 
    cv_recommendation = "Heart rate is optimal."
    if vitals and vitals.heart_rate > 90:
        cv_score = 0.45
        cv_recommendation = "Elevated heart rate detected."
    diabetes_score = 0.45
    if patient and patient.blood_markers:
        glucose = patient.blood_markers.get("glucose", {}).get("value", 0)
        if glucose > 100: diabetes_score = min(0.95, 0.45 + (glucose - 100) / 100)
    risks = [
        RiskScore(category="Cardiovascular", score=cv_score, trend="stable", recommendation=cv_recommendation),
        RiskScore(category="Diabetes Type 2", score=diabetes_score, trend="stable", recommendation="Monitor sugar intake."),
        RiskScore(category="Hypertension", score=0.20, trend="stable", recommendation="Blood pressure is normal.")
    ]
    return risks

class EmergencyAlert(BaseModel):
    id: str
    patient_id: str
    type: str
    message: str
    timestamp: datetime

@app.get("/api/health-plan/{patient_id}")
async def get_health_plan(patient_id: str):
    patient = mock_patients.get(patient_id)
    vitals = current_vitals.get(patient_id)
    gemini = get_gemini_model()
    if not gemini: return [{"task": "Hydration: Drink 2L of water", "completed": False}]
    prompt = f"Generate a daily health checklist for a patient with these vitals: {vitals}. Return 4 tasks."
    try:
        response = gemini.generate_content(prompt)
        tasks = [line.strip("- ").strip() for line in response.text.split("\n") if line.strip()][:4]
        return [{"task": t, "completed": False} for t in tasks]
    except: return [{"task": "Check hydration", "completed": False}]

@app.get("/api/vitals/{patient_id}/history")
async def get_vitals_history(patient_id: str):
    history = []
    for i in range(7):
        date = datetime.now().replace(day=max(1, datetime.now().day - (6-i)))
        history.append({"date": date.strftime("%b %d"), "heart_rate": 70 + (i % 3) * 5, "oxygen_level": 98 - (i % 2), "steps": 5000 + i * 1000})
    return history

@app.get("/api/alerts/{patient_id}")
async def get_alerts(patient_id: str):
    vitals = current_vitals.get(patient_id)
    alerts = []
    if vitals:
        if vitals.heart_rate > 100: alerts.append(EmergencyAlert(id=str(uuid.uuid4()), patient_id=patient_id, type="CRITICAL", message=f"High Heart Rate: {vitals.heart_rate} BPM", timestamp=datetime.now()))
        if vitals.oxygen_level < 94: alerts.append(EmergencyAlert(id=str(uuid.uuid4()), patient_id=patient_id, type="CRITICAL", message=f"Low Oxygen: {vitals.oxygen_level}%", timestamp=datetime.now()))
    return alerts
