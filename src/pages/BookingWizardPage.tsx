import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, Clock, User, CheckCircle2, AlertCircle, ArrowLeft, 
  ArrowRight, ShieldCheck, MapPin, Stethoscope, Activity, Lock,
  CreditCard, Banknote, Smartphone, QrCode, ShieldAlert, Sparkles, Check
} from 'lucide-react';
import { api } from '../api/client';
import { Button, StatusBadge, Modal } from '../components/common/UI';
import { VERIFIED_CLINIC_CONFIG } from '../config/clinicData';

type PaymentMode = 'cash-at-clinic' | 'phonepe' | 'paytm' | 'card' | 'razorpay';

export default function BookingWizardPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Wizard Step (1 to 7)
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [selectedServiceId, setSelectedServiceId] = useState(searchParams.get('serviceId') || '');
  const [selectedDoctorId, setSelectedDoctorId] = useState(searchParams.get('doctorId') || '');
  const [matchAnyDoctor, setMatchAnyDoctor] = useState(false);

  const defaultDate = searchParams.get('date') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(searchParams.get('time') || '');

  // Patient details state
  const [patientName, setPatientName] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientAge, setPatientAge] = useState('');
  const [patientGender, setPatientGender] = useState<'male' | 'female' | 'other'>('male');
  const [visitType, setVisitType] = useState<'first-visit' | 'follow-up'>('first-visit');
  const [reasonForVisit, setReasonForVisit] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Payment State
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<PaymentMode>('cash-at-clinic');
  const [upiIdInput, setUpiIdInput] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [razorpayOrder, setRazorpayOrder] = useState<any>(null);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{
    paymentId: string;
    orderId: string;
    method: string;
  } | null>(null);

  // Validation errors & server submission states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Load Services & Doctors
  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.getServices()
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.getDoctors()
  });

  // Effective doctor for slot calculations
  const effectiveDoctorId = matchAnyDoctor
    ? (doctors.find(d => selectedServiceId ? d.specialityId === services.find(s => s.id === selectedServiceId)?.specialityId : true)?.id || doctors[0]?.id)
    : selectedDoctorId;

  // Real availability query from backend
  const { data: availability, isLoading: isAvailabilityLoading, refetch: refetchAvailability } = useQuery({
    queryKey: ['availability', effectiveDoctorId, selectedDate],
    queryFn: () => api.getAvailability(effectiveDoctorId, selectedDate),
    enabled: !!effectiveDoctorId && !!selectedDate
  });

  // Auto-advance if query params provided
  useEffect(() => {
    if (searchParams.get('doctorId')) {
      setSelectedDoctorId(searchParams.get('doctorId')!);
      const doc = doctors.find(d => d.id === searchParams.get('doctorId'));
      if (doc && !selectedServiceId) {
        const matchingSrv = services.find(s => s.specialityId === doc.specialityId);
        if (matchingSrv) setSelectedServiceId(matchingSrv.id);
      }
    }
  }, [searchParams, doctors, services]);

  const selectedDoctor = doctors.find(d => d.id === effectiveDoctorId);
  const selectedService = services.find(s => s.id === selectedServiceId);
  const payableAmount = selectedDoctor?.consultationFee || selectedService?.price || 500;

  // Step validations
  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1 && !selectedServiceId) {
      newErrors.service = 'Please select a healthcare service or consultation type.';
    }

    if (step === 2 && !selectedDoctorId && !matchAnyDoctor) {
      newErrors.doctor = 'Please select a consulting doctor or opt for clinic matching.';
    }

    if (step === 3 && !selectedDate) {
      newErrors.date = 'Please pick a consultation date.';
    }

    if (step === 4 && !selectedTimeSlot) {
      newErrors.time = 'Please select an available appointment time slot.';
    }

    if (step === 5) {
      if (!patientName.trim()) newErrors.patientName = 'Patient full name is required.';
      const cleanPhone = patientPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) newErrors.patientPhone = 'Please provide a valid 10-digit mobile number.';
      if (!patientEmail.trim() || !patientEmail.includes('@')) {
        newErrors.patientEmail = 'A valid email address is required for appointment confirmation.';
      }
    }

    if (step === 6) {
      if (!selectedPaymentMode) {
        newErrors.payment = 'Please choose a payment method.';
      }
    }

    if (step === 7 && !termsAccepted) {
      newErrors.terms = 'You must accept the appointment cancellation and privacy terms.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setServerError(null);
      setCurrentStep(prev => Math.min(prev + 1, 7));
    }
  };

  const handleBack = () => {
    setServerError(null);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Launch Razorpay Payment Flow
  const initiateOnlinePayment = async () => {
    setIsPaymentProcessing(true);
    try {
      const order = await api.createRazorpayOrder(payableAmount, `REC-${Date.now()}`);
      setRazorpayOrder(order);
      setIsRazorpayModalOpen(true);
    } catch (err: any) {
      setServerError(err.message || 'Failed to initiate Razorpay payment');
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  // Handle successful payment completion
  const handleCompleteRazorpayPayment = async (methodType: string) => {
    setIsPaymentProcessing(true);
    const mockPaymentId = `pay_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      await api.verifyRazorpayPayment({
        razorpay_order_id: razorpayOrder?.orderId || `order_${Date.now()}`,
        razorpay_payment_id: mockPaymentId
      });

      setPaymentSuccessData({
        paymentId: mockPaymentId,
        orderId: razorpayOrder?.orderId || `order_${Date.now()}`,
        method: methodType
      });

      setIsRazorpayModalOpen(false);
      setCurrentStep(7);
    } catch (err: any) {
      alert('Payment processing error: ' + err.message);
    } finally {
      setIsPaymentProcessing(false);
    }
  };

  // Final Submission to backend
  const handleSubmitBooking = async () => {
    if (!validateStep(7)) return;

    setIsSubmitting(true);
    setServerError(null);

    const isOnlinePaid = selectedPaymentMode !== 'cash-at-clinic' && paymentSuccessData;

    try {
      const response = await api.createAppointment({
        patientName,
        patientPhone,
        patientEmail,
        patientAge: patientAge ? parseInt(patientAge, 10) : undefined,
        patientGender,
        visitType,
        reasonForVisit,
        doctorId: selectedDoctor?.id || effectiveDoctorId,
        serviceId: selectedService?.id || selectedServiceId,
        appointmentDate: selectedDate,
        appointmentTime: selectedTimeSlot,
        paymentMode: selectedPaymentMode,
        paymentStatus: isOnlinePaid ? 'paid' : 'pending',
        paymentId: paymentSuccessData?.paymentId,
        razorpayOrderId: paymentSuccessData?.orderId,
        paymentMethod: isOnlinePaid ? paymentSuccessData.method : 'Cash on Arrival'
      });

      navigate(`/confirmation/${response.bookingReference}`);
    } catch (err: any) {
      setServerError(err.message || 'Unable to confirm appointment. Please choose another slot.');
      refetchAvailability();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F8FAFC] text-[#0F172A]">
      {/* Wizard Header & Progress Bar */}
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold border border-blue-200 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Branch Appointment Booking
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Book an Appointment at LifeCare Hospital Basaveshwar Nagar
        </h1>
        <p className="text-[#64748B] text-xs sm:text-sm mt-1">
          Complete steps 1 to 7 below to reserve your confirmed time slot.
        </p>

        {/* Visual Progress Steps */}
        <div className="mt-6 flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-[#E2E8F0] -translate-y-1/2 z-0"></div>
          <div
            className="absolute top-1/2 left-0 h-1 bg-[#2563EB] -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((currentStep - 1) / 6) * 100}%` }}
          ></div>

          {[
            { step: 1, title: 'Service' },
            { step: 2, title: 'Doctor' },
            { step: 3, title: 'Date' },
            { step: 4, title: 'Slot' },
            { step: 5, title: 'Patient' },
            { step: 6, title: 'Payment' },
            { step: 7, title: 'Confirm' }
          ].map((item) => (
            <div key={item.step} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  currentStep >= item.step
                    ? 'bg-[#2563EB] text-white shadow-xs'
                    : 'bg-[#FFFFFF] text-[#64748B] border border-[#E2E8F0]'
                }`}
              >
                {item.step}
              </div>
              <span className="hidden sm:block text-[11px] font-semibold text-[#64748B] mt-1">
                {item.title}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Wizard Card Body */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
        {serverError && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block">Booking Issue:</span>
              <span>{serverError}</span>
            </div>
          </div>
        )}

        {/* STEP 1: Select Service */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Step 1: Choose Service or Specialty</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Select the medical consultation or diagnostic procedure you need.</p>
            </div>

            {errors.service && (
              <p className="text-xs text-rose-700 font-semibold">{errors.service}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {services.map((srv) => (
                <div
                  key={srv.id}
                  onClick={() => {
                    setSelectedServiceId(srv.id);
                    setErrors({});
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedServiceId === srv.id
                      ? 'border-[#2563EB] bg-blue-50/70 ring-2 ring-[#2563EB]'
                      : 'border-[#E2E8F0] hover:border-blue-300 bg-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#2563EB] bg-blue-50 px-2 py-0.5 rounded">
                      {srv.specialityName}
                    </span>
                    <span className="text-xs font-bold text-[#0F172A]">₹{srv.price}</span>
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-1">{srv.name}</h3>
                  <p className="text-xs text-[#64748B] line-clamp-2">{srv.description}</p>
                  <div className="mt-2 text-[11px] text-[#64748B]">Duration: {srv.durationMinutes} mins</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: Select Doctor */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Step 2: Choose Doctor</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Select your preferred consultant or let hospital reception match you.</p>
            </div>

            {errors.doctor && (
              <p className="text-xs text-rose-700 font-semibold">{errors.doctor}</p>
            )}

            {/* Hospital Match Option */}
            <div
              onClick={() => {
                setMatchAnyDoctor(true);
                setSelectedDoctorId('');
                setErrors({});
              }}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                matchAnyDoctor
                  ? 'border-[#2563EB] bg-blue-50/70 ring-2 ring-[#2563EB]'
                  : 'border-[#E2E8F0] hover:border-blue-300 bg-[#FFFFFF]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold">
                  ★
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Assign Best Available Doctor</h3>
                  <p className="text-xs text-[#64748B]">
                    Hospital triage will match the earliest qualified consultant for your selected service.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {doctors.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedDoctorId(doc.id);
                    setMatchAnyDoctor(false);
                    setErrors({});
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedDoctorId === doc.id && !matchAnyDoctor
                      ? 'border-[#2563EB] bg-blue-50/70 ring-2 ring-[#2563EB]'
                      : 'border-[#E2E8F0] hover:border-blue-300 bg-[#FFFFFF]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={doc.photoUrl}
                      alt={doc.name}
                      className="w-14 h-14 rounded-xl object-cover border border-[#E2E8F0] shrink-0"
                    />
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A]">{doc.name}</h3>
                      <p className="text-xs font-semibold text-[#2563EB]">{doc.specialityName}</p>
                      <p className="text-xs text-[#64748B]">{doc.qualifications}</p>
                      <p className="text-xs font-bold text-[#0F172A] mt-1">Fee: ₹{doc.consultationFee}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Select Date */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Step 3: Select Appointment Date</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Choose your preferred day for the visit.</p>
            </div>

            {errors.date && (
              <p className="text-xs text-rose-700 font-semibold">{errors.date}</p>
            )}

            <div className="max-w-xs">
              <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">Consultation Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTimeSlot('');
                  setErrors({});
                }}
                className="w-full py-2.5 px-3 border border-[#E2E8F0] rounded-lg text-sm bg-[#FFFFFF] text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
              />
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl text-xs text-[#0F172A]/90 space-y-1 border border-[#E2E8F0]">
              <p className="font-semibold text-[#0F172A]">Hospital Timings:</p>
              <p className="text-[#64748B]">• Mon – Sat: 08:00 AM – 08:00 PM</p>
              <p className="text-[#64748B]">• Sun: 08:00 AM – 01:00 PM</p>
            </div>
          </div>
        )}

        {/* STEP 4: Select Time Slot */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Step 4: Select Available Time Slot</h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Calculated live for <strong className="text-[#0F172A]">{selectedDoctor?.name || 'Clinic Consultant'}</strong> on <strong className="text-[#0F172A]">{selectedDate}</strong>.
              </p>
            </div>

            {errors.time && (
              <p className="text-xs text-rose-700 font-semibold">{errors.time}</p>
            )}

            {isAvailabilityLoading ? (
              <div className="py-12 text-center text-xs text-[#64748B]">Checking doctor schedule...</div>
            ) : !availability?.isAvailable ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>{availability?.reason || 'No appointment slots available for this doctor on this date.'}</span>
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-xs font-semibold text-[#0F172A] block">Available Slots:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {availability.slots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      disabled={!slot.available}
                      onClick={() => {
                        setSelectedTimeSlot(slot.time);
                        setErrors({});
                      }}
                      className={`p-3 rounded-lg text-xs font-semibold border text-center transition-all ${
                        selectedTimeSlot === slot.time
                          ? 'bg-[#2563EB] text-white border-[#2563EB] shadow-xs'
                          : slot.available
                          ? 'bg-[#FFFFFF] hover:bg-blue-50 text-[#0F172A] border-[#E2E8F0] hover:border-[#2563EB]'
                          : 'bg-[#F8FAFC] text-[#64748B]/60 border-[#E2E8F0] cursor-not-allowed line-through'
                      }`}
                    >
                      {slot.time}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Patient Details */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Step 5: Patient Contact Information</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Your booking confirmation and hospital records will be registered under these details.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Patient Full Name *</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="e.g. Ananya Deshmukh"
                  className="w-full py-2.5 px-3 border border-[#E2E8F0] rounded-lg text-sm bg-[#FFFFFF] text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
                {errors.patientName && <p className="text-xs text-rose-700 mt-1">{errors.patientName}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Mobile Number (10 digits) *</label>
                <input
                  type="tel"
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="e.g. 9845012345"
                  className="w-full py-2.5 px-3 border border-[#E2E8F0] rounded-lg text-sm bg-[#FFFFFF] text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
                {errors.patientPhone && <p className="text-xs text-rose-700 mt-1">{errors.patientPhone}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Email Address *</label>
                <input
                  type="email"
                  value={patientEmail}
                  onChange={(e) => setPatientEmail(e.target.value)}
                  placeholder="e.g. ananya@example.com"
                  className="w-full py-2.5 px-3 border border-[#E2E8F0] rounded-lg text-sm bg-[#FFFFFF] text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                />
                {errors.patientEmail && <p className="text-xs text-rose-700 mt-1">{errors.patientEmail}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Age (Years)</label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={patientAge}
                    onChange={(e) => setPatientAge(e.target.value)}
                    placeholder="e.g. 32"
                    className="w-full py-2.5 px-3 border border-[#E2E8F0] rounded-lg text-sm bg-[#FFFFFF] text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] mb-1">Gender</label>
                  <select
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value as any)}
                    className="w-full py-2.5 px-3 border border-[#E2E8F0] rounded-lg text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none bg-[#FFFFFF] text-[#0F172A]"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">Visit Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-[#0F172A] cursor-pointer">
                    <input
                      type="radio"
                      name="visitType"
                      checked={visitType === 'first-visit'}
                      onChange={() => setVisitType('first-visit')}
                      className="text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    First Visit to this Branch
                  </label>
                  <label className="flex items-center gap-2 text-xs text-[#0F172A] cursor-pointer">
                    <input
                      type="radio"
                      name="visitType"
                      checked={visitType === 'follow-up'}
                      onChange={() => setVisitType('follow-up')}
                      className="text-[#2563EB] focus:ring-[#2563EB]"
                    />
                    Follow-up Consultation
                  </label>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                  Reason for Visit / Symptoms (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reasonForVisit}
                  onChange={(e) => setReasonForVisit(e.target.value)}
                  placeholder="Briefly state reason for visit (e.g. fever for 2 days, routine pregnancy scan, knee pain)..."
                  className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg text-xs bg-[#FFFFFF] text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                ></textarea>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Your symptoms are confidential and only accessible by the attending medical practitioner.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Select Payment Method */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0]">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">Step 6: Choose Payment Method</h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Select your preferred payment mode for this consultation.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-[#64748B] block">Total Payable</span>
                <span className="text-xl font-extrabold text-[#2563EB]">₹{payableAmount}</span>
              </div>
            </div>

            {paymentSuccessData && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-bold block">Payment Pre-Authorized Successfully!</span>
                    <span>Ref: {paymentSuccessData.paymentId} via {paymentSuccessData.method}</span>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded bg-emerald-100 font-bold text-emerald-800 text-[11px]">
                  Paid Online ✓
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option 1: Cash on the Slot / Pay at Clinic */}
              <div
                onClick={() => {
                  setSelectedPaymentMode('cash-at-clinic');
                  setPaymentSuccessData(null);
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  selectedPaymentMode === 'cash-at-clinic'
                    ? 'border-[#2563EB] bg-blue-50/70 ring-2 ring-[#2563EB]'
                    : 'border-[#E2E8F0] hover:border-blue-300 bg-[#FFFFFF]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                    <Banknote className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]">
                    No Advance Fee
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Cash on the Slot / Clinic Counter</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Reserve your slot now. Pay ₹{payableAmount} in cash, UPI, or card directly at the LifeCare Hospital reception upon your arrival.
                </p>
              </div>

              {/* Option 2: PhonePe UPI */}
              <div
                onClick={() => {
                  setSelectedPaymentMode('phonepe');
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  selectedPaymentMode === 'phonepe'
                    ? 'border-[#2563EB] bg-blue-50/70 ring-2 ring-[#2563EB]'
                    : 'border-[#E2E8F0] hover:border-blue-300 bg-[#FFFFFF]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-sm">
                    पे
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#2563EB]">
                    PhonePe UPI
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Pay with PhonePe</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Pay instantly using PhonePe app, UPI QR, or VPA. Powered by Razorpay secure gateway.
                </p>
                {selectedPaymentMode === 'phonepe' && !paymentSuccessData && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={initiateOnlinePayment}
                      disabled={isPaymentProcessing}
                    >
                      <Smartphone className="w-3.5 h-3.5 mr-1" />
                      {isPaymentProcessing ? 'Opening Gateway...' : `Pay ₹${payableAmount} via PhonePe`}
                    </Button>
                  </div>
                )}
              </div>

              {/* Option 3: Paytm UPI & Wallet */}
              <div
                onClick={() => {
                  setSelectedPaymentMode('paytm');
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  selectedPaymentMode === 'paytm'
                    ? 'border-[#2563EB] bg-blue-50/70 ring-2 ring-[#2563EB]'
                    : 'border-[#E2E8F0] hover:border-blue-300 bg-[#FFFFFF]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                    Paytm
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#2563EB]">
                    Paytm / Wallet
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Pay with Paytm</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  Fast checkout with Paytm UPI handle, Paytm Wallet balance, or linked bank account.
                </p>
                {selectedPaymentMode === 'paytm' && !paymentSuccessData && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={initiateOnlinePayment}
                      disabled={isPaymentProcessing}
                    >
                      <Smartphone className="w-3.5 h-3.5 mr-1" />
                      {isPaymentProcessing ? 'Opening Gateway...' : `Pay ₹${payableAmount} via Paytm`}
                    </Button>
                  </div>
                )}
              </div>

              {/* Option 4: Credit / Debit Cards via Razorpay */}
              <div
                onClick={() => {
                  setSelectedPaymentMode('card');
                }}
                className={`p-5 rounded-xl border cursor-pointer transition-all ${
                  selectedPaymentMode === 'card'
                    ? 'border-[#2563EB] bg-blue-50/70 ring-2 ring-[#2563EB]'
                    : 'border-[#E2E8F0] hover:border-blue-300 bg-[#FFFFFF]'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#2563EB]">
                    Visa / MC / RuPay
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">Credit or Debit Card</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  All major Indian and international cards accepted with 256-bit SSL encrypted checkout.
                </p>
                {selectedPaymentMode === 'card' && !paymentSuccessData && (
                  <div className="mt-3">
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={initiateOnlinePayment}
                      disabled={isPaymentProcessing}
                    >
                      <CreditCard className="w-3.5 h-3.5 mr-1" />
                      {isPaymentProcessing ? 'Authorizing Card...' : `Pay ₹${payableAmount} via Card`}
                    </Button>
                  </div>
                )}
              </div>

              {/* Option 5: Razorpay All-in-One Gateway */}
              <div
                onClick={() => {
                  setSelectedPaymentMode('razorpay');
                }}
                className={`sm:col-span-2 p-5 rounded-xl border cursor-pointer transition-all ${
                  selectedPaymentMode === 'razorpay'
                    ? 'border-[#2563EB] bg-blue-50/70 ring-2 ring-[#2563EB]'
                    : 'border-[#E2E8F0] hover:border-blue-300 bg-[#FFFFFF]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                      RZP
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A]">Razorpay All-in-One Checkout</h3>
                      <p className="text-xs text-[#64748B]">
                        Choose Google Pay, CRED, NetBanking (SBI, HDFC, ICICI), or PayLater.
                      </p>
                    </div>
                  </div>
                  {!paymentSuccessData && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(e: any) => {
                        e.stopPropagation();
                        initiateOnlinePayment();
                      }}
                      disabled={isPaymentProcessing}
                    >
                      Open Razorpay
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] flex items-center justify-between text-xs text-[#64748B]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                RBI & PCI-DSS Compliant 256-Bit SSL Payment Engine
              </span>
              <span className="font-semibold text-[#0F172A]">LifeCare Hospital Basaveshwar Nagar Gateway</span>
            </div>
          </div>
        )}

        {/* STEP 7: Review & Final Confirmation */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">Step 7: Review & Confirm Appointment</h2>
              <p className="text-xs text-[#64748B] mt-0.5">Please review your final booking summary and policy terms.</p>
            </div>

            <div className="bg-[#F8FAFC] rounded-xl p-6 border border-[#E2E8F0] space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pb-4 border-b border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] block">Consulting Doctor:</span>
                  <span className="font-bold text-[#0F172A] text-sm">{selectedDoctor?.name || 'Hospital Consultant'}</span>
                  <span className="text-[#2563EB] block font-medium">{selectedDoctor?.specialityName}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Service:</span>
                  <span className="font-bold text-[#0F172A] text-sm">{selectedService?.name}</span>
                  <span className="text-[#64748B] block">{selectedService?.durationMinutes} mins consultation</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pb-4 border-b border-[#E2E8F0]">
                <div>
                  <span className="text-[#64748B] block">Date & Time:</span>
                  <span className="font-bold text-[#2563EB] text-sm">{selectedDate} at {selectedTimeSlot}</span>
                  <span className="text-[#64748B] block">Indian Standard Time (IST)</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Branch Address:</span>
                  <span className="font-semibold text-[#0F172A] block">LifeCare Hospital, Basaveshwar Nagar</span>
                  <span className="text-[#64748B] block">Dr. M.C. Modi Hospital Road, Bengaluru - 560079</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#64748B] block">Patient Name:</span>
                  <span className="font-semibold text-[#0F172A]">{patientName} ({patientGender}, {patientAge || 'Adult'})</span>
                  <span className="text-[#64748B] block">{patientPhone} • {patientEmail}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block">Payment Method & Status:</span>
                  <span className="font-extrabold text-[#2563EB] text-base">₹{payableAmount}</span>
                  {selectedPaymentMode === 'cash-at-clinic' ? (
                    <span className="text-[11px] text-[#2563EB] font-semibold block">
                      Cash on Slot / Pay at Clinic Reception on Arrival
                    </span>
                  ) : paymentSuccessData ? (
                    <span className="text-[11px] text-emerald-800 font-bold block">
                      ✓ Paid Online via {paymentSuccessData.method} (Ref: {paymentSuccessData.paymentId})
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#2563EB] font-semibold block">
                      Online Payment: {selectedPaymentMode.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-[#0F172A] space-y-2">
              <span className="font-bold block text-[#2563EB]">Appointment Policy:</span>
              <p>• Please report to clinic reception 10 minutes prior to {selectedTimeSlot}.</p>
              <p>• Free rescheduling or cancellation is permitted up to 4 hours prior to appointment time.</p>
              <p>• Concurrency locking prevents double-booking for the selected slot.</p>
            </div>

            <div className="pt-2">
              <label className="flex items-start gap-2.5 text-xs text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-0.5 text-[#2563EB] rounded border-[#E2E8F0] focus:ring-[#2563EB]"
                />
                <span>
                  I accept the{' '}
                  <Link to="/legal?tab=terms" target="_blank" className="text-[#2563EB] underline font-semibold">
                    Appointment Terms
                  </Link>{' '}
                  and confirm my appointment details.
                </span>
              </label>
              {errors.terms && <p className="text-xs text-rose-700 mt-1">{errors.terms}</p>}
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex items-center justify-between">
          {currentStep > 1 ? (
            <Button variant="outline" size="sm" onClick={handleBack} disabled={isSubmitting || isPaymentProcessing}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Previous Step
            </Button>
          ) : (
            <div></div>
          )}

          {currentStep < 7 ? (
            <Button size="sm" onClick={handleNext}>
              Next Step
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button size="md" onClick={handleSubmitBooking} disabled={isSubmitting || !termsAccepted}>
              {isSubmitting ? (
                <span>Confirming Booking...</span>
              ) : (
                <span>
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {selectedPaymentMode === 'cash-at-clinic'
                    ? 'Confirm Appointment (Pay at Clinic)'
                    : paymentSuccessData
                    ? 'Complete Booking (Paid Online)'
                    : `Pay ₹${payableAmount} & Confirm`}
                </span>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* RAZORPAY CHECKOUT MODAL (Integrated Sandbox Simulator) */}
      <Modal
        isOpen={isRazorpayModalOpen}
        onClose={() => setIsRazorpayModalOpen(false)}
        title="Razorpay Secure Payment Gateway"
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between p-3.5 bg-[#0F172A] text-white rounded-xl border border-slate-700">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-white">Razorpay</span>
                <span className="px-1.5 py-0.5 rounded text-[9px] bg-[#2563EB] text-white font-bold">SECURE</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">LifeCare Hospital Basaveshwar Nagar</p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-300 block">Amount</span>
              <span className="text-lg font-bold text-white">₹{payableAmount}</span>
            </div>
          </div>

          <div className="text-xs text-[#0F172A]">
            Order Reference: <strong className="font-mono text-[#2563EB]">{razorpayOrder?.orderId || 'rzp_order_init'}</strong>
          </div>

          {/* Payment Method Selector inside Razorpay */}
          <div className="space-y-3">
            {selectedPaymentMode === 'phonepe' && (
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                <div className="flex items-center gap-2 font-bold text-[#0F172A] text-xs">
                  <Smartphone className="w-4 h-4 text-[#2563EB]" />
                  <span>PhonePe UPI Direct Payment</span>
                </div>
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1">Enter PhonePe Mobile Number or VPA</label>
                  <input
                    type="text"
                    value={upiIdInput || patientPhone}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    placeholder="e.g. 9845012345@ybl"
                    className="w-full py-2 px-3 text-xs border border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleCompleteRazorpayPayment('PhonePe UPI')}
                  disabled={isPaymentProcessing}
                >
                  {isPaymentProcessing ? 'Processing PhonePe...' : `Authorize ₹${payableAmount} on PhonePe`}
                </Button>
              </div>
            )}

            {selectedPaymentMode === 'paytm' && (
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                <div className="flex items-center gap-2 font-bold text-[#0F172A] text-xs">
                  <Smartphone className="w-4 h-4 text-[#2563EB]" />
                  <span>Paytm Wallet & UPI Transfer</span>
                </div>
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1">Paytm Registered Mobile / UPI ID</label>
                  <input
                    type="text"
                    value={upiIdInput || patientPhone}
                    onChange={(e) => setUpiIdInput(e.target.value)}
                    placeholder="e.g. 9845012345@paytm"
                    className="w-full py-2 px-3 text-xs border border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleCompleteRazorpayPayment('Paytm UPI')}
                  disabled={isPaymentProcessing}
                >
                  {isPaymentProcessing ? 'Processing Paytm...' : `Authorize ₹${payableAmount} on Paytm`}
                </Button>
              </div>
            )}

            {selectedPaymentMode === 'card' && (
              <div className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] space-y-3">
                <div className="flex items-center gap-2 font-bold text-[#0F172A] text-xs">
                  <CreditCard className="w-4 h-4 text-[#2563EB]" />
                  <span>Card Payment Details</span>
                </div>
                <div>
                  <label className="block text-[11px] text-[#64748B] mb-1">Card Number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4532 •••• •••• 8890"
                    className="w-full py-2 px-3 text-xs border border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] rounded-lg focus:outline-none font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-[#64748B] mb-1">Valid Thru (MM/YY)</label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="12/28"
                      className="w-full py-2 px-3 text-xs border border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] rounded-lg focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#64748B] mb-1">CVV</label>
                    <input
                      type="password"
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="•••"
                      className="w-full py-2 px-3 text-xs border border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] rounded-lg focus:outline-none text-center"
                    />
                  </div>
                </div>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => handleCompleteRazorpayPayment('Credit/Debit Card')}
                  disabled={isPaymentProcessing}
                >
                  {isPaymentProcessing ? 'Authorizing Card...' : `Pay ₹${payableAmount} via Card`}
                </Button>
              </div>
            )}

            {selectedPaymentMode === 'razorpay' && (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => handleCompleteRazorpayPayment('Razorpay UPI')}
                  className="w-full p-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-between text-xs font-semibold text-[#0F172A]"
                >
                  <span>Google Pay / PhonePe / Paytm UPI</span>
                  <span className="text-[#2563EB]">Pay ₹{payableAmount} →</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleCompleteRazorpayPayment('Razorpay NetBanking')}
                  className="w-full p-3 rounded-lg border border-[#E2E8F0] hover:bg-[#F8FAFC] flex items-center justify-between text-xs font-semibold text-[#0F172A]"
                >
                  <span>NetBanking (HDFC, SBI, ICICI, Axis)</span>
                  <span className="text-[#2563EB]">Pay ₹{payableAmount} →</span>
                </button>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-between items-center text-[11px] text-[#64748B]">
            <span>Powered by Razorpay Payments</span>
            <button
              type="button"
              onClick={() => setIsRazorpayModalOpen(false)}
              className="text-[#64748B] hover:text-[#0F172A] underline"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
