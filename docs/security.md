# Apollo Clinic Platform - Security Architecture

## 1. Principles

1. **Anti-Double-Booking Protection**:
   - Application-layer mutex locks in the scheduling engine.
   - Database partial unique index `uq_active_doctor_slot` on `(doctor_id, appointment_date, appointment_time)` where `status NOT IN ('cancelled', 'rejected')`.

2. **Role-Based Access Control (RBAC)**:
   - `patient`: Can create appointments, view their own bookings, request rescheduling/cancellation within policy limits.
   - `staff` / `admin`: Access to administration dashboard, doctor schedule overrides, status modifications, CSV export, and audit logs.

3. **Data Minimization & Patient Confidentiality**:
   - No unnecessary medical history or sensitive clinical diagnoses stored in the appointment platform.
   - Patient reason for visit is stored confidentially and viewable only by attending medical staff.
   - Administrative changes are logged in `admin_audit_logs`.

4. **Zero Client Secret Exposure**:
   - Supabase service role keys and database admin passwords are never exposed to the frontend.
