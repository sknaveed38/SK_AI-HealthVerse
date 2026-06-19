from sqlalchemy import Column, String, Integer, Boolean, DateTime, JSON, ForeignKey, Float
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"

    username = Column(String, primary_key=True, index=True)
    hashed_password = Column(String, nullable=False)
    name = Column(String)
    patient_id = Column(String, ForeignKey("patients.id"))

    patient = relationship("Patient", back_populates="user")

class Patient(Base):
    __tablename__ = "patients"

    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    age = Column(Integer)
    gender = Column(String)
    blood_group = Column(String)
    global_id = Column(String, unique=True)
    profile_image = Column(String, nullable=True)
    location = Column(String, default="Los Angeles, CA")
    
    # Store lists and dicts as JSON
    medical_history = Column(JSON, default=[])
    medications = Column(JSON, default=[])
    allergies = Column(JSON, default=[])
    family_history = Column(JSON, default=[])
    lifestyle = Column(JSON, default={"smoking": "Never", "alcohol": "Occasional", "exercise": "Regular"})
    blood_markers = Column(JSON, default={})

    user = relationship("User", back_populates="patient", uselist=False)
    reports = relationship("MedicalReport", back_populates="patient")
    vitals = relationship("HealthVital", back_populates="patient")

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"))
    filename = Column(String)
    upload_date = Column(DateTime, default=datetime.utcnow)
    analysis_summary = Column(String)
    abnormal_flags = Column(Boolean, default=False)

    patient = relationship("Patient", back_populates="reports")

class HealthVital(Base):
    __tablename__ = "health_vitals"

    id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.utcnow)
    heart_rate = Column(Integer)
    steps = Column(Integer)
    oxygen_level = Column(Integer)
    calories = Column(Integer)

    patient = relationship("Patient", back_populates="vitals")
