import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, Activity, Clock, ShieldCheck, Calendar, ChevronRight, FileText } from 'lucide-react';
import { api } from '../api/client';
import { Button } from '../components/common/UI';

export default function ServicesPage() {
  const [searchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'all';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => api.getServices()
  });

  const categories = [
    { id: 'all', label: 'All Services' },
    { id: 'consultation', label: 'Doctor Consultations' },
    { id: 'diagnostic', label: 'Diagnostic Tests & USG' },
    { id: 'health-check', label: 'Preventive Health Packages' }
  ];

  const filteredServices = useMemo(() => {
    return services.filter((srv) => {
      const matchesCat = category === 'all' || srv.category === category;
      const q = search.toLowerCase();
      const matchesSearch =
        srv.name.toLowerCase().includes(q) ||
        srv.description.toLowerCase().includes(q) ||
        srv.specialityName.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [services, category, search]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-6">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-800 text-xs font-semibold border border-teal-200 mb-2">
          <Activity className="w-3.5 h-3.5" />
          Verified Clinical & Diagnostic Services
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Services at Apollo Clinic Basaveshwar Nagar
        </h1>
        <p className="text-slate-600 text-sm mt-1 max-w-3xl">
          Multi-specialty outpatient consultations, precision pathology diagnostics, ultrasound, and comprehensive Apollo ProHealth packages under one roof.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search services, ultrasound, ECG, checkups..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-600 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  category === c.id
                    ? 'bg-sky-700 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Service Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-slate-200 p-8">
          <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-900">No services match your criteria</h3>
          <p className="text-sm text-slate-500 mt-1">Try resetting your search or category filter.</p>
          <div className="mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('');
                setCategory('all');
              }}
            >
              Reset Filters
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                    {srv.specialityName}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{srv.durationMinutes} mins</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2 leading-snug">
                  {srv.name}
                </h3>

                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {srv.description}
                </p>

                {srv.preparationInstructions && (
                  <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-[11px] text-amber-900 mb-4 flex items-start gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Prep:</strong> {srv.preparationInstructions}</span>
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between text-xs py-2.5 px-3 bg-slate-50 rounded-lg border border-slate-100 mb-4">
                  <span className="text-slate-500">Service Fee</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 text-sm">₹{srv.price}</span>
                    <span className="text-[10px] text-emerald-700 block font-medium">Verified by Clinic</span>
                  </div>
                </div>

                <Link to={`/book?serviceId=${srv.id}`} className="block">
                  <Button size="sm" className="w-full">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    Book This Service
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
