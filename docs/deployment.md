# Production Deployment Guide - Apollo Clinic Platform

## 1. Architecture Overview

- **Frontend & Fullstack Engine**: Vercel / Cloud Run / Node.js Dev Container
- **Backend API**: Python FastAPI on Render, Railway, or Google Cloud Run
- **Database & Auth**: Supabase PostgreSQL with Row Level Security (RLS)
- **Maps Grounding**: Google Maps Listing for Basaveshwar Nagar branch

---

## 2. Vercel Deployment (Frontend)

1. Connect your GitHub repository to Vercel.
2. Build Settings:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Environment Variables:
   - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com/api/v1`
4. Deploy!

---

## 3. Render / Railway Deployment (FastAPI Backend)

1. Create a new Web Service pointing to `backend/`.
2. Runtime: **Python 3.12**
3. Build Command: `pip install -r requirements.txt`
4. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Environment Variables:
   - `DATABASE_URL`: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`
   - `SECRET_KEY`: `[YOUR_RANDOM_32_CHAR_SECRET]`
   - `BACKEND_CORS_ORIGINS`: `["https://your-vercel-domain.vercel.app"]`

---

## 4. Production Concurrency Lock Verification

The database includes a critical partial unique index in `supabase/migrations/001_initial_schema.sql`:

```sql
CREATE UNIQUE INDEX uq_active_doctor_slot
ON public.appointments (doctor_id, appointment_date, appointment_time)
WHERE status NOT IN ('cancelled', 'rejected');
```

This enforces at the database level that no two concurrent requests can reserve the same doctor slot, even under high traffic bursts.
