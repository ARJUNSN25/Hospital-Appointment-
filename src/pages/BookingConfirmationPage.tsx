import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  CheckCircle2, Calendar, Clock, MapPin, Phone, Mail, 
  ExternalLink, AlertCircle, Share2, Printer, RefreshCw, XCircle
} from 'lucide-react';
import { api } from '../api/client';
import { Button, StatusBadge, Modal } from '../components/common/UI';
import { VERIFIED_CLINIC_CONFIG } from '../config/clinicData';

export default function BookingConfirmationPage() {
  const { reference } = useParams<{ reference: string }>();
  const navigate = useNavigate();

  // Reschedule & Cancel Modal States
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: appointment, isLoading, error, refetch } = useQuery({
    queryKey: ['appointment', reference],
    queryFn: () => api.getAppointmentByRef(reference!),
    enabled: !!reference
  });

  const { data: rescheduleAvailability } = useQuery({
    queryKey: ['availability', appointment?.doctorId, newDate],
    queryFn: () => api.getAvailability(appointment!.doctorId, newDate),
    enabled: !!appointment?.doctorId && !!newDate && rescheduleModalOpen
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center bg-[#F8FAFC]">
        <div className="h-48 bg-[#FFFFFF] border border-[#E2E8F0] rounded-2xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 bg-[#F8FAFC]">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold text-[#0F172A]">Booking Reference Not Found</h2>
        <p className="text-sm text-[#64748B]">
          We could not find an appointment corresponding to reference "{reference}".
        </p>
        <Link to="/patient-portal">
          <Button variant="outline" size="sm">
            Lookup Appointments by Phone
          </Button>
        </Link>
      </div>
    );
  }

  const getGoogleCalendarUrl = () => {
    const startTimeStr = `${appointment.appointmentDate}T${appointment.appointmentTime.replace(':', '')}00`;
    const details = encodeURIComponent(
      `Appointment with ${appointment.doctorName} for ${appointment.serviceName} at LifeCare Hospital (Apollo Clinic Basaveshwar Nagar). Ref: ${appointment.bookingReference}. Address: ${VERIFIED_CLINIC_CONFIG.address.line1}, Bengaluru.`
    );
    const location = encodeURIComponent(`${VERIFIED_CLINIC_CONFIG.address.line1}, ${VERIFIED_CLINIC_CONFIG.address.suburb}, Bengaluru`);
    const title = encodeURIComponent(`LifeCare Consultation - ${appointment.doctorName}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${startTimeStr}/${startTimeStr}`;
  };

  const handleRescheduleSubmit = async () => {
    if (!newDate || !newTime) {
      setActionError('Please select both a new date and a time slot.');
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    try {
      await api.rescheduleAppointment(appointment.id, newDate, newTime, 'Patient requested reschedule');
      setRescheduleModalOpen(false);
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reschedule.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelReason.trim()) {
      setActionError('Please provide a short reason for cancellation.');
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    try {
      await api.cancelAppointment(appointment.id, cancelReason);
      setCancelModalOpen(false);
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel appointment.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8 bg-[#F8FAFC] text-[#0F172A]">
      {/* Success banner with Logo */}
      <div className="bg-[#FFFFFF] border border-blue-100 rounded-3xl p-6 sm:p-8 text-center space-y-3 shadow-sm">
        <img
          src="/assets/aistudio/Glossy_LifeCare_Healthcare_Logo__1__87cd2d7a.png"
          alt="LifeCare Hospital"
          className="h-16 mx-auto object-contain mb-2"
        />
        <div className="w-12 h-12 rounded-full bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto mb-1">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Appointment Confirmed!
        </h1>
        <p className="text-sm text-[#64748B] max-w-md mx-auto">
          Your appointment has been registered in the LifeCare Hospital OPD schedule database.
        </p>
        <div className="pt-2">
          <span className="inline-block px-4 py-2 rounded-xl bg-blue-50 border border-blue-200 font-mono text-base font-bold text-[#2563EB] shadow-xs">
            Booking Reference: {appointment.bookingReference}
          </span>
        </div>
      </div>

      {/* Appointment Summary Card */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
          <div>
            <span className="text-xs text-[#64748B] font-medium block">Appointment Status</span>
            <div className="mt-1">
              <StatusBadge status={appointment.status} />
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-[#64748B] font-medium block">Consultation Fee</span>
            <span className="text-xl font-extrabold text-[#0F172A]">₹{appointment.fee}</span>
            {appointment.paymentStatus === 'paid' ? (
              <span className="text-[11px] text-emerald-700 font-bold block flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                Paid Online ({appointment.paymentMode === 'phonepe' ? 'PhonePe' : appointment.paymentMode === 'paytm' ? 'Paytm' : appointment.paymentMode === 'card' ? 'Card' : 'Razorpay'})
              </span>
            ) : (
              <span className="text-[11px] text-[#2563EB] font-semibold block">
                Cash on Slot (Pay at Clinic Reception)
              </span>
            )}
            {appointment.paymentId && (
              <span className="text-[10px] text-[#64748B] block font-mono">
                Txn: {appointment.paymentId}
              </span>
            )}
          </div>
        </div>

        {/* Date, Time & Doctor */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-1">
            <span className="text-xs text-[#64748B] font-semibold uppercase tracking-wider block">
              Consultation Schedule
            </span>
            <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
              <Calendar className="w-4 h-4 text-[#2563EB]" />
              <span>{appointment.appointmentDate}</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-[#2563EB]">
              <Clock className="w-4 h-4 text-[#2563EB]" />
              <span>{appointment.appointmentTime} (30 mins)</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-[#64748B] font-semibold uppercase tracking-wider block">
              Attending Specialist
            </span>
            <p className="text-sm font-bold text-[#0F172A]">{appointment.doctorName}</p>
            <p className="text-xs font-semibold text-[#2563EB]">{appointment.doctorSpeciality}</p>
            <p className="text-xs text-[#64748B]">{appointment.serviceName}</p>
          </div>
        </div>

        {/* Patient Info */}
        <div className="pt-4 border-t border-[#E2E8F0] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-[#0F172A]">
          <div>
            <span className="text-[#64748B] block">Patient Name:</span>
            <span className="font-semibold text-[#0F172A] text-sm">{appointment.patientName}</span>
            <span className="block text-[#64748B]">{appointment.patientPhone}</span>
            <span className="block text-[#64748B]">{appointment.patientEmail}</span>
          </div>

          <div>
            <span className="text-[#64748B] block">Visit Details:</span>
            <span className="font-medium text-[#0F172A] capitalize block">
              {appointment.visitType.replace('-', ' ')}
            </span>
            {appointment.reasonForVisit && (
              <span className="text-[#64748B] block italic mt-1">"{appointment.reasonForVisit}"</span>
            )}
          </div>
        </div>

        {/* Clinic Location */}
        <div className="pt-4 border-t border-[#E2E8F0] flex items-start gap-3 text-xs text-[#0F172A]">
          <MapPin className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-[#0F172A] block text-sm">LifeCare Hospital - Basaveshwar Nagar</span>
            <p className="text-[#64748B]">{VERIFIED_CLINIC_CONFIG.address.line1}, {VERIFIED_CLINIC_CONFIG.address.line2}</p>
            <p className="text-[#64748B]">{VERIFIED_CLINIC_CONFIG.address.landmark}, Bengaluru - {VERIFIED_CLINIC_CONFIG.address.postalCode}</p>
          </div>
          <a
            href={VERIFIED_CLINIC_CONFIG.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-[#2563EB] font-semibold text-xs border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <span>Directions</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Quick Actions (Add to calendar, Print, Reschedule, Cancel) */}
        <div className="pt-6 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={getGoogleCalendarUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-semibold transition-colors border border-[#E2E8F0]"
            >
              <Calendar className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Add to Google Calendar</span>
            </a>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#F8FAFC] hover:bg-slate-100 text-[#0F172A] text-xs font-semibold transition-colors border border-[#E2E8F0]"
            >
              <Printer className="w-3.5 h-3.5 text-[#64748B]" />
              <span>Print Confirmation</span>
            </button>
          </div>

          {appointment.status !== 'cancelled' && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewDate(appointment.appointmentDate);
                  setRescheduleModalOpen(true);
                }}
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                Reschedule
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-rose-700 hover:bg-rose-50"
                onClick={() => setCancelModalOpen(true)}
              >
                <XCircle className="w-3.5 h-3.5 mr-1" />
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title="Reschedule Appointment"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#64748B]">
            Select a new date and an available slot for {appointment.doctorName}.
          </p>

          {actionError && (
            <div className="p-3 bg-amber-50 text-amber-900 text-xs rounded-lg border border-amber-200">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">New Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                setNewTime('');
              }}
              className="w-full py-2 px-3 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none bg-[#FFFFFF] text-[#0F172A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Select New Time Slot</label>
            {!rescheduleAvailability?.isAvailable ? (
              <p className="text-xs text-[#64748B]">
                {rescheduleAvailability?.reason || 'Please pick an active date to check available slots'}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                {rescheduleAvailability.slots.map((slot) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => setNewTime(slot.time)}
                    className={`p-2 rounded text-xs font-semibold border ${
                      newTime === slot.time
                        ? 'bg-[#2563EB] text-[#FFFFFF] border-[#2563EB]'
                        : slot.available
                        ? 'bg-[#FFFFFF] hover:bg-blue-50 text-[#0F172A] border-[#E2E8F0]'
                        : 'bg-[#F8FAFC] text-[#64748B]/50 border-[#E2E8F0] cursor-not-allowed line-through'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setRescheduleModalOpen(false)}>
              Back
            </Button>
            <Button size="sm" onClick={handleRescheduleSubmit} disabled={isProcessing || !newTime}>
              Confirm Reschedule
            </Button>
          </div>
        </div>
      </Modal>

      {/* Cancel Modal */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title="Cancel Appointment"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#64748B]">
            Are you sure you wish to cancel booking <strong>{appointment.bookingReference}</strong>? This slot will immediately be released to other patients.
          </p>

          {actionError && (
            <div className="p-3 bg-amber-50 text-amber-900 text-xs rounded-lg border border-amber-200">
              {actionError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Reason for cancellation *</label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Schedule conflict, feeling better, relocated..."
              className="w-full py-2 px-3 text-xs border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none bg-[#FFFFFF] text-[#0F172A]"
            ></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep Appointment
            </Button>
            <Button variant="danger" size="sm" onClick={handleCancelSubmit} disabled={isProcessing}>
              Confirm Cancellation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
