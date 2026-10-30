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
      <div className="max-w-5xl mx-auto px-4 py-12 bg-[#F8FAFC]">
        <div className="h-64 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl animate-pulse"></div>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4 bg-[#F8FAFC]">
        <AlertCircle className="w-12 h-12 text-rose-600 mx-auto" />
        <h2 className="text-xl font-bold text-[#0F172A]">Doctor Profile Not Found</h2>
        <p className="text-sm text-[#64748B]">The requested doctor profile does not exist or may have been deactivated.</p>
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F8FAFC] text-[#0F172A]">
      {/* Breadcrumb / Back button */}
      <div>
        <Link
          to="/doctors"
          className="inline-flex items-center text-xs font-semibold text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Doctors Directory
        </Link>
      </div>

      {/* Doctor Header Profile Card */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4 flex flex-col items-center sm:items-start text-center sm:text-left">
            <img
              src={doctor.photoUrl}
              alt={doctor.name}
              className="w-44 h-44 rounded-2xl object-cover border-2 border-[#E2E8F0] shadow-xs mb-4"
            />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold border border-blue-200 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
              Verified Clinic Consultant
            </span>
            <div className="flex items-center gap-1 text-xs text-[#64748B]">
              <MapPin className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>LifeCare Hospital Basaveshwar Nagar</span>
            </div>
          </div>

          <div className="md:col-span-8 space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                {doctor.name}
              </h1>
              <p className="text-sm font-bold text-[#2563EB] mt-1">{doctor.specialityName}</p>
              <p className="text-sm text-[#64748B] font-medium mt-0.5">{doctor.qualifications}</p>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[#64748B] py-3 border-y border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                <Award className="w-4 h-4 text-[#2563EB]" />
                <span>{doctor.experienceYears}+ Years Clinical Experience</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                <Globe className="w-4 h-4 text-[#2563EB]" />
                <span>Languages: {doctor.languages.join(', ')}</span>
              </div>
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-[#64748B]">OPD Consultation Fee:</span>
                <span className="text-sm font-bold text-[#0F172A]">₹{doctor.consultationFee}</span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-[#0F172A] mb-1">About Doctor & Clinical Focus</h3>
              <p className="text-sm text-[#0F172A]/80 leading-relaxed">{doctor.about}</p>
            </div>

            {doctor.preparationNotes && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 text-xs text-[#0F172A]">
                <span className="font-bold text-[#2563EB] block mb-1">Patient Preparation Notice:</span>
                {doctor.preparationNotes}
              </div>
            )}

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                Consultation Days at Basaveshwar Nagar
              </h4>
              <div className="flex flex-wrap gap-2">
                {doctor.availableDays.map((d) => (
                  <span
                    key={d}
                    className="px-3 py-1 text-xs font-semibold rounded-lg bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]"
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
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <h2 className="text-xl font-bold text-[#0F172A] tracking-tight">
            Check Real Available Consultation Slots
          </h2>
          <p className="text-xs text-[#64748B] mt-1">
            Slots are calculated in real time directly from our schedule engine to eliminate wait times and conflicts.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div>
            <label className="block text-xs font-semibold text-[#0F172A] mb-1">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full py-2 px-3 text-sm border border-[#E2E8F0] rounded-lg focus:ring-2 focus:ring-[#2563EB] focus:outline-none bg-[#FFFFFF] text-[#0F172A]"
            />
          </div>

          <div className="sm:col-span-2 text-xs text-[#64748B] sm:pt-4">
            <span className="font-semibold text-[#0F172A]">Clinic Timezone: </span>
            Asia/Kolkata (IST) • 30-minute standard consultation intervals.
          </div>
        </div>

        {/* Slot Grid */}
        <div className="pt-2">
          {isAvailabilityLoading ? (
            <div className="py-8 text-center text-xs text-[#64748B]">Loading available time slots...</div>
          ) : !availability?.isAvailable ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{availability?.reason || 'Doctor is not available for online booking on the selected date.'}</span>
            </div>
          ) : (
            <div>
              <span className="text-xs font-semibold text-[#0F172A] block mb-3">
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
                        ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                        : slot.available
                        ? 'bg-[#FFFFFF] hover:bg-blue-50 text-[#0F172A] border-[#E2E8F0] hover:border-[#2563EB]'
                        : 'bg-[#F8FAFC] text-[#64748B]/50 border-[#E2E8F0] cursor-not-allowed line-through'
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
        <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
          <div className="text-xs text-[#64748B]">
            {selectedTimeSlot ? (
              <span className="font-semibold text-[#0F172A]">
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
