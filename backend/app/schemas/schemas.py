from datetime import date, time, datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field

class SpecialityBase(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    icon_name: Optional[str] = "stethoscope"
    active: bool = True

class DoctorBase(BaseModel):
    id: str
    name: str
    speciality_id: str
    qualifications: str
    experience_years: int
    languages: List[str]
    photo_url: Optional[str] = None
    consultation_fee: float
    is_fee_confirmed: bool = True
    about: Optional[str] = None
    available_days: List[int]
    active: bool = True
    preparation_notes: Optional[str] = None
    rating: Optional[float] = 4.8
    review_count: Optional[int] = 50

class ServiceBase(BaseModel):
    id: str
    name: str
    speciality_id: str
    description: Optional[str] = None
    duration_minutes: int = 30
    price: float
    is_price_confirmed: bool = True
    category: str
    is_active: bool = True
    preparation_instructions: Optional[str] = None

class AppointmentCreate(BaseModel):
    patient_name: str = Field(..., min_length=2)
    patient_phone: str = Field(..., min_length=10)
    patient_email: EmailStr
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = "male"
    visit_type: Optional[str] = "first-visit"
    reason_for_visit: Optional[str] = None
    doctor_id: str
    service_id: str
    appointment_date: str # YYYY-MM-DD
    appointment_time: str # HH:MM
    payment_mode: Optional[str] = "pay-at-clinic"

class AppointmentReschedule(BaseModel):
    new_date: str
    new_time: str
    reason: Optional[str] = "Patient requested reschedule"

class AppointmentCancel(BaseModel):
    reason: str

class AppointmentStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class TimeSlotSchema(BaseModel):
    time: str
    available: bool
    reason: Optional[str] = None

class AvailabilityResponse(BaseModel):
    is_available: bool
    reason: Optional[str] = None
    slots: List[TimeSlotSchema]
