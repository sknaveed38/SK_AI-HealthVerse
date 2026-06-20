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
from database import SessionLocal, engine, init_db, User, Patient, MedicalReport, HealthVital

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
async def health_assistant_chat(message: str, patient_id: str, db: Session = Depends(get_db)):
    # Retrieve patient data from database instead of mock_patients
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


# --- Advanced AI Core Utilities & Endpoints ---
import json
import re

def clean_and_parse_json(text: str) -> dict:
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        json_str = match.group(0)
    else:
        json_str = text
    return json.loads(json_str)


# --- Fallback Heuristic Databases for Offline/Quota Limits ---

def check_symptoms_fallback(body_part: str, symptoms: str):
    urgency = "LOW"
    conditions = []
    symptoms_lower = symptoms.lower()
    if "chest" in body_part or "pain" in symptoms_lower:
        urgency = "HIGH"
        conditions = [
            {"name": "Angina / Chest Strain", "probability": 0.65},
            {"name": "Cardiovascular Stress", "probability": 0.30}
        ]
        advice = "Seek professional medical evaluation immediately. Monitor your heart rate and sit down."
    elif "head" in body_part:
        urgency = "MEDIUM"
        conditions = [
            {"name": "Tension Headache", "probability": 0.70},
            {"name": "Migraine", "probability": 0.45}
        ]
        advice = "Rest in a quiet, dark room, hydrate well, and consider over-the-counter pain relief."
    else:
        conditions = [
            {"name": "Muscle Strain", "probability": 0.60},
            {"name": "Minor Fatigue", "probability": 0.50}
        ]
        advice = "Keep the area rested, apply a warm compress if needed, and observe symptoms."
    return {
        "urgency": urgency,
        "advice": advice,
        "conditions": conditions
    }

def analyze_mental_health_fallback(journal_entry: str):
    text = journal_entry.lower()
    stress = 5
    sentiment = "Neutral"
    if any(w in text for w in ["stressed", "anxious", "sad", "angry", "tired", "worried"]):
        stress = 8
        sentiment = "Negative"
        tip = "Try taking five deep, slow breaths. Remember to step away from work and stretch."
    elif any(w in text for w in ["happy", "good", "great", "excellent", "relaxed", "glad"]):
        stress = 2
        sentiment = "Positive"
        tip = "Wonderful to hear! Keep up this positive momentum and write down one thing you are grateful for."
    else:
        tip = "Reflecting on your day is a great habit. Try writing down three small wins from today."
    return {
        "stress_level": stress,
        "sentiment": sentiment,
        "wellness_tip": tip
    }

def get_nutrition_plan_fallback(patient_id: str):
    return {
        "meal_plan": {
            "day1": {
                "breakfast": "Oatmeal with chia seeds, banana, and blueberries",
                "lunch": "Quinoa bowl with spinach, cherry tomatoes, and grilled tofu",
                "dinner": "Grilled salmon with asparagus and roasted sweet potato"
            },
            "day2": {
                "breakfast": "Greek yogurt parfaits with raw walnuts and a drizzle of honey",
                "lunch": "Whole-wheat turkey wrap with hummus and avocado",
                "dinner": "Stir-fried chicken breast with broccoli, bell peppers, and brown rice"
            },
            "day3": {
                "breakfast": "Scrambled egg whites with spinach, tomatoes, and whole grain toast",
                "lunch": "Lentil vegetable soup with a side of mixed baby greens",
                "dinner": "Baked cod fillets with garlic green beans and quinoa"
            }
        }
    }

def check_medication_interaction_fallback(medications: list[str], new_medication: str):
    safe = True
    warning = ""
    details = f"No known major interactions detected for {new_medication} in simulated database."
    
    current_meds_lower = [m.lower() for m in medications]
    new_med_lower = new_medication.lower()
    
    if "warfarin" in current_meds_lower and "aspirin" == new_med_lower:
        safe = False
        warning = "High Risk of Bleeding!"
        details = "Both Aspirin and Warfarin thin the blood. Combining them significantly increases the risk of internal bleeding and bruising."
    elif "aspirin" in current_meds_lower and "warfarin" == new_med_lower:
        safe = False
        warning = "High Risk of Bleeding!"
        details = "Both Aspirin and Warfarin thin the blood. Combining them significantly increases the risk of internal bleeding and bruising."
    elif "ibuprofen" in current_meds_lower and "aspirin" == new_med_lower:
        safe = False
        warning = "Increased Gastric Bleeding Risk"
        details = "Combining multiple NSAIDs (Ibuprofen + Aspirin) increases the risk of stomach ulcers and gastrointestinal bleeding."
    elif "alcohol" in current_meds_lower and "acetaminophen" == new_med_lower:
        safe = False
        warning = "Severe Hepatotoxicity Risk"
        details = "Combining Alcohol with Acetaminophen (Paracetamol) causes extreme stress to the liver and can lead to acute liver damage."
        
    return {
        "safe": safe,
        "warning": warning,
        "details": details
    }


class SymptomQuery(BaseModel):
    body_part: str
    symptoms: str
    patient_id: str

