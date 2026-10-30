import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, Search, ArrowRight, ShieldCheck, Clock, MapPin, 
  Stethoscope, Activity, Award, CheckCircle2, ChevronRight,
  ExternalLink, PhoneCall
} from 'lucide-react';
import { api } from '../api/client';
import { VERIFIED_CLINIC_CONFIG } from '../config/clinicData';
import { Button } from '../components/common/UI';

export default function HomePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.getDoctors()
  });

  const { data: services = [] } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.getServices()
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/doctors?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/doctors');
    }
  };

  return (
    <div className="space-y-16 lg:space-y-24 pb-20 bg-[#F8FAFC] text-[#0F172A]">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#F8FAFC] pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines & Search */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold border border-blue-200">
                <ShieldCheck className="w-4 h-4 text-[#2563EB]" />
                <span>Verified Facility • Modi Hospital Road, Basaveshwar Nagar</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#0F172A] tracking-tight leading-tight">
                Compassionate Healthcare, <span className="text-[#2563EB] underline decoration-blue-200 decoration-4 underline-offset-4">Trusted Doctors</span>.
              </h1>

              <p className="text-base sm:text-lg text-[#64748B] leading-relaxed max-w-2xl font-normal">
                Book verified outpatient consultations, pathology tests, and health checkup packages at LifeCare Hospital & Clinic Basaveshwar Nagar. Real-time doctor availability with instant booking confirmation.
              </p>

              {/* Fast Search Bar */}
              <form onSubmit={handleSearchSubmit} className="max-w-xl">
                <div className="relative flex items-center shadow-xs rounded-xl bg-[#FFFFFF] border border-[#E2E8F0] focus-within:ring-2 focus-within:ring-[#2563EB] focus-within:border-[#2563EB] overflow-hidden">
                  <div className="pl-4 text-[#64748B]">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search doctor name, gynecology, pediatrics, general physician..."
                    className="w-full py-3.5 pl-3 pr-28 text-sm text-[#0F172A] placeholder-[#64748B] bg-transparent focus:outline-none"
                  />
                  <div className="absolute right-1.5">
                    <Button type="submit" size="sm">
                      Find Doctor
                    </Button>
                  </div>
                </div>
              </form>

              {/* CTAs & Quick Info */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/book">
                  <Button size="lg" className="shadow-md">
                    <Calendar className="w-5 h-5 mr-1" />
                    Book an Appointment
                  </Button>
                </Link>
                <Link to="/services">
                  <Button variant="outline" size="lg">
                    Explore Our Services
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>

              {/* Key Trust Signals */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-[#E2E8F0]">
                <div>
                  <p className="text-2xl font-bold text-[#2563EB]">100%</p>
                  <p className="text-xs text-[#64748B] font-medium">Verified Doctor Credentials</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#2563EB]">Live</p>
                  <p className="text-xs text-[#64748B] font-medium">Real-Time Slot Engine</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[#2563EB]">0 Wait</p>
                  <p className="text-xs text-[#64748B] font-medium">Instant Reference ID</p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Card with Clinic Badge & Next Available Slot Teaser */}
            <div className="lg:col-span-5">
              <div className="bg-[#FFFFFF] rounded-2xl shadow-sm border border-[#E2E8F0] p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
                  <div className="flex items-center gap-3">
                    <img
                      src="/assets/aistudio/Glossy_LifeCare_Healthcare_Logo__1__87cd2d7a.png"
                      alt="LifeCare Healthcare Logo"
                      className="w-12 h-12 rounded-xl object-contain p-1 border border-[#E2E8F0] shadow-xs"
                    />
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A]">LifeCare Hospital</h3>
                      <p className="text-xs text-[#64748B]">Basaveshwar Nagar Branch</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Open Today
                  </span>
                </div>

                <div className="space-y-3 text-xs text-[#0F172A]/90">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#2563EB] shrink-0 mt-0.5" />
                    <span>
                      {VERIFIED_CLINIC_CONFIG.address.line1}, {VERIFIED_CLINIC_CONFIG.address.line2}, {VERIFIED_CLINIC_CONFIG.address.suburb} - 560079
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>Monday - Saturday: 08:00 AM - 08:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <PhoneCall className="w-4 h-4 text-[#2563EB] shrink-0" />
                    <span>OPD Assistance: {VERIFIED_CLINIC_CONFIG.contacts.centralHelpline}</span>
                  </div>
                </div>

                {/* Quick Doctor Preview */}
                <div className="bg-[#F8FAFC] rounded-xl p-4 border border-[#E2E8F0] space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#64748B] uppercase tracking-wider">
                      Featured Specialist
                    </span>
                    <span className="text-xs font-semibold text-[#2563EB]">Slots Open Today</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1594824813580-c0b8fa7c268c?auto=format&fit=crop&w=150&q=80"
                      alt="Dr. Swagatha Mukherjee"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-[#0F172A]">Dr. Swagatha Mukherjee</h4>
                      <p className="text-xs text-[#64748B]">MBBS, DGO • 14 Years Exp</p>
                      <p className="text-xs font-medium text-[#2563EB]">Obstetrics & Gynecology</p>
                    </div>
                  </div>
                </div>

                <Link to="/book" className="block">
                  <Button className="w-full justify-center">
                    Proceed to Slot Booking
                  </Button>
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3-Step Simple Booking Explanation */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
            How Online Appointment Booking Works
          </h2>
          <p className="text-[#64748B] mt-2 text-sm">
            Reserve your consultation slot in under 2 minutes with guaranteed scheduling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E2E8F0] shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-[#2563EB] text-white font-bold flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-2">Select Doctor or Service</h3>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Choose from verified specialists in General Medicine, Gynecology, Pediatrics, or select a diagnostic procedure.
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E2E8F0] shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-[#2563EB] text-white font-bold flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-2">Pick an Available Date & Slot</h3>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Our scheduling engine checks live doctor hours, eliminating double-bookings and wait-time surprises.
            </p>
          </div>

          <div className="bg-[#FFFFFF] p-6 rounded-xl border border-[#E2E8F0] shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-[#2563EB] text-white font-bold flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-[#0F172A] mb-2">Instant Booking Reference</h3>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Receive your unique reference number, SMS/email confirmation, and direct directions to the hospital.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Verified Doctors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#2563EB] mb-1">
              <Award className="w-4 h-4 text-[#2563EB]" />
              Verified Medical Panel
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
              Doctors Consulting at Basaveshwar Nagar
            </h2>
            <p className="text-[#64748B] text-sm mt-1">
              All credentials and consultation timings verified with clinic administration.
            </p>
          </div>
          <Link to="/doctors">
            <Button variant="outline" size="sm">
              View All Doctors
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {doctors.slice(0, 3).map((doc) => (
            <div
              key={doc.id}
              className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={doc.photoUrl}
                    alt={doc.name}
                    className="w-16 h-16 rounded-xl object-cover border border-[#E2E8F0] shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-bold text-[#0F172A]">{doc.name}</h3>
                    <p className="text-xs font-semibold text-[#2563EB]">{doc.specialityName}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{doc.qualifications}</p>
                    <p className="text-xs text-[#64748B] mt-0.5">{doc.experienceYears}+ Years Clinical Experience</p>
                  </div>
                </div>

                <p className="text-xs text-[#0F172A]/80 line-clamp-2 leading-relaxed mb-4">
                  {doc.about}
                </p>

                <div className="flex items-center justify-between text-xs py-2.5 px-3 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0] mb-4">
                  <span className="text-[#64748B]">Consultation Fee:</span>
                  <span className="font-bold text-[#0F172A]">₹{doc.consultationFee}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-[#E2E8F0]">
                <Link to={`/book?doctorId=${doc.id}`} className="flex-1">
                  <Button size="sm" className="w-full">
                    Book Appointment
                  </Button>
                </Link>
                <Link to={`/doctors/${doc.id}`}>
                  <Button variant="outline" size="sm">
                    Profile
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Verified Clinic Services & Diagnostics */}
      <section className="bg-[#FFFFFF] py-16 border-y border-[#E2E8F0]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#2563EB] mb-1 block">
                Comprehensive Outpatient Care
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                Clinical Services & Health Packages
              </h2>
            </div>
            <Link to="/services">
              <Button variant="outline" size="sm">
                View All Services
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.slice(0, 4).map((service) => (
              <div
                key={service.id}
                className="bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center mb-3">
                    <Activity className="w-5 h-5 text-[#2563EB]" />
                  </div>
                  <h3 className="text-sm font-bold text-[#0F172A] mb-1">{service.name}</h3>
                  <p className="text-xs text-[#2563EB] font-medium mb-2">{service.specialityName}</p>
                  <p className="text-xs text-[#64748B] leading-relaxed mb-4 line-clamp-3">
                    {service.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs py-2 border-t border-[#E2E8F0] mb-3">
                    <span className="text-[#64748B]">Duration: {service.durationMinutes} mins</span>
                    <span className="font-bold text-[#0F172A]">₹{service.price}</span>
                  </div>
                  <Link to={`/book?serviceId=${service.id}`} className="block">
                    <Button variant="outline" size="sm" className="w-full">
                      Book This Service
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Clinic Branch Location & Google Maps Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Details */}
          <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-[#2563EB] text-xs font-semibold border border-blue-200 mb-4">
                <CheckCircle2 className="w-4 h-4 text-[#2563EB]" />
                <span>Verified Google Maps Location</span>
              </div>
              <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight mb-2">
                Visit LifeCare Hospital Basaveshwar Nagar
              </h2>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Conveniently located on Dr. M.C. Modi Hospital Road, easily accessible from West of Chord Road, Rajajinagar, and Mahalakshmi Layout.
              </p>
            </div>

            <div className="space-y-4 text-sm text-[#0F172A]">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#0F172A]">{VERIFIED_CLINIC_CONFIG.address.line1}</p>
                  <p className="text-[#64748B]">{VERIFIED_CLINIC_CONFIG.address.line2}</p>
                  <p className="text-[#64748B]">{VERIFIED_CLINIC_CONFIG.address.landmark}</p>
                  <p className="text-[#64748B]">{VERIFIED_CLINIC_CONFIG.address.city}, {VERIFIED_CLINIC_CONFIG.address.state} - {VERIFIED_CLINIC_CONFIG.address.postalCode}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#0F172A]">Operating Hours</p>
                  <p className="text-[#64748B]">Monday - Saturday: 08:00 AM - 08:00 PM</p>
                  <p className="text-[#64748B]">Sunday: 08:00 AM - 01:00 PM (OPD & Diagnostics)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <PhoneCall className="w-5 h-5 text-[#2563EB] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#0F172A]">Contact Lines</p>
                  <p className="text-[#64748B]">Central Helpline: {VERIFIED_CLINIC_CONFIG.contacts.centralHelpline}</p>
                  <p className="text-[#64748B]">Direct Branch: {VERIFIED_CLINIC_CONFIG.contacts.branchDirectPhone}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={VERIFIED_CLINIC_CONFIG.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold text-sm shadow-xs transition-colors"
              >
                <span>Get Driving Directions</span>
                <ExternalLink className="w-4 h-4" />
              </a>
              <Link to="/about">
                <Button variant="outline" size="md">
                  View Branch Facilities
                </Button>
              </Link>
            </div>
          </div>

          {/* Interactive Map Embed */}
          <div className="lg:col-span-7 h-80 lg:h-auto min-h-[350px] bg-[#F8FAFC] relative">
            <iframe
              title="LifeCare Hospital Basaveshwar Nagar Google Map"
              src={VERIFIED_CLINIC_CONFIG.embedMapUrl}
              className="w-full h-full border-0 absolute inset-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </div>
  );
}
