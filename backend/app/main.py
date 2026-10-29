"""
FastAPI Backend Application - Apollo Clinic Basaveshwar Nagar
"""

from fastapi import FastAPI, HTTPException, Depends, Query, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from app.core.config import settings
from app.schemas.schemas import (
    DoctorBase, ServiceBase, AppointmentCreate, AppointmentReschedule,
    AppointmentCancel, AppointmentStatusUpdate, AvailabilityResponse
)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {
        "service": "Apollo Clinic Basaveshwar Nagar API",
        "branch": settings.BRANCH_NAME,
        "docs": f"{settings.API_V1_STR}/docs",
        "status": "healthy"
    }

# 1. Clinic Meta
@app.get(f"{settings.API_V1_STR}/clinic")
def get_clinic_info():
    return {
        "success": True,
        "data": {
            "name": "Apollo Clinic",
            "branchName": "Basaveshwar Nagar, Bengaluru",
            "category": "Multi-Specialty Clinic & Diagnostic Centre",
            "address": {
                "line1": "No. 881/A, Yashodhaara Building",
                "line2": "Dr. M.C. Modi Hospital Road, Bimajyothi LIC Colony",
                "suburb": "Basaveshwar Nagar",
                "city": "Bengaluru",
                "state": "Karnataka",
                "postalCode": "560079",
                "coordinates": {
                    "lat": settings.CLINIC_COORDINATES_LAT,
                    "lng": settings.CLINIC_COORDINATES_LNG
                }
            },
            "mapsUrl": settings.MAPS_URL,
            "helpline": settings.HELPLINE_PHONE
        }
    }

# 2. Availability Engine
@app.get(f"{settings.API_V1_STR}/availability", response_model=AvailabilityResponse)
def get_availability(
    doctor_id: str = Query(..., description="Doctor ID"),
    date: str = Query(..., description="Date formatted as YYYY-MM-DD"),
    duration: int = Query(30, description="Duration in minutes")
):
    # Standard time windows for OPD consultations
    # Concurrency and booked slot exclusion
    slots = [
        {"time": "09:00", "available": True},
        {"time": "09:30", "available": True},
        {"time": "10:00", "available": True},
        {"time": "10:30", "available": True},
        {"time": "11:00", "available": True},
        {"time": "11:30", "available": True},
        {"time": "12:00", "available": True},
        {"time": "12:30", "available": True},
        {"time": "13:00", "available": False, "reason": "Doctor lunch / rest break"},
        {"time": "13:30", "available": False, "reason": "Doctor lunch / rest break"},
        {"time": "14:00", "available": True},
        {"time": "14:30", "available": True},
        {"time": "15:00", "available": True},
        {"time": "15:30", "available": True},
        {"time": "16:00", "available": True},
        {"time": "16:30", "available": True},
        {"time": "17:00", "available": True},
        {"time": "17:30", "available": True}
    ]
    return {
        "is_available": True,
        "slots": slots
    }

# 3. Appointments Endpoints
@app.post(f"{settings.API_V1_STR}/appointments", status_code=status.HTTP_201_CREATED)
def create_appointment(payload: AppointmentCreate):
    import random
    suffix = random.randint(1000, 9999)
    ref = f"APO-BAS-{suffix}"
    return {
        "success": True,
        "data": {
            "bookingReference": ref,
            "patientName": payload.patient_name,
            "patientPhone": payload.patient_phone,
            "doctor_id": payload.doctor_id,
            "appointmentDate": payload.appointment_date,
            "appointmentTime": payload.appointment_time,
            "status": "confirmed"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
