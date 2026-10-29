import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, Clock, Award, Globe, ArrowLeft, CheckCircle2, 
  AlertCircle, Stethoscope, ChevronRight, MapPin
} from 'lucide-react';
import { api } from '../api/client';
import { Button, StatusBadge } from '../components/common/UI';
import { VERIFIED_CLINIC_CONFIG } from '../config/clinicData';

export default function DoctorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Selected date for slot preview (defaults to tomorrow if today is past)
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(tomorrow);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  const { data: doctor, isLoading, error } = useQuery({
    queryKey: ['doctor', id],
    queryFn: () => api.getDoctorById(id!),
    enabled: !!id
  });

  const { data: availability, isLoading: isAvailabilityLoading } = useQuery({
    queryKey: ['availability', id, selectedDate],
    queryFn: () => api.getAvailability(id!, selectedDate),
    enabled: !!id && !!selectedDate
  });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Doctor Profile Not Found</h2>
        <p className="text-sm text-slate-600">The requested doctor profile does not exist or may have been deactivated.</p>
        <Link to="/doctors">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Doctors Directory
          </Button>
        </Link>
      </div>
    );
  }

  const handleBookSelectedSlot = (time: string) => {
    navigate(`/book?doctorId=${doctor.id}&date=${selectedDate}&time=${time}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Breadcrumb / Back button */}
      <div>
        <Link
          to="/doctors"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Doctors Directory
        </Link>
      </div>

      {/* Doctor Header Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left">
            <img
              src={doctor.photoUrl}
              alt={doctor.name}
              className="w-44 h-44 rounded-2xl object-cover border-2 border-slate-100 shadow-md mb-4"
            />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Verified Clinic Consultant
            </span>
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="w-3.5 h-3.5 text-sky-700" />
              <span>Apollo Clinic Basaveshwar Nagar</span>
            </div>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                {doctor.name}
              </h1>
              <p className="text-sm font-bold text-sky-700 mt-1">{doctor.specialityName}</p>
              <p className="text-sm text-slate-600 font-medium mt-0.5">{doctor.qualifications}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 py-3 border-y border-slate-100">
              <div className="flex items-center gap-1.5 font-medium">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{doctor.experienceYears}+ Years Clinical Experience</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <Globe className="w-4 h-4 text-sky-600" />
                <span>Languages: {doctor.languages.join(', ')}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-slate-500">OPD Consultation Fee:</span>
                <span className="text-sm font-bold text-slate-900">₹{doctor.consultationFee}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">About Doctor & Clinical Focus</h3>
              <p className="text-sm text-slate-600 leading-relaxed">{doctor.about}</p>
            </div>

            {doctor.preparationNotes && (
              <div className="bg-sky-50/70 border border-sky-200 rounded-xl p-4 text-xs text-sky-900">
                <span className="font-bold block mb-1">Patient Preparation Notice:</span>
                {doctor.preparationNotes}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Consultation Days at Basaveshwar Nagar
              </h4>
              <div className="flex flex-wrap gap-2">
                {doctor.availableDays.map((d) => (
                  <span
                    key={d}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-800 border border-slate-200"
                  >
                    {dayNames[d]}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule & Real-Time Slot Picker */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Check Real Available Consultation Slots
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Slots are calculated in real time directly from our schedule engine to eliminate wait times and conflicts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full py-2 px-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2 text-xs text-slate-500 sm:pt-4">
            <span className="font-semibold text-slate-700">Clinic Timezone: </span>
            Asia/Kolkata (IST) • 30-minute standard consultation intervals.
          </div>
        </div>

        {/* Slot Grid */}
        <div className="pt-2">
          {isAvailabilityLoading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading available time slots...</div>
          ) : !availability?.isAvailable ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{availability?.reason || 'Doctor is not available for online booking on the selected date.'}</span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-slate-700 block mb-3">
                Available Time Slots for {selectedDate}:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                {availability.slots.map((slot) => (
                  <button
                    key={slot.time}
                    disabled={!slot.available}
                    onClick={() => setSelectedTimeSlot(slot.time)}
                    className={`p-2.5 rounded-lg text-xs font-semibold border text-center transition-all ${
                      selectedTimeSlot === slot.time
                        ? 'bg-sky-700 text-white border-sky-700 shadow-sm'
                        : slot.available
                        ? 'bg-white hover:bg-sky-50 text-slate-800 border-slate-200 hover:border-sky-300'
                        : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed line-through'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Direct Booking CTA */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {selectedTimeSlot ? (
              <span className="font-semibold text-slate-900">
                Selected: {selectedDate} at {selectedTimeSlot}
              </span>
            ) : (
              <span>Please pick a time slot above to proceed</span>
            )}
          </div>
          <Button
            disabled={!selectedTimeSlot}
            onClick={() => selectedTimeSlot && handleBookSelectedSlot(selectedTimeSlot)}
          >
            <Calendar className="w-4 h-4 mr-1" />
            Proceed to Patient Details
          </Button>
        </div>
      </div>
    </div>
  );
}
