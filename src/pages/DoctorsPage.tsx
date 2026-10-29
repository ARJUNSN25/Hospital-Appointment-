import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Calendar, Award, Globe, Stethoscope, ChevronRight, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/common/UI';

export default function DoctorsPage() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const initialSpeciality = searchParams.get('speciality') || 'all';

  const [search, setSearch] = useState(initialSearch);
  const [selectedSpeciality, setSelectedSpeciality] = useState(initialSpeciality);
  const [sortBy, setSortBy] = useState<'experience' | 'fee-asc' | 'fee-desc' | 'name'>('experience');

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => api.getDoctors()
  });

  const specialities = [
    { id: 'all', label: 'All Specialities' },
    { id: 'spec-gynecology', label: 'Gynecology & Obstetrics' },
    { id: 'spec-general-medicine', label: 'General Medicine' },
    { id: 'spec-pediatrics', label: 'Pediatrics' },
    { id: 'spec-orthopedics', label: 'Orthopedics' },
    { id: 'spec-dermatology', label: 'Dermatology' }
  ];

  const filteredDoctors = useMemo(() => {
    return doctors
      .filter((doc) => {
        const matchesSpec = selectedSpeciality === 'all' || doc.specialityId === selectedSpeciality;
        const q = search.toLowerCase();
        const matchesSearch =
          doc.name.toLowerCase().includes(q) ||
          doc.specialityName.toLowerCase().includes(q) ||
          doc.qualifications.toLowerCase().includes(q) ||
          doc.languages.some((l) => l.toLowerCase().includes(q));
        return matchesSpec && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'experience') return b.experienceYears - a.experienceYears;
        if (sortBy === 'fee-asc') return a.consultationFee - b.consultationFee;
        if (sortBy === 'fee-desc') return b.consultationFee - a.consultationFee;
        return a.name.localeCompare(b.name);
      });
  }, [doctors, search, selectedSpeciality, sortBy]);

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-50 text-sky-800 text-xs font-semibold border border-sky-200 mb-2">
          <Stethoscope className="w-3.5 h-3.5" />
          Verified Branch Consultants
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Find a Doctor at Apollo Clinic Basaveshwar Nagar
        </h1>
        <p className="text-slate-600 text-sm mt-1 max-w-3xl">
          Browse our verified medical specialists consulting in Basaveshwar Nagar. Check available working days, experience, and consultation fees.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by doctor name, qualification or language..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-none"
            />
          </div>

          <div className="md:col-span-3">
            <select
              value={selectedSpeciality}
              onChange={(e) => setSelectedSpeciality(e.target.value)}
              className="w-full py-2.5 px-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-none bg-white"
            >
              {specialities.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2.5 px-3 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-none bg-white"
            >
              <option value="experience">Sort by Experience (High to Low)</option>
              <option value="fee-asc">Sort by Fee (Low to High)</option>
              <option value="fee-desc">Sort by Fee (High to Low)</option>
              <option value="name">Sort by Doctor Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Quick speciality chips */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
          {specialities.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSpeciality(s.id)}
              className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                selectedSpeciality === s.id
                  ? 'bg-sky-700 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No doctors match your search</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            Try adjusting your search criteria or clear your speciality filter to view all available medical specialists.
          </p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setSelectedSpeciality('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDoctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start gap-4 mb-4">
                  <img
                    src={doc.photoUrl}
                    alt={doc.name}
                    className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{doc.name}</h3>
                    <p className="text-xs font-semibold text-sky-700 mt-0.5">{doc.specialityName}</p>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{doc.qualifications}</p>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      <span>{doc.experienceYears}+ Years Clinical Exp.</span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                  {doc.about}
                </p>

                {/* Languages spoken */}
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                  <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{doc.languages.join(', ')}</span>
                </div>

                {/* Consultation days badges */}
                <div className="mb-4">
                  <span className="text-[11px] font-semibold text-slate-500 block mb-1">
                    Consulting Days:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                      const isAvailable = doc.availableDays.includes(dayIdx);
                      return (
                        <span
                          key={dayIdx}
                          className={`px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                            isAvailable
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-slate-100 text-slate-400 opacity-60'
                          }`}
                        >
                          {dayNames[dayIdx]}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Consultation Fee */}
                <div className="flex items-center justify-between text-xs py-2 px-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                  <span className="text-slate-500">Consultation Fee</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">₹{doc.consultationFee}</span>
                    <span className="text-[10px] text-emerald-700 block font-medium">Verified by Clinic</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
                <Link to={`/book?doctorId=${doc.id}`} className="flex-1">
                  <Button size="sm" className="w-full">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Book Slot
                  </Button>
                </Link>
                <Link to={`/doctors/${doc.id}`}>
                  <Button variant="outline" size="sm">
                    Profile
                    <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
