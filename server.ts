import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dbStore } from './src/server/db';
import { pingSupabase, syncAppointmentToSupabase, SUPABASE_PROJECT_ID, SUPABASE_URL, SUPABASE_REST_URL } from './src/server/supabaseServer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Router: /api/v1
  const apiRouter = express.Router();

  // 1. Clinic Info
  apiRouter.get('/clinic', (req, res) => {
    res.json({
      success: true,
      data: dbStore.getClinicConfig()
    });
  });

  // 2. Services
  apiRouter.get('/services', (req, res) => {
    const { category, specialityId, search } = req.query;
    let services = dbStore.getServices(true);

    if (category && typeof category === 'string') {
      services = services.filter(s => s.category === category);
    }
    if (specialityId && typeof specialityId === 'string') {
      services = services.filter(s => s.specialityId === specialityId);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      services = services.filter(s => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q));
    }

    res.json({
      success: true,
      data: services
    });
  });

  // 3. Doctors
  apiRouter.get('/doctors', (req, res) => {
    const { specialityId, search } = req.query;
    let doctors = dbStore.getDoctors(true);

    if (specialityId && typeof specialityId === 'string') {
      doctors = doctors.filter(d => d.specialityId === specialityId);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      doctors = doctors.filter(d => d.name.toLowerCase().includes(q) || d.specialityName.toLowerCase().includes(q));
    }

    res.json({
      success: true,
      data: doctors
    });
  });

  apiRouter.get('/doctors/:id', (req, res) => {
    const doctor = dbStore.getDoctorById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    res.json({ success: true, data: doctor });
  });

  // 4. Availability Engine endpoint
  apiRouter.get('/availability', (req, res) => {
    const { doctorId, date, duration } = req.query;
    if (!doctorId || !date) {
      return res.status(400).json({ success: false, error: 'Missing required query params: doctorId and date (YYYY-MM-DD)' });
    }

    const durationNum = duration ? parseInt(duration as string, 10) : 30;
    const availability = dbStore.getDoctorAvailability(doctorId as string, date as string, durationNum);

    res.json({
      success: true,
      data: availability
    });
  });

  // 5. Appointments: Create, View, Reschedule, Cancel
  apiRouter.post('/appointments', async (req, res) => {
    try {
      const {
        patientName,
        patientPhone,
        patientEmail,
        patientAge,
        patientGender,
        visitType,
        reasonForVisit,
        doctorId,
        serviceId,
        appointmentDate,
        appointmentTime,
        paymentMode,
        paymentStatus,
        paymentId,
        razorpayOrderId,
        paymentMethod
      } = req.body;

      if (!patientName || !patientPhone || !patientEmail || !doctorId || !serviceId || !appointmentDate || !appointmentTime) {
        return res.status(400).json({
          success: false,
          error: 'Please fill in all mandatory booking fields (patient name, phone, email, doctor, service, date, time)'
        });
      }

      // Basic phone format validation (Indian/international)
      const phoneDigits = patientPhone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit mobile number' });
      }

      const result = await dbStore.createAppointment({
        patientName,
        patientPhone,
        patientEmail,
        patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
        patientGender,
        visitType: visitType || 'first-visit',
        reasonForVisit,
        doctorId,
        serviceId,
        appointmentDate,
        appointmentTime,
        paymentMode,
        paymentStatus,
        paymentId,
        razorpayOrderId,
        paymentMethod
      });

      if (!result.success) {
        return res.status(409).json({ success: false, error: result.error });
      }

      // Background synchronization with Supabase if configured
      if (result.appointment) {
        syncAppointmentToSupabase(result.appointment).catch(() => {});
      }

      res.status(201).json({
        success: true,
        data: result.appointment,
        notification: {
          emailSent: true,
          recipient: patientEmail,
          whatsappQueued: true,
          phone: patientPhone
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Internal server error while processing booking' });
    }
  });

  apiRouter.get('/appointments/:refOrId', (req, res) => {
    const apt = dbStore.getAppointmentByRefOrId(req.params.refOrId);
    if (!apt) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    res.json({ success: true, data: apt });
  });

  apiRouter.patch('/appointments/:id/reschedule', async (req, res) => {
    const { newDate, newTime, reason } = req.body;
    if (!newDate || !newTime) {
      return res.status(400).json({ success: false, error: 'New date and new time are required for rescheduling' });
    }

    const result = await dbStore.rescheduleAppointment(req.params.id, newDate, newTime, reason);
    if (!result.success) {
      return res.status(409).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: result.appointment });
  });

  apiRouter.post('/appointments/:id/cancel', async (req, res) => {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({ success: false, error: 'Cancellation reason is required' });
    }

    const result = await dbStore.cancelAppointment(req.params.id, reason, 'patient');
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: result.appointment });
  });

  // Razorpay Payments API
  apiRouter.post('/payments/razorpay/create-order', (req, res) => {
    try {
      const { amount, receipt } = req.body;
      if (!amount || amount <= 0) {
        return res.status(400).json({ success: false, error: 'Valid payment amount is required' });
      }

      const order = dbStore.createRazorpayOrder(Number(amount), 'INR', receipt);
      res.json({
        success: true,
        data: order
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Failed to create Razorpay order' });
    }
  });

  apiRouter.post('/payments/razorpay/verify', (req, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;
      if (!razorpay_order_id || !razorpay_payment_id) {
        return res.status(400).json({ success: false, error: 'Order ID and Payment ID are required' });
      }

      const result = dbStore.verifyRazorpayPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        appointmentId
      });

      res.json({
        success: true,
        data: result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Payment verification failed' });
    }
  });

  // 6. Patient / Current User
  apiRouter.get('/me', (req, res) => {
    // Current simulated user or guest
    res.json({
      success: true,
      data: {
        id: 'patient-session-1',
        role: 'patient',
        email: 'patient@example.com'
      }
    });
  });

  apiRouter.get('/me/appointments', (req, res) => {
    const { phone } = req.query;
    const appointments = dbStore.getAppointments({ phone: phone as string });
    res.json({ success: true, data: appointments });
  });

  // 7. Admin Endpoints
  apiRouter.get('/admin/dashboard', (req, res) => {
    const stats = dbStore.getAdminStats();
    res.json({ success: true, data: stats });
  });

  apiRouter.get('/admin/appointments', (req, res) => {
    const { status, doctorId, date, search } = req.query;
    const appointments = dbStore.getAppointments({
      status: status as string,
      doctorId: doctorId as string,
      date: date as string,
      search: search as string
    });
    res.json({ success: true, data: appointments });
  });

  // Admin Authentication Endpoint (Username: Arjun, Password: 140017)
  apiRouter.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password are required' });
    }

    if (username.trim().toLowerCase() === 'arjun' && password.trim() === '140017') {
      dbStore.addAuditLog('ADMIN_LOGIN', 'AUTH', 'user_arjun', 'Arjun', 'Administrator logged in successfully');
      return res.json({
        success: true,
        data: {
          token: `apollo_admin_${Date.now()}_arjun`,
          user: {
            username: 'Arjun',
            role: 'admin',
            fullName: 'Arjun (Clinic Administrator)',
            branch: 'Basaveshwar Nagar, Bengaluru'
          }
        }
      });
    }

    dbStore.addAuditLog('FAILED_LOGIN_ATTEMPT', 'AUTH', 'user_unknown', username, 'Failed login attempt with incorrect credentials');
    return res.status(401).json({
      success: false,
      error: 'Invalid administrator credentials. Please check your username and password.'
    });
  });

  // Quick Walk-In Booking directly from Admin Dashboard
  apiRouter.post('/admin/walkin', async (req, res) => {
    try {
      const { patientName, patientPhone, doctorId, serviceId, paymentMode, appointmentDate, appointmentTime } = req.body;
      const today = new Date().toISOString().split('T')[0];
      const chosenDoctorId = doctorId || 'doc-rajesh';
      let targetDate = appointmentDate || today;
      let slotTime = appointmentTime;

      if (!slotTime) {
        // Query available slots for the doctor today
        const avail = dbStore.getDoctorAvailability(chosenDoctorId, targetDate, 30);
        const openSlot = avail.slots?.find(s => s.available);
        if (openSlot) {
          slotTime = openSlot.time;
        } else {
          // If no remaining slots today, check tomorrow
          const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
          const availTom = dbStore.getDoctorAvailability(chosenDoctorId, tomorrow, 30);
          const tomSlot = availTom.slots?.find(s => s.available);
          targetDate = tomorrow;
          slotTime = tomSlot ? tomSlot.time : '10:30';
        }
      }

      const result = await dbStore.createAppointment({
        patientName: patientName || 'Walk-in Patient',
        patientPhone: patientPhone || '9800000000',
        patientEmail: 'walkin@apolloclinic.local',
        visitType: 'first-visit',
        doctorId: chosenDoctorId,
        serviceId: serviceId || 'srv-gen-consult',
        appointmentDate: targetDate,
        appointmentTime: slotTime,
        paymentMode: paymentMode || 'cash-at-clinic',
        paymentStatus: paymentMode === 'cash-at-clinic' ? 'pending' : 'paid',
        isWalkin: true
      });

      if (!result.success) {
        return res.status(409).json({ success: false, error: result.error });
      }

      dbStore.addAuditLog('WALKIN_REGISTERED', 'APPOINTMENT', result.appointment!.id, 'Arjun', `Registered walk-in patient ${patientName} with ${result.appointment!.doctorName} on ${targetDate} at ${slotTime}`);
      
      // Background sync with Supabase
      if (result.appointment) {
        syncAppointmentToSupabase(result.appointment).catch(() => {});
      }

      res.status(201).json({ success: true, data: result.appointment });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.patch('/admin/appointments/:id/status', (req, res) => {
    const { status, adminNotes } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const result = dbStore.updateAppointmentStatus(req.params.id, status, adminNotes);
    if (!result.success) {
      return res.status(404).json({ success: false, error: result.error });
    }

    res.json({ success: true, data: result.appointment });
  });

  apiRouter.post('/admin/doctors', (req, res) => {
    const newDoc = dbStore.addDoctor(req.body);
    res.status(201).json({ success: true, data: newDoc });
  });

  apiRouter.patch('/admin/doctors/:id', (req, res) => {
    const updated = dbStore.updateDoctor(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Doctor not found' });
    }
    res.json({ success: true, data: updated });
  });

  apiRouter.patch('/admin/services/:id', (req, res) => {
    const updated = dbStore.updateService(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Service not found' });
    }
    res.json({ success: true, data: updated });
  });

  apiRouter.post('/admin/services', (req, res) => {
    const newService = dbStore.addService(req.body);
    res.status(201).json({ success: true, data: newService });
  });

  apiRouter.patch('/admin/clinic-settings', (req, res) => {
    const updated = dbStore.updateClinicConfig(req.body);
    res.json({ success: true, data: updated });
  });

  apiRouter.get('/broadcast', (req, res) => {
    res.json({ success: true, data: dbStore.getBroadcast() });
  });

  apiRouter.post('/admin/broadcast', (req, res) => {
    const { message, type, active } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Broadcast message is required' });
    }
    const updated = dbStore.updateBroadcast({ message, type, active }, 'Arjun');
    res.json({ success: true, data: updated });
  });

  apiRouter.get('/admin/audit-logs', (req, res) => {
    res.json({ success: true, data: dbStore.getAuditLogs() });
  });

  // CSV Export for administrative reporting
  apiRouter.get('/admin/export-csv', (req, res) => {
    const appointments = dbStore.getAppointments();
    const headers = [
      'Booking Reference',
      'Patient Name',
      'Phone',
      'Email',
      'Doctor Name',
      'Speciality',
      'Service',
      'Appointment Date',
      'Time',
      'Duration (Mins)',
      'Status',
      'Fee (INR)',
      'Payment Status',
      'Created At'
    ];

    const rows = appointments.map(a => [
      `"${a.bookingReference}"`,
      `"${a.patientName.replace(/"/g, '""')}"`,
      `"${a.patientPhone}"`,
      `"${a.patientEmail}"`,
      `"${a.doctorName.replace(/"/g, '""')}"`,
      `"${a.doctorSpeciality.replace(/"/g, '""')}"`,
      `"${a.serviceName.replace(/"/g, '""')}"`,
      `"${a.appointmentDate}"`,
      `"${a.appointmentTime}"`,
      a.durationMinutes,
      `"${a.status}"`,
      a.fee,
      `"${a.paymentStatus}"`,
      `"${a.createdAt}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="apollo_clinic_appointments_report.csv"');
    res.send(csvContent);
  });

  // Supabase PostgreSQL & REST Integration Endpoints
  apiRouter.get('/supabase/status', async (req, res) => {
    try {
      const ping = await pingSupabase();
      res.json({
        success: true,
        data: {
          ...ping,
          projectId: SUPABASE_PROJECT_ID,
          url: SUPABASE_URL,
          restApi: SUPABASE_REST_URL
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  apiRouter.post('/supabase/sync-all', async (req, res) => {
    try {
      const appointments = dbStore.getAppointments();
      let syncedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      for (const apt of appointments) {
        const syncResult = await syncAppointmentToSupabase(apt);
        if (syncResult.success) {
          syncedCount++;
        } else {
          skippedCount++;
          if (syncResult.error && !errors.includes(syncResult.error)) {
            errors.push(syncResult.error);
          }
        }
      }

      dbStore.addAuditLog(
        'SUPABASE_SYNC',
        'DATABASE',
        `kwzqkpeeaqxlpymrohkt:appointments`,
        'Arjun',
        `Synced ${syncedCount}/${appointments.length} appointments to Supabase REST API`
      );

      res.json({
        success: true,
        data: {
          syncedCount,
          skippedCount,
          total: appointments.length,
          projectId: SUPABASE_PROJECT_ID,
          restApi: SUPABASE_REST_URL,
          errors
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Mount API router
  app.use('/api/v1', apiRouter);

  // Mount Vite middlewares in development or static dist in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Apollo Clinic Platform] Live server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
