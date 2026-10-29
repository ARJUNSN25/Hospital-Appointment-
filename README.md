# Apollo Clinic Basaveshwar Nagar - Premium Appointment Booking Platform

Production-grade, responsive healthcare appointment management platform custom built for **Apollo Clinic, Basaveshwar Nagar, Bengaluru**.

---

## 1. Verified Branch Details

- **Branch Name**: Apollo Clinic, Basaveshwar Nagar, Bengaluru
- **Branch Address**: No. 881/A, Yashodhaara Building, Dr. M.C. Modi Hospital Road, Bimajyothi LIC Colony / Model LIC Colony, Basaveshwar Nagar (West of Chord Road), Bengaluru, Karnataka – 560079
- **Google Maps Coordinates**: `12.9984645, 77.5422482`
- **Official Google Maps Listing**: [https://maps.app.goo.gl/HcpzfH1EoQcpGXR97](https://maps.app.goo.gl/HcpzfH1EoQcpGXR97)
- **Central Helpline**: `1860-500-7788`
- **Emergency Triage**: `1066`
- **Direct Branch Phone**: `+91 80 2315 7788` (Configurable via admin dashboard)
- **Operating Hours**:
  - Monday – Saturday: 08:00 AM – 08:00 PM
  - Sunday: 08:00 AM – 01:00 PM (OPD & Diagnostics)

---

## 2. Key Features

- **Real Appointment Availability Engine**:
  - Calculates real-time time slots based on doctor consulting schedules, break hours, doctor leave, and clinic holidays.
  - Excludes past slots.
  - Concurrency locking prevents double-booking the same slot.
- **7-Step Patient Booking Wizard**:
  - Step 1: Select Service or Specialty
  - Step 2: Choose Verified Doctor (or automatic clinic matching)
  - Step 3: Pick Date
  - Step 4: Pick Live Available Slot
  - Step 5: Patient Contact Details
  - Step 6: Review Summary
  - Step 7: Terms Acceptance & Real Backend Confirmation
- **Instant Booking Confirmation**:
  - Unique booking reference (e.g. `APO-BAS-6024`)
  - Add to Google Calendar / iCal
  - Get Driving Directions via Google Maps link
  - Reschedule & Cancel actions
- **Patient Appointment Portal**:
  - Lookup by mobile number or booking reference
  - Self-service reschedule & cancellation within policy window (4 hours prior)
- **Protected Administrator Dashboard**:
  - Real-time KPI cards (Total, Today's, Pending, Confirmed, Cancelled, Revenue)
  - Appointment table with live status updates (Confirm, Complete, Cancel)
  - Doctor management (fees, schedule active toggle)
  - Branch settings editor (contact numbers, operating hours)
  - Export CSV reports
  - Audit logs tracking administrative actions

---

## 3. Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, React Router, TanStack Query, Lucide icons.
- **Backend**: Express + Node.js (mounted in container on port 3000) & Python FastAPI (in `backend/`).
- **Database**: PostgreSQL with Row Level Security (RLS) schemas in `supabase/migrations/001_initial_schema.sql`.

---

## 4. Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Start development server (serves frontend + live /api/v1/* routes)
npm run dev
```

Visit the running application at `http://localhost:3000`.
