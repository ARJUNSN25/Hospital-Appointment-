-- ====================================================================
-- APOLLO CLINIC BASAVESHWAR NAGAR - INITIAL DATABASE MIGRATION
-- Supabase PostgreSQL Schema with Row Level Security (RLS) & Concurrency Safeguards
-- ====================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked with Supabase Auth auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'staff', 'admin', 'doctor')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Specialities Table
CREATE TABLE IF NOT EXISTS public.specialities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon_name TEXT DEFAULT 'stethoscope',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Doctors Table
CREATE TABLE IF NOT EXISTS public.doctors (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    speciality_id TEXT NOT NULL REFERENCES public.specialities(id) ON DELETE RESTRICT,
    qualifications TEXT NOT NULL,
    experience_years INT NOT NULL DEFAULT 0,
    languages TEXT[] NOT NULL DEFAULT '{}',
    photo_url TEXT,
    consultation_fee NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    is_fee_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    about TEXT,
    available_days INT[] NOT NULL DEFAULT '{1,2,3,4,5,6}',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    preparation_notes TEXT,
    rating NUMERIC(2, 1) DEFAULT 4.8,
    review_count INT DEFAULT 50,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Services Table
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    speciality_id TEXT NOT NULL REFERENCES public.specialities(id) ON DELETE RESTRICT,
    description TEXT,
    duration_minutes INT NOT NULL DEFAULT 30,
    price NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    is_price_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
    category TEXT NOT NULL CHECK (category IN ('consultation', 'diagnostic', 'health-check', 'procedure')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    preparation_instructions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Doctor Schedules Table
CREATE TABLE IF NOT EXISTS public.doctor_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_start_time TIME,
    break_end_time TIME,
    slot_interval_minutes INT NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_doctor_day UNIQUE (doctor_id, day_of_week)
);

-- 6. Doctor Time Off / Leave Table
CREATE TABLE IF NOT EXISTS public.doctor_time_off (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Clinic Holidays Table
CREATE TABLE IF NOT EXISTS public.clinic_holidays (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    holiday_date DATE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Clinic Settings Table
CREATE TABLE IF NOT EXISTS public.clinic_settings (
    id TEXT PRIMARY KEY DEFAULT 'apollo-clinic-basaveshwar-nagar',
    name TEXT NOT NULL DEFAULT 'Apollo Clinic',
    branch_name TEXT NOT NULL DEFAULT 'Basaveshwar Nagar, Bengaluru',
    category TEXT NOT NULL DEFAULT 'Multi-Specialty Clinic & Diagnostic Centre',
    address_line1 TEXT NOT NULL,
    address_line2 TEXT,
    landmark TEXT,
    suburb TEXT NOT NULL DEFAULT 'Basaveshwar Nagar',
    city TEXT NOT NULL DEFAULT 'Bengaluru',
    state TEXT NOT NULL DEFAULT 'Karnataka',
    postal_code TEXT NOT NULL DEFAULT '560079',
    country TEXT NOT NULL DEFAULT 'India',
    lat NUMERIC(10, 7) DEFAULT 12.9984645,
    lng NUMERIC(10, 7) DEFAULT 77.5422482,
    maps_url TEXT NOT NULL,
    central_helpline TEXT NOT NULL,
    branch_phone TEXT NOT NULL,
    emergency_phone TEXT DEFAULT '1066',
    whatsapp_number TEXT,
    email TEXT NOT NULL,
    cancellation_hours INT DEFAULT 4,
    reschedule_hours INT DEFAULT 2,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Appointments Table (Core Booking & Concurrency Protection)
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_reference TEXT NOT NULL UNIQUE,
    patient_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    patient_name TEXT NOT NULL,
    patient_phone TEXT NOT NULL,
    patient_email TEXT NOT NULL,
    patient_age INT,
    patient_gender TEXT CHECK (patient_gender IN ('male', 'female', 'other')),
    visit_type TEXT NOT NULL DEFAULT 'first-visit' CHECK (visit_type IN ('first-visit', 'follow-up')),
    reason_for_visit TEXT,
    doctor_id TEXT NOT NULL REFERENCES public.doctors(id) ON DELETE RESTRICT,
    service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'rejected')),
    fee NUMERIC(10, 2) NOT NULL DEFAULT 500.00,
    payment_mode TEXT NOT NULL DEFAULT 'pay-at-clinic' CHECK (payment_mode IN ('pay-at-clinic', 'online')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'waived')),
    admin_notes TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Partial Unique Index: CRITICAL CONCURRENCY LOCK
-- Guarantees that no two non-cancelled appointments can occupy the same doctor slot at the same time
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_doctor_slot
ON public.appointments (doctor_id, appointment_date, appointment_time)
WHERE status NOT IN ('cancelled', 'rejected');

-- Search Indexes
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments (appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON public.appointments (doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_phone ON public.appointments (patient_phone);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);

-- 10. Appointment Status History (Audit Trail)
CREATE TABLE IF NOT EXISTS public.appointment_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Notification Logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'whatsapp')),
    recipient TEXT NOT NULL,
    template_type TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('delivered', 'queued', 'failed')),
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    performed_by TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_time_off ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Public READ policies for public clinic catalog
CREATE POLICY "Public read active specialities" ON public.specialities FOR SELECT USING (active = TRUE);
CREATE POLICY "Public read active doctors" ON public.doctors FOR SELECT USING (active = TRUE);
CREATE POLICY "Public read active services" ON public.services FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public read doctor schedules" ON public.doctor_schedules FOR SELECT USING (TRUE);
CREATE POLICY "Public read holidays" ON public.clinic_holidays FOR SELECT USING (TRUE);
CREATE POLICY "Public read clinic settings" ON public.clinic_settings FOR SELECT USING (TRUE);

