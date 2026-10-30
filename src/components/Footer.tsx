import { Link } from 'react-router-dom';
import { Phone, MapPin, Mail, ExternalLink, ShieldAlert } from 'lucide-react';
import { VERIFIED_CLINIC_CONFIG } from '../config/clinicData';

export default function Footer() {
  return (
    <footer className="bg-[#0F172A] text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Clinic Brand & Branch Identity */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/assets/aistudio/Glossy_LifeCare_Healthcare_Logo__1__87cd2d7a.png"
                alt="LifeCare Healthcare Logo"
                className="w-11 h-11 object-contain rounded-xl p-0.5 bg-white border border-slate-700 shadow-xs"
              />
              <div>
                <span className="text-xl font-extrabold tracking-tight text-white">
                  LifeCare <span className="text-blue-400">Hospital</span>
                </span>
                <p className="text-xs text-slate-400 font-medium">Basaveshwar Nagar Branch</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dedicated primary healthcare, specialist outpatient consultations, laboratory diagnostics, and preventive health checkups for the Basaveshwar Nagar community.
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-200 text-xs border border-slate-700">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />
                Verified Healthcare Facility
              </span>
            </div>
          </div>

          {/* Verified Contact & Address */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Branch Location & Contacts
            </h4>
            <div className="space-y-3 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-slate-200 font-medium">{VERIFIED_CLINIC_CONFIG.address.line1}</p>
                  <p>{VERIFIED_CLINIC_CONFIG.address.line2}</p>
                  <p>{VERIFIED_CLINIC_CONFIG.address.suburb}, {VERIFIED_CLINIC_CONFIG.address.city} - {VERIFIED_CLINIC_CONFIG.address.postalCode}</p>
                  <a
                    href={VERIFIED_CLINIC_CONFIG.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-400 hover:text-white mt-1 font-semibold transition-colors"
                  >
                    <span>Open in Google Maps</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Phone className="w-4 h-4 text-blue-400 shrink-0" />
                <div>
                  <p className="text-slate-200">OPD Helpline: {VERIFIED_CLINIC_CONFIG.contacts.centralHelpline}</p>
                  <p className="text-slate-400">Emergency Triage: 1066</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                <p className="text-slate-300">{VERIFIED_CLINIC_CONFIG.contacts.email}</p>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/book" className="text-blue-400 hover:text-white font-semibold transition-colors">
                  • Book Online Appointment
                </Link>
              </li>
              <li>
                <Link to="/doctors" className="hover:text-white transition-colors">
                  • Verified Doctors Directory
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-white transition-colors">
                  • Diagnostic & OPD Services
                </Link>
              </li>
              <li>
                <Link to="/patient-portal" className="hover:text-white transition-colors">
                  • Check / Reschedule Appointment
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">
                  • Clinic Facilities & Timings
                </Link>
              </li>
              <li>
                <Link to="/admin" className="text-slate-200 hover:text-white transition-colors font-medium">
                  • Staff & Admin Operations Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Medical Policy Notice */}
          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
              Patient Care Policies
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Appointments can be rescheduled or cancelled up to {VERIFIED_CLINIC_CONFIG.cancellationPolicy.freeCancellationHours} hours prior to scheduled consultation time without administrative penalty.
            </p>
            <div className="space-y-1.5 text-xs">
              <Link to="/legal?tab=disclaimer" className="block text-slate-400 hover:text-white transition-colors">
                Medical Disclaimer
              </Link>
              <Link to="/legal?tab=privacy" className="block text-slate-400 hover:text-white transition-colors">
                Patient Privacy & Record Safeguards
              </Link>
              <Link to="/legal?tab=terms" className="block text-slate-400 hover:text-white transition-colors">
                Terms of Use & Cancellation Policy
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>
            © {new Date().getFullYear()} LifeCare Hospital & Clinic Basaveshwar Nagar, Bengaluru. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-500 text-center md:text-right">
            Verified healthcare location in Basaveshwar Nagar, Bengaluru.
          </p>
        </div>
      </div>
    </footer>
  );
}
