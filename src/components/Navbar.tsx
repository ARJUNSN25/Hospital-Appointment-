import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Calendar, Clock, MapPin, Menu, X, ShieldCheck } from 'lucide-react';
import { VERIFIED_CLINIC_CONFIG } from '../config/clinicData';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Doctors', path: '/doctors' },
    { name: 'Services', path: '/services' },
    { name: 'About & Branch', path: '/about' },
    { name: 'My Appointments', path: '/patient-portal' }
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E2E8F0] shadow-xs">
      {/* Top emergency and branch helpline banner */}
      <div className="bg-[#0F172A] text-[#F8FAFC] text-xs py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-slate-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              Verified Healthcare Center: Basaveshwar Nagar, Bengaluru
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:flex items-center gap-1 text-slate-300">
              <Clock className="w-3 h-3 text-blue-400" />
              Mon-Sat: 8 AM - 8 PM
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <a
              href={`tel:${VERIFIED_CLINIC_CONFIG.contacts.centralHelpline}`}
              className="flex items-center gap-1 text-[#F8FAFC] hover:text-blue-300 transition-colors"
            >
              <Phone className="w-3 h-3 text-blue-400" />
              <span>Helpline: {VERIFIED_CLINIC_CONFIG.contacts.centralHelpline}</span>
            </a>
            <a
              href={`https://wa.me/${VERIFIED_CLINIC_CONFIG.contacts.whatsappNumber.replace(/\D/g, '')}?text=Hello%20LifeCare%20Hospital%20Basaveshwar%20Nagar%20I%20would%20like%20to%20inquire%20about%20appointments`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              <span>WhatsApp</span>
            </a>
            <a
              href={VERIFIED_CLINIC_CONFIG.mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1 text-slate-300 hover:text-white"
            >
              <MapPin className="w-3 h-3" />
              <span>View on Maps</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Hospital Identity */}
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src="/assets/aistudio/Glossy_LifeCare_Healthcare_Logo__1__87cd2d7a.png"
              alt="LifeCare Healthcare Logo"
              className="w-12 h-12 object-contain rounded-xl p-0.5 bg-white border border-[#E2E8F0] shadow-xs group-hover:scale-105 transition-transform"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[#0F172A]">
                  LifeCare <span className="text-[#2563EB]">Hospital</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-[#2563EB] border border-blue-200 rounded-md">
                  Basaveshwar Nagar
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-medium">
                Multi-Specialty Hospital & Diagnostics • Bengaluru
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                  isActive(link.path)
                    ? 'text-[#2563EB] bg-blue-50 font-bold'
                    : 'text-[#0F172A] hover:text-[#2563EB] hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action CTA */}
          <div className="hidden sm:flex items-center gap-2.5">
            <Link
              to="/admin"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#0F172A] hover:text-[#2563EB] hover:bg-slate-50 transition-colors border border-[#E2E8F0]"
              title="Administrator & Staff Operations Portal"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Admin Portal</span>
            </Link>
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-xs transition-all focus:ring-2 focus:ring-[#2563EB] focus:ring-offset-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#0F172A] hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2E8F0] bg-[#FFFFFF] px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-base font-semibold ${
                isActive(link.path)
                  ? 'bg-blue-50 text-[#2563EB] font-bold'
                  : 'text-[#0F172A] hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <Link
            to="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-base font-semibold text-[#0F172A] hover:bg-slate-50 border border-[#E2E8F0]"
          >
            <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
            <span>Admin Portal</span>
          </Link>
          <div className="pt-2">
            <Link
              to="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#2563EB] text-white font-bold text-center shadow-xs"
            >
              <Calendar className="w-5 h-5" />
              Book Appointment Now
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
