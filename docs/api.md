# Apollo Clinic REST API Specification

Base URL: `/api/v1`

## Endpoints

### 1. `GET /api/v1/clinic`
Returns verified branch metadata, coordinates, address, and helplines.

### 2. `GET /api/v1/doctors`
Returns list of verified medical consultants.
- Query parameters:
  - `specialityId` (optional)
  - `search` (optional)

### 3. `GET /api/v1/services`
Returns clinical consultations, diagnostics, and health packages.
- Query parameters:
  - `category`: `consultation` | `diagnostic` | `health-check`
  - `search` (optional)

### 4. `GET /api/v1/availability`
Calculates live doctor slot availability.
- Query parameters:
  - `doctorId`: string (required)
  - `date`: `YYYY-MM-DD` (required)
  - `duration`: integer (default 30)

### 5. `POST /api/v1/appointments`
Creates appointment with atomic slot reservation.
- Request body:
```json
{
  "patientName": "Sunil Kumar",
  "patientPhone": "9845012345",
  "patientEmail": "sunil@example.com",
  "doctorId": "doc-swagatha",
  "serviceId": "srv-gyn-consult",
  "appointmentDate": "2026-11-05",
  "appointmentTime": "10:00"
}
```
- Status codes:
  - `201 Created`: Appointment saved with unique reference.
  - `409 Conflict`: Slot already taken by concurrent booking.
  - `400 Bad Request`: Validation failure.

### 6. `PATCH /api/v1/appointments/{id}/reschedule`
Reschedules to a new date and time slot.

### 7. `POST /api/v1/appointments/{id}/cancel`
Cancels booking with mandatory reason; frees slot for other patients.

### 8. `GET /api/v1/admin/dashboard`
Returns operational metrics and counts for the clinic administrator.

### 9. `GET /api/v1/admin/export-csv`
Streams CSV formatted report of appointment bookings.
