import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Phone, Calendar, Clock, MapPin, Menu, X, ShieldCheck, HeartPulse } from 'lucide-react';
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
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top emergency and branch helpline banner */}
      <div className="bg-slate-900 text-slate-200 text-xs py-2 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium text-amber-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Verified Branch: Basaveshwar Nagar, Bengaluru
            </span>
            <span className="hidden md:inline text-slate-500">|</span>
            <span className="hidden md:flex items-center gap-1 text-slate-300">
              <Clock className="w-3 h-3 text-sky-400" />
              Mon-Sat: 8 AM - 8 PM
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <a
              href={`tel:${VERIFIED_CLINIC_CONFIG.contacts.centralHelpline}`}
              className="flex items-center gap-1 hover:text-white transition-colors"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>Helpline: {VERIFIED_CLINIC_CONFIG.contacts.centralHelpline}</span>
            </a>
            <a
              href={`https://wa.me/${VERIFIED_CLINIC_CONFIG.contacts.whatsappNumber.replace(/\D/g, '')}?text=Hello%20Apollo%20Clinic%20Basaveshwar%20Nagar%20I%20would%20like%20to%20inquire%20about%20appointments`}
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
              className="hidden lg:flex items-center gap-1 text-sky-400 hover:text-sky-300"
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
          {/* Logo & Branch Name */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-700 to-sky-900 flex items-center justify-center text-white shadow-md group-hover:scale-105 transition-transform">
              <HeartPulse className="w-6 h-6 text-teal-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-slate-900">
                  Apollo <span className="text-sky-700">Clinic</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 rounded">
                  Basaveshwar Nagar
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Multi-Specialty Clinic & Diagnostics • Bengaluru
              </p>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3 py-2 text-sm font-semibold rounded-md transition-colors ${
                  isActive(link.path)
                    ? 'text-sky-700 bg-sky-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Right Action CTA */}
          <div className="hidden sm:flex items-center gap-3">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold text-sm shadow-sm transition-all focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-base font-semibold ${
                isActive(link.path)
                  ? 'bg-sky-50 text-sky-700 font-bold'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.name}
            </Link>
          ))}
          <div className="pt-2">
            <Link
              to="/book"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-sky-700 text-white font-bold text-center shadow-sm"
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
