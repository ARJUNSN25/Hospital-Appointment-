import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, Search, ArrowRight, ShieldCheck, Clock, MapPin, 
  Stethoscope, Activity, Heart, Award, CheckCircle2, ChevronRight,
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
    <div className="space-y-16 lg:space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-sky-50/70 via-white to-slate-50 pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headlines & Search */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-100/80 text-sky-800 text-xs font-semibold border border-sky-200">
                <ShieldCheck className="w-4 h-4 text-sky-700" />
                <span>Verified Branch • Modi Hospital Road, Basaveshwar Nagar</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Compassionate Healthcare, <span className="text-sky-700 underline decoration-teal-400 decoration-4 underline-offset-4">Trusted Doctors</span>.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Book verified outpatient consultations, pathology tests, and health checkup packages at Apollo Clinic Basaveshwar Nagar. Real-time doctor availability with instant booking confirmation.
              </p>

              {/* Fast Search Bar */}
              <form onSubmit={handleSearchSubmit} className="max-w-xl">
                <div className="relative flex items-center shadow-md rounded-xl bg-white border border-slate-300 focus-within:ring-2 focus-within:ring-sky-600 focus-within:border-sky-600 overflow-hidden">
                  <div className="pl-4 text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search doctor name, gynecology, pediatrics, general physician..."
                    className="w-full py-3.5 pl-3 pr-28 text-sm text-slate-800 placeholder-slate-400 focus:outline-none"
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
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-200 text-slate-700">
                <div>
                  <p className="text-2xl font-bold text-sky-800">100%</p>
                  <p className="text-xs text-slate-500 font-medium">Verified Doctor Credentials</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-teal-700">Live</p>
                  <p className="text-xs text-slate-500 font-medium">Real-Time Slot Engine</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-sky-800">0 Wait</p>
                  <p className="text-xs text-slate-500 font-medium">Instant Reference ID</p>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Card with Clinic Badge & Next Available Slot Teaser */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-lg">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Apollo Clinic</h3>
                      <p className="text-xs text-slate-500">Basaveshwar Nagar Branch</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-xs border border-emerald-200 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Open Today
                  </span>
                </div>

                <div className="space-y-3 text-xs text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                    <span>
                      {VERIFIED_CLINIC_CONFIG.address.line1}, {VERIFIED_CLINIC_CONFIG.address.line2}, {VERIFIED_CLINIC_CONFIG.address.suburb} - 560079
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Monday - Saturday: 08:00 AM - 08:00 PM</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>OPD Assistance: {VERIFIED_CLINIC_CONFIG.contacts.centralHelpline}</span>
                  </div>
                </div>

                {/* Quick Doctor Preview */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Featured Specialist
                    </span>
                    <span className="text-xs font-semibold text-emerald-700">Slots Open Today</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1594824813580-c0b8fa7c268c?auto=format&fit=crop&w=150&q=80"
                      alt="Dr. Swagatha Mukherjee"
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Dr. Swagatha Mukherjee</h4>
                      <p className="text-xs text-slate-500">MBBS, DGO • 14 Years Exp</p>
                      <p className="text-xs font-medium text-sky-700">Obstetrics & Gynecology</p>
                    </div>
                  </div>
                </div>

                <Link to="/book" className="block">
                  <Button variant="secondary" className="w-full justify-center">
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
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            How Online Appointment Booking Works
          </h2>
          <p className="text-slate-600 mt-2 text-sm">
            Reserve your consultation slot in under 2 minutes with guaranteed scheduling.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-800 font-bold flex items-center justify-center mb-4">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Select Doctor or Service</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Choose from verified specialists in General Medicine, Gynecology, Pediatrics, or select a diagnostic procedure.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-teal-100 text-teal-800 font-bold flex items-center justify-center mb-4">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Pick an Available Date & Slot</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Our scheduling engine checks live doctor hours, eliminating double-bookings and wait-time surprises.
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-800 font-bold flex items-center justify-center mb-4">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Instant Booking Reference</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Receive your unique reference number, SMS/email confirmation, and direct directions to the clinic.
            </p>
          </div>
        </div>
      </section>

      {/* Featured Verified Doctors */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-sky-700 mb-1">
              <Award className="w-4 h-4" />
              Verified Medical Panel
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Doctors Consulting at Basaveshwar Nagar
            </h2>
            <p className="text-slate-600 text-sm mt-1">
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
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={doc.photoUrl}
                    alt={doc.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{doc.name}</h3>
                    <p className="text-xs font-semibold text-sky-700">{doc.specialityName}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.qualifications}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{doc.experienceYears}+ Years Clinical Experience</p>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-4">
                  {doc.about}
                </p>

                <div className="flex items-center justify-between text-xs py-2.5 px-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                  <span className="text-slate-500">Consultation Fee:</span>
                  <span className="font-bold text-slate-900">₹{doc.consultationFee}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
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
      <section className="bg-slate-50 py-16 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 mb-1 block">
                Comprehensive Outpatient Care
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
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
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="w-9 h-9 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center mb-3">
                    <Activity className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-1">{service.name}</h3>
                  <p className="text-xs text-sky-700 font-medium mb-2">{service.specialityName}</p>
                  <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                    {service.description}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs py-2 border-t border-slate-100 mb-3">
                    <span className="text-slate-500">Duration: {service.durationMinutes} mins</span>
                    <span className="font-bold text-slate-900">₹{service.price}</span>
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
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Details */}
          <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200 mb-4">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Verified Google Maps Location</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                Visit Apollo Clinic Basaveshwar Nagar
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                Conveniently located on Dr. M.C. Modi Hospital Road, easily accessible from West of Chord Road, Rajajinagar, and Mahalakshmi Layout.
              </p>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">{VERIFIED_CLINIC_CONFIG.address.line1}</p>
                  <p>{VERIFIED_CLINIC_CONFIG.address.line2}</p>
                  <p>{VERIFIED_CLINIC_CONFIG.address.landmark}</p>
                  <p>{VERIFIED_CLINIC_CONFIG.address.city}, {VERIFIED_CLINIC_CONFIG.address.state} - {VERIFIED_CLINIC_CONFIG.address.postalCode}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Operating Hours</p>
                  <p>Monday - Saturday: 08:00 AM - 08:00 PM</p>
                  <p>Sunday: 08:00 AM - 01:00 PM (OPD & Diagnostics)</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <PhoneCall className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900">Contact Lines</p>
                  <p>Central Helpline: {VERIFIED_CLINIC_CONFIG.contacts.centralHelpline}</p>
                  <p>Direct Branch: {VERIFIED_CLINIC_CONFIG.contacts.branchDirectPhone}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <a
                href={VERIFIED_CLINIC_CONFIG.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-sky-700 hover:bg-sky-800 text-white font-semibold text-sm shadow-sm transition-colors"
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
          <div className="lg:col-span-7 h-80 lg:h-auto min-h-[350px] bg-slate-100 relative">
            <iframe
              title="Apollo Clinic Basaveshwar Nagar Google Map"
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
