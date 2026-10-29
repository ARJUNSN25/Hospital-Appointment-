import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, Clock, MapPin, User, AlertCircle, RefreshCw, XCircle, ChevronRight } from 'lucide-react';
import { api } from '../api/client';
import { Button, StatusBadge, Modal } from '../components/common/UI';

export default function PatientPortalPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [submittedPhone, setSubmittedPhone] = useState('');
  const [bookingRefInput, setBookingRefInput] = useState('');

  // Reschedule & Cancel modals
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['patient-appointments', submittedPhone],
    queryFn: () => api.getPatientAppointments(submittedPhone),
    enabled: !!submittedPhone
  });

  const selectedAppointment = appointments.find(a => a.id === selectedAptId);

  const { data: availability } = useQuery({
    queryKey: ['availability', selectedAppointment?.doctorId, newDate],
    queryFn: () => api.getAvailability(selectedAppointment!.doctorId, newDate),
    enabled: !!selectedAppointment?.doctorId && !!newDate && rescheduleModalOpen
  });

  const handlePhoneSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNumber.trim()) {
      setSubmittedPhone(phoneNumber.trim());
    }
  };

  const handleReschedule = async () => {
    if (!selectedAptId || !newDate || !newTime) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await api.rescheduleAppointment(selectedAptId, newDate, newTime, 'Rescheduled via Patient Portal');
      setRescheduleModalOpen(false);
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Reschedule failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!selectedAptId || !cancelReason.trim()) return;
    setIsProcessing(true);
    setActionError(null);
    try {
      await api.cancelAppointment(selectedAptId, cancelReason);
      setCancelModalOpen(false);
      refetch();
    } catch (err: any) {
      setActionError(err.message || 'Cancel failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Patient Appointment Portal
        </h1>
        <p className="text-slate-600 text-sm mt-1">
          Look up, manage, reschedule, or cancel your Apollo Clinic Basaveshwar Nagar appointments.
        </p>
      </div>

      {/* Lookup Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <h2 className="text-sm font-bold text-slate-900 mb-3">Lookup Your Appointments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Lookup by Phone */}
          <form onSubmit={handlePhoneSearch} className="space-y-3">
            <label className="block text-xs font-semibold text-slate-700">
              Enter Registered Mobile Number:
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 9845123456"
                className="flex-1 py-2 px-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-none"
              />
              <Button type="submit" size="sm">
                <Search className="w-4 h-4 mr-1" />
                Find
              </Button>
            </div>
            <p className="text-[11px] text-slate-400">
              Demo tip: Try seed phone <span className="font-mono text-slate-600">9845123456</span> or your booked mobile number.
            </p>
          </form>

          {/* Direct Reference Lookup */}
          <div className="space-y-3 sm:border-l sm:border-slate-100 sm:pl-6">
            <label className="block text-xs font-semibold text-slate-700">
              Have a Booking Reference?
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={bookingRefInput}
                onChange={(e) => setBookingRefInput(e.target.value)}
                placeholder="e.g. APO-BAS-1001"
                className="flex-1 py-2 px-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-none"
              />
              <Link to={bookingRefInput ? `/confirmation/${bookingRefInput.trim()}` : '#'}>
                <Button variant="outline" size="sm" disabled={!bookingRefInput.trim()}>
                  Open
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div>
        {isLoading && (
          <div className="py-12 text-center text-xs text-slate-400">Fetching appointment records...</div>
        )}

        {submittedPhone && !isLoading && appointments.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8 space-y-3">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">No appointments found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No appointments registered under mobile number {submittedPhone}.
            </p>
            <Link to="/book">
              <Button size="sm">Book New Appointment</Button>
            </Link>
          </div>
        )}

        {appointments.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {`Found ${appointments.length} Appointment(s) for ${submittedPhone}`}
              </h3>
            </div>

            <div className="space-y-3">
              {appointments.map((apt) => (
                <div
                  key={apt.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                        {apt.bookingReference}
                      </span>
                      <StatusBadge status={apt.status} />
                      <span className="text-xs text-slate-400">Fee: ₹{apt.fee}</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-700">
                      <div className="flex items-center gap-1 font-semibold text-slate-900">
                        <Calendar className="w-3.5 h-3.5 text-sky-700" />
                        <span>{apt.appointmentDate} at {apt.appointmentTime}</span>
                      </div>
                      <div className="text-slate-600">
                        Dr: <strong>{apt.doctorName}</strong> ({apt.doctorSpeciality})
                      </div>
                      <div className="text-slate-500">
                        Service: {apt.serviceName}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <Link to={`/confirmation/${apt.bookingReference}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>

                    {apt.status !== 'cancelled' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAptId(apt.id);
                            setNewDate(apt.appointmentDate);
                            setRescheduleModalOpen(true);
                          }}
                        >
                          Reschedule
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-rose-600"
                          onClick={() => {
                            setSelectedAptId(apt.id);
                            setCancelModalOpen(true);
                          }}
                        >
                          Cancel
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reschedule Modal */}
      <Modal
        isOpen={rescheduleModalOpen}
        onClose={() => setRescheduleModalOpen(false)}
        title="Reschedule Appointment"
      >
        <div className="space-y-4">
          {actionError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200">
              {actionError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">New Date</label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                setNewTime('');
              }}
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Available Time Slots</label>
            {!availability?.isAvailable ? (
              <p className="text-xs text-slate-400">
                {availability?.reason || 'Select an active consulting date to view slots'}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {availability.slots.map((s) => (
                  <button
                    key={s.time}
                    disabled={!s.available}
                    onClick={() => setNewTime(s.time)}
                    className={`p-2 rounded text-xs font-semibold border ${
                      newTime === s.time
                        ? 'bg-sky-700 text-white border-sky-700'
                        : s.available
                        ? 'bg-white hover:bg-sky-50 text-slate-800 border-slate-200'
                        : 'bg-slate-100 text-slate-400 line-through'
                    }`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setRescheduleModalOpen(false)}>
              Back
            </Button>
            <Button size="sm" onClick={handleReschedule} disabled={isProcessing || !newTime}>
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
          <p className="text-xs text-slate-600">
            Please confirm cancellation. The slot will immediately become available for other patients.
          </p>
          {actionError && (
            <div className="p-3 bg-rose-50 text-rose-800 text-xs rounded-lg border border-rose-200">
              {actionError}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Cancellation *</label>
            <textarea
              rows={3}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="State reason for cancellation..."
              className="w-full py-2 px-3 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-none"
            ></textarea>
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCancelModalOpen(false)}>
              Keep Appointment
            </Button>
            <Button variant="danger" size="sm" onClick={handleCancel} disabled={isProcessing}>
              Confirm Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
