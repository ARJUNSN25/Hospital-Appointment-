# Apollo Clinic Appointment Platform - Local Setup Guide

Branch: **Apollo Clinic, Basaveshwar Nagar, Bengaluru**  
Verified Address: **No. 881/A, Yashodhaara Building, Dr. M.C. Modi Hospital Road, Bengaluru - 560079**  
Google Maps Listing: [https://maps.app.goo.gl/HcpzfH1EoQcpGXR97](https://maps.app.goo.gl/HcpzfH1EoQcpGXR97)

---

## 1. Prerequisites

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Python**: 3.10+ (for running the Python FastAPI standalone backend)
- **Git**

---

## 2. Windows PowerShell Setup

Open Windows PowerShell in the project directory:

```powershell
# 1. Install Node.js frontend dependencies
npm install

# 2. Start the fullstack dev server (runs on port 3000 with live backend routes)
npm run dev

# 3. In a new PowerShell window, run logic unit tests
npm test
```

---

## 3. Python FastAPI Backend Setup (Optional Standalone)

To run the Python FastAPI backend with PostgreSQL / Supabase:

```powershell
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Run FastAPI dev server
uvicorn app.main:app --reload --port 8000
```

The FastAPI interactive OpenAPI documentation will be accessible at:  
`http://localhost:8000/api/v1/docs`

---

## 4. Supabase Database Migration

1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the **SQL Editor** in the Supabase Dashboard.
3. Paste and execute the migration script located at:
   `supabase/migrations/001_initial_schema.sql`
4. This creates all normalized tables, unique concurrency partial indexes, and seeds verified Basaveshwar Nagar clinic profiles.

---

## 5. Running Automated Unit Tests

```bash
# Run scheduling engine unit tests
npx --yes tsx --test tests/scheduling.test.ts
```
