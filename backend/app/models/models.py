import uuid
from datetime import datetime, date, time
from sqlalchemy import (
    Column, String, Text, Integer, Float, Boolean, 
    DateTime, Date, Time, ForeignKey, ARRAY, Numeric, UniqueConstraint, Index
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    role = Column(String(50), nullable=False, default="patient") # patient, staff, admin, doctor
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

class Speciality(Base):
    __tablename__ = "specialities"
    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    icon_name = Column(String(100), default="stethoscope")
    active = Column(Boolean, default=True, nullable=False)

class Doctor(Base):
    __tablename__ = "doctors"
    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    speciality_id = Column(String(100), ForeignKey("specialities.id"), nullable=False)
    qualifications = Column(String(255), nullable=False)
    experience_years = Column(Integer, default=0, nullable=False)
    languages = Column(ARRAY(String), default=list)
    photo_url = Column(Text, nullable=True)
    consultation_fee = Column(Numeric(10, 2), default=500.00, nullable=False)
    is_fee_confirmed = Column(Boolean, default=True, nullable=False)
    about = Column(Text, nullable=True)
    available_days = Column(ARRAY(Integer), default=[1, 2, 3, 4, 5, 6])
    active = Column(Boolean, default=True, nullable=False)
    preparation_notes = Column(Text, nullable=True)
    rating = Column(Float, default=4.8)
    review_count = Column(Integer, default=50)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    speciality = relationship("Speciality")

class Service(Base):
    __tablename__ = "services"
    id = Column(String(100), primary_key=True)
    name = Column(String(255), nullable=False)
    speciality_id = Column(String(100), ForeignKey("specialities.id"), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, default=30, nullable=False)
    price = Column(Numeric(10, 2), default=500.00, nullable=False)
    is_price_confirmed = Column(Boolean, default=True, nullable=False)
    category = Column(String(50), nullable=False) # consultation, diagnostic, health-check, procedure
    is_active = Column(Boolean, default=True, nullable=False)
    preparation_instructions = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    speciality = relationship("Speciality")

class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    booking_reference = Column(String(50), unique=True, nullable=False, index=True)
    patient_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    patient_name = Column(String(255), nullable=False)
    patient_phone = Column(String(50), nullable=False, index=True)
    patient_email = Column(String(255), nullable=False)
    patient_age = Column(Integer, nullable=True)
    patient_gender = Column(String(20), nullable=True)
    visit_type = Column(String(50), default="first-visit")
    reason_for_visit = Column(Text, nullable=True)
    doctor_id = Column(String(100), ForeignKey("doctors.id"), nullable=False, index=True)
    service_id = Column(String(100), ForeignKey("services.id"), nullable=False)
    appointment_date = Column(Date, nullable=False, index=True)
    appointment_time = Column(Time, nullable=False)
    duration_minutes = Column(Integer, default=30, nullable=False)
    status = Column(String(50), default="confirmed", nullable=False, index=True) # pending, confirmed, rescheduled, cancelled, completed, rejected
    fee = Column(Numeric(10, 2), nullable=False)
    payment_mode = Column(String(50), default="pay-at-clinic")
    payment_status = Column(String(50), default="pending")
    admin_notes = Column(Text, nullable=True)
    cancellation_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    doctor = relationship("Doctor")
    service = relationship("Service")

    # Composite Unique Index to prevent overlapping bookings for same doctor, date & time
    __table_args__ = (
        Index("uq_active_slot_idx", "doctor_id", "appointment_date", "appointment_time"),
    )

class AppointmentStatusHistory(Base):
    __tablename__ = "appointment_status_history"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    appointment_id = Column(UUID(as_uuid=True), ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    previous_status = Column(String(50), nullable=True)
    new_status = Column(String(50), nullable=False)
    changed_by = Column(String(100), nullable=False)
    reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class ClinicSetting(Base):
    __tablename__ = "clinic_settings"
    id = Column(String(100), primary_key=True, default="apollo-clinic-basaveshwar-nagar")
    branch_name = Column(String(255), nullable=False)
    address_line1 = Column(String(255), nullable=False)
    address_line2 = Column(String(255), nullable=True)
    landmark = Column(String(255), nullable=True)
    suburb = Column(String(100), default="Basaveshwar Nagar")
    city = Column(String(100), default="Bengaluru")
    state = Column(String(100), default="Karnataka")
    postal_code = Column(String(20), default="560079")
    maps_url = Column(Text, nullable=False)
    central_helpline = Column(String(50), nullable=False)
    branch_phone = Column(String(50), nullable=False)
    whatsapp_number = Column(String(50), nullable=True)
    email = Column(String(255), nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