@app.post("/api/check-symptoms")
async def check_symptoms(query: SymptomQuery):
    gemini = get_gemini_model()
    
    if not gemini:
        return check_symptoms_fallback(query.body_part, query.symptoms)
    
    prompt = (
        f"Analyze the following symptoms for body part '{query.body_part}':\n"
        f"Symptoms: {query.symptoms}\n\n"
        "Determine the urgency level: 'HIGH' (needs immediate medical attention), "
        "'MEDIUM' (should see a doctor soon), or 'LOW' (home care/rest).\n"
        "Suggest up to 3 potential conditions with their matching probabilities (between 0.0 and 1.0).\n"
        "Provide a short piece of medical advice/next steps.\n"
        "Return ONLY a JSON object in this exact format, with no markdown code blocks:\n"
        "{\n"
        '  "urgency": "HIGH" | "MEDIUM" | "LOW",\n'
        '  "advice": "Short summary of advice here.",\n'
        '  "conditions": [\n'
        '    {"name": "Condition Name", "probability": 0.75},\n'
        '    {"name": "Condition Name", "probability": 0.40}\n'
        "  ]\n"
        "}"
    )

    try:
        response = gemini.generate_content(prompt)
        result = clean_and_parse_json(response.text)
        return result
    except Exception as e:
        return check_symptoms_fallback(query.body_part, query.symptoms)


class MentalHealthQuery(BaseModel):
    journal_entry: str
    patient_id: str

@app.post("/api/mental-health/analyze")
async def analyze_mental_health(query: MentalHealthQuery):
    gemini = get_gemini_model()
    
    if not gemini:
        return analyze_mental_health_fallback(query.journal_entry)
    
    prompt = (
        f"Analyze this personal journal entry for sentiment and stress evaluation:\n"
        f"Entry: {query.journal_entry}\n\n"
        "Estimate the stress level on a scale of 1 to 10 (integer).\n"
        "Classify the overall sentiment: 'Positive', 'Negative', or 'Neutral'.\n"
        "Provide a helpful, comforting wellness tip.\n"
        "Return ONLY a JSON object in this exact format, with no markdown code blocks:\n"
        "{\n"
        '  "stress_level": 5,\n'
        '  "sentiment": "Positive" | "Negative" | "Neutral",\n'
        '  "wellness_tip": "comforting advice here"\n'
        "}"
    )

    try:
        response = gemini.generate_content(prompt)
        result = clean_and_parse_json(response.text)
        return result
    except Exception as e:
        return analyze_mental_health_fallback(query.journal_entry)


class NutritionQuery(BaseModel):
    patient_id: str

@app.post("/api/nutrition-plan")
async def get_nutrition_plan(query: NutritionQuery):
    gemini = get_gemini_model()
    
    if not gemini:
        return get_nutrition_plan_fallback(query.patient_id)
    
    patient = mock_patients.get(query.patient_id)
    vitals = current_vitals.get(query.patient_id)
    
    context = ""
    if patient:
        context += f"Age: {patient.age}, Gender: {patient.gender}, Blood Markers: {patient.blood_markers}. "
    if vitals:
        context += f"Heart Rate: {vitals.heart_rate} BPM, Steps: {vitals.steps} steps/day."

    prompt = (
        f"Generate a customized, heart-healthy 3-day meal plan for a patient with this health context:\n"
        f"{context}\n\n"
        "Provide a breakfast, lunch, and dinner for 3 days.\n"
        "Return ONLY a JSON object in this exact format, with no markdown code blocks:\n"
        "{\n"
        '  "meal_plan": {\n'
        '    "day1": {\n'
        '      "breakfast": "...",\n'
        '      "lunch": "...",\n'
        '      "dinner": "..."\n'
        '    },\n'
        '    "day2": {\n'
        '      "breakfast": "...",\n'
        '      "lunch": "...",\n'
        '      "dinner": "..."\n'
        '    },\n'
        '    "day3": {\n'
        '      "breakfast": "...",\n'
        '      "lunch": "...",\n'
        '      "dinner": "..."\n'
        '    }\n'
        "  }\n"
        "}"
    )

    try:
        response = gemini.generate_content(prompt)
        result = clean_and_parse_json(response.text)
        return result
    except Exception as e:
        return get_nutrition_plan_fallback(query.patient_id)


class MedicationCheckQuery(BaseModel):
    medications: list[str]
    new_medication: str

@app.post("/api/medication/check")
async def check_medication_interaction(query: MedicationCheckQuery):
    gemini = get_gemini_model()
    
    if not gemini:
        return check_medication_interaction_fallback(query.medications, query.new_medication)
    
    current_meds_str = ", ".join(query.medications) if query.medications else "None"
    prompt = (
        f"Analyze the potential drug interactions between adding the new medication '{query.new_medication}' "
        f"to a patient currently taking these medications: [{current_meds_str}].\n\n"
        "Determine if the combination is safe or if there is a warning/contraindication.\n"
        "Return ONLY a JSON object in this exact format, with no markdown code blocks:\n"
        "{\n"
        '  "safe": true | false,\n'
        '  "warning": "Short summary warning here if not safe, otherwise empty string.",\n'
        '  "details": "Detailed chemical or physiological interaction explanation here."\n'
        "}"
    )

    try:
        response = gemini.generate_content(prompt)
        result = clean_and_parse_json(response.text)
        return result
    except Exception as e:
        return check_medication_interaction_fallback(query.medications, query.new_medication)
