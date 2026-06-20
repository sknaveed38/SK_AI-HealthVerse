import os
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
import datetime

# SQLite database URL - Use absolute path to ensure it works regardless of CWD
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'healthverse.db')}"

engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)

class Patient(Base):
    __tablename__ = "patients"
    id = Column(String, primary_key=True, index=True)
    name = Column(String)
    age = Column(Integer)
    gender = Column(String)
    blood_group = Column(String)
    global_id = Column(String)
    profile_image = Column(String, nullable=True)
    location = Column(String, nullable=True)
    medical_history = Column(JSON, default=[])
    medications = Column(JSON, default=[])
    allergies = Column(JSON, default=[])
    family_history = Column(JSON, default=[])
    lifestyle = Column(JSON, default={})
    blood_markers = Column(JSON, default={})

class MedicalReport(Base):
    __tablename__ = "medical_reports"
    id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    filename = Column(String)
    upload_date = Column(DateTime, default=datetime.datetime.utcnow)
    analysis_summary = Column(String)
    abnormal_flags = Column(Boolean)

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    doctor_name = Column(String)
    date_time = Column(DateTime)
    reason = Column(String)
    status = Column(String, default="Scheduled")

class HealthVital(Base):
    __tablename__ = "health_vitals"
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String, ForeignKey("patients.id"))
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    heart_rate = Column(Integer)
    steps = Column(Integer)
    oxygen_level = Column(Integer)
    calories = Column(Integer)



def init_db():
    Base.metadata.create_all(bind=engine)
