import { MapPin, Phone, Clock, Mail, ExternalLink, ShieldCheck, CheckCircle2, Navigation } from 'lucide-react';
import { VERIFIED_CLINIC_CONFIG } from '../config/clinicData';
import { Button } from '../components/common/UI';

export default function AboutContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 bg-[#F8FAFC] text-[#0F172A]">
      {/* Header */}
      <div className="border-b border-[#E2E8F0] pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold border border-blue-200 mb-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified Branch Location & Facilities
        </div>
        <h1 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
          About LifeCare Hospital - Basaveshwar Nagar
        </h1>
        <p className="text-[#64748B] text-sm mt-1 max-w-3xl">
          Comprehensive outpatient healthcare facility serving West of Chord Road, Basaveshwar Nagar, Rajajinagar, and surrounding residential communities with trusted diagnostic and clinical expertise.
        </p>
      </div>

      {/* Facilities & Diagnostic Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-[#FFFFFF] flex items-center justify-center font-bold">
            01
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">Multi-Specialty Consultation OPD</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Spacious, air-conditioned consultation chambers dedicated to Obstetrics & Gynecology, General Internal Medicine, Pediatrics, Orthopedics, and Dermatology with senior consultants.
          </p>
        </div>

        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-[#FFFFFF] flex items-center justify-center font-bold">
            02
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">Modern Diagnostics & Sonography</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            High-precision 12-lead digital ECG, advanced 2D/3D abdominal and obstetric ultrasound, blood sample collection, and rapid turnaround pathology testing.
          </p>
        </div>

        <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-[#2563EB] text-[#FFFFFF] flex items-center justify-center font-bold">
            03
          </div>
          <h3 className="text-base font-bold text-[#0F172A]">Preventive ProHealth Packages</h3>
          <p className="text-xs text-[#64748B] leading-relaxed">
            Tailored annual checkups, cardiac risk assessments, diabetic health profiles, and senior citizen wellness evaluations with personalized doctor reviews.
          </p>
        </div>
      </div>

      {/* Verified Map & Location Card */}
      <div className="bg-[#FFFFFF] rounded-3xl border border-[#E2E8F0] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        <div className="lg:col-span-5 p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">Location & Transit Access</h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Situated in Model LIC Colony / Bimajyothi LIC Colony, near Dr. M.C. Modi Hospital Road, just off West of Chord Road.
            </p>
          </div>

          <div className="space-y-3 text-xs text-[#0F172A]">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#0F172A]">{VERIFIED_CLINIC_CONFIG.address.line1}</p>
                <p className="text-[#64748B]">{VERIFIED_CLINIC_CONFIG.address.line2}</p>
                <p className="text-[#64748B]">{VERIFIED_CLINIC_CONFIG.address.landmark}</p>
                <p className="text-[#64748B]">{VERIFIED_CLINIC_CONFIG.address.suburb}, Bengaluru, Karnataka 560079</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#0F172A]">Clinic Working Hours</p>
                <p className="text-[#64748B]">Monday - Saturday: 08:00 AM - 08:00 PM</p>
                <p className="text-[#64748B]">Sunday: 08:00 AM - 01:00 PM (OPD & Diagnostics)</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-[#0F172A]">Contact Telephone Numbers</p>
                <p className="text-[#64748B]">Helpline: {VERIFIED_CLINIC_CONFIG.contacts.centralHelpline}</p>
                <p className="text-[#64748B]">Direct Branch: {VERIFIED_CLINIC_CONFIG.contacts.branchDirectPhone}</p>
                <p className="text-[#64748B]">Emergency Ambulance: 1066</p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <a
              href={VERIFIED_CLINIC_CONFIG.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] font-semibold text-xs transition-colors shadow-sm"
            >
              <Navigation className="w-4 h-4" />
              <span>Open Exact Location in Google Maps</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        <div className="lg:col-span-7 h-96 lg:h-auto min-h-[380px] bg-[#F8FAFC] relative">
          <iframe
            title="LifeCare Hospital Basaveshwar Nagar Google Map"
            src={VERIFIED_CLINIC_CONFIG.embedMapUrl}
            className="w-full h-full border-0 absolute inset-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          ></iframe>
        </div>
      </div>
    </div>
  );
}