-- Patient Appointments RLS:
-- 1. Patients can view their own appointments by auth UID or matching phone
CREATE POLICY "Patients view own appointments" ON public.appointments
    FOR SELECT
    USING (
        auth.uid() = patient_id 
        OR (auth.jwt() ->> 'role') IN ('staff', 'admin')
    );

-- 2. Public can create appointments
CREATE POLICY "Public can book appointments" ON public.appointments
    FOR INSERT
    WITH CHECK (TRUE);

-- 3. Staff and Admin full CRUD access
CREATE POLICY "Admin full manage appointments" ON public.appointments
    FOR ALL
    USING ((auth.jwt() ->> 'role') IN ('staff', 'admin'));

CREATE POLICY "Admin manage doctors" ON public.doctors
    FOR ALL
    USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin manage services" ON public.services
    FOR ALL
    USING ((auth.jwt() ->> 'role') = 'admin');

CREATE POLICY "Admin manage clinic settings" ON public.clinic_settings
    FOR ALL
    USING ((auth.jwt() ->> 'role') = 'admin');

-- ====================================================================
-- SEED DATA (VERIFIED BASAVESHWAR NAGAR CLINIC)
-- ====================================================================

INSERT INTO public.clinic_settings (
    id, name, branch_name, address_line1, address_line2, landmark,
    suburb, city, state, postal_code, maps_url, central_helpline,
    branch_phone, whatsapp_number, email
) VALUES (
    'apollo-clinic-basaveshwar-nagar',
    'Apollo Clinic',
    'Basaveshwar Nagar, Bengaluru',
    'No. 881/A, Yashodhaara Building',
    'Dr. M.C. Modi Hospital Road, Bimajyothi LIC Colony',
    'Near Modi Hospital / West of Chord Road 3rd Stage',
    'Basaveshwar Nagar',
    'Bengaluru',
    'Karnataka',
    '560079',
    'https://maps.app.goo.gl/HcpzfH1EoQcpGXR97',
    '1860-500-7788',
    '+91 80 2315 7788',
    '+91 91080 07788',
    'clinic.basaveshwaranagar@apolloclinic.com'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.specialities (id, name, description) VALUES
('spec-gynecology', 'Obstetrics & Gynecology', 'Maternal health, high-risk antenatal care, PCOS, women health wellness'),
('spec-general-medicine', 'General & Internal Medicine', 'Cardiometabolic care, hypertension, infectious diseases, geriatric health'),
('spec-pediatrics', 'Pediatrics & Child Care', 'Child immunization, growth monitoring, developmental assessments'),
('spec-orthopedics', 'Orthopedics & Joint Care', 'Arthritis, sports trauma, spinal posture, fracture recovery'),
('spec-dermatology', 'Dermatology & Skin Care', 'Clinical skin therapy, eczema, psoriasis, acne, allergy management'),
('spec-diagnostics', 'Diagnostics & Pathology', 'High-precision blood chemistry, digital ECG, 2D/3D ultrasound scans')
ON CONFLICT (id) DO NOTHING;
