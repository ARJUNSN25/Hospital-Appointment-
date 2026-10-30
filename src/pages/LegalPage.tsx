import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ShieldCheck, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import { VERIFIED_CLINIC_CONFIG } from '../config/clinicData';

export default function LegalPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'disclaimer';
  const [activeTab, setActiveTab] = useState(initialTab);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 bg-[#F8FAFC] text-[#0F172A]">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-6">
        <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
          Policies & Disclaimers
        </h1>
        <p className="text-[#64748B] text-sm mt-1">
          Patient care policies, cancellation guidelines, and legal disclosures for LifeCare Hospital (Apollo Clinic Basaveshwar Nagar).
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-2">
        {[
          { id: 'disclaimer', label: 'Medical Disclaimer', icon: AlertTriangle },
          { id: 'cancellation', label: 'Cancellation & Rescheduling', icon: RefreshCw },
          { id: 'privacy', label: 'Patient Privacy Policy', icon: ShieldCheck },
          { id: 'terms', label: 'Terms of Use', icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#2563EB] text-[#FFFFFF] shadow-sm'
                  : 'text-[#64748B] hover:bg-[#FFFFFF] hover:text-[#0F172A]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm text-sm text-[#0F172A] leading-relaxed space-y-4">
        {activeTab === 'disclaimer' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Medical Disclaimer & Emergency Care Notice</h2>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-2">
              <span className="font-bold block text-amber-950">IMPORTANT EMERGENCY NOTICE:</span>
              <p>
                This appointment booking platform is strictly intended for scheduling elective, non-emergency outpatient consultations and routine diagnostic appointments.
              </p>
              <p>
                If you are experiencing acute medical symptoms—including chest pain, severe shortness of breath, sudden numbness, uncontrolled bleeding, severe trauma, or suspected poisoning—do not wait for an online appointment. Call <strong>1066</strong> immediately or report to the nearest emergency casualty trauma ward.
              </p>
            </div>
            <p className="text-[#64748B]">
              The health information, service descriptions, and preparation guides published on this platform are for general informational purposes only and do not constitute formal medical diagnosis or treatment plans. A medical diagnosis can only be determined by a certified physician following in-person clinical evaluation.
            </p>
          </div>
        )}

        {activeTab === 'cancellation' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Appointment Cancellation & Rescheduling Policy</h2>
            <div className="space-y-3 text-xs text-[#0F172A]">
              <p>
                <strong className="text-[#2563EB]">Free Rescheduling:</strong> Patients may reschedule an appointment up to {VERIFIED_CLINIC_CONFIG.cancellationPolicy.rescheduleAllowedHours} hours prior to the scheduled consultation time without charge, subject to doctor availability.
              </p>
              <p>
                <strong className="text-[#2563EB]">Cancellation Window:</strong> Appointments cancelled at least {VERIFIED_CLINIC_CONFIG.cancellationPolicy.freeCancellationHours} hours before the appointment slot will incur no administrative fees.
              </p>
              <p>
                <strong className="text-[#2563EB]">Released Slots:</strong> Upon cancellation, the reserved consultation slot is immediately restored into the clinic schedule engine so that other patients in need of medical care can book it.
              </p>
              <p>
                <strong className="text-[#2563EB]">Doctor Unavailability:</strong> In rare instances where an attending specialist is called for emergency medical intervention, the clinic will notify the patient promptly and provide priority rescheduling.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'privacy' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Patient Data Safeguards & Privacy Policy</h2>
            <p className="text-xs text-[#64748B]">
              We take the privacy and confidentiality of your personal and medical information seriously:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-xs text-[#0F172A]">
              <li>Contact details (name, phone number, email) are exclusively used for booking verification, appointment confirmations, reminder notices, and clinic operational logistics.</li>
              <li>Optional reasons for visit and symptoms entered during booking are kept strictly confidential and accessible solely by the attending medical practitioner.</li>
              <li>We enforce Role-Based Access Control (RBAC) to ensure that patients can only access their own appointments, and administrators are audited on all access attempts.</li>
              <li>We do not sell, rent, or disclose patient identifiers to third-party commercial advertisers.</li>
            </ul>
          </div>
        )}

        {activeTab === 'terms' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">Terms of Use</h2>
            <p className="text-xs text-[#0F172A]">
              By using this appointment booking platform, you agree to provide authentic, accurate contact details. Fictitious bookings or repeated no-shows may lead to online booking privileges being restricted by clinic administration.
            </p>
            <p className="text-xs text-[#64748B]">
              Consultation fees are collected at clinic reception upon arrival, unless pre-paid online. The clinic reserves the right to adjust consultation hours based on medical panel duty rosters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
