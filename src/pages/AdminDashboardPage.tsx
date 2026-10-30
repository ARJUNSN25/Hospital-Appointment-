import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, Calendar, Clock, DollarSign, CheckCircle2, XCircle, 
  AlertCircle, Download, Search, Settings, ShieldCheck, Stethoscope, 
  Activity, FileText, Edit, Plus, LogOut, Lock, RefreshCw, 
  TrendingUp, BarChart3, CreditCard, Banknote, Smartphone, ChevronRight, UserCheck,
  Database, ExternalLink, Copy, Check, Printer, Volume2, Megaphone, Eye, EyeOff, Radio
} from 'lucide-react';
import { api } from '../api/client';
import { Button, StatusBadge, Modal } from '../components/common/UI';
import { Appointment, Doctor, ClinicService, AdminAuditLog, ClinicBroadcast } from '../types';
import { ClinicConfig, VERIFIED_CLINIC_CONFIG } from '../config/clinicData';

export default function AdminDashboardPage() {
  // Authentication State
  const [authToken, setAuthToken] = useState<string | null>(() => {
    return sessionStorage.getItem('apollo_admin_token') || null;
  });
  const [currentUser, setCurrentUser] = useState<{ username: string; fullName: string } | null>(() => {
    const saved = sessionStorage.getItem('apollo_admin_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Login Form State - Empty by default (DO NOT display or pre-fill credentials in UI)
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Dashboard Tab
  const [activeTab, setActiveTab] = useState<'live-queue' | 'overview' | 'appointments' | 'doctors' | 'services' | 'broadcast' | 'supabase' | 'settings' | 'audit'>('live-queue');

  // Real-time IST Digital Clock
  const [currentTime, setCurrentTime] = useState<string>(() => {
    return new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true });
  });
  const [currentDateString, setCurrentDateString] = useState<string>(() => {
    return new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true }));
      setCurrentDateString(new Date().toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Live Auto-Refresh Interval: 5000ms (Hyper-Live), 10000ms (Standard), 30000ms, or 0 (Paused)
  const [refreshInterval, setRefreshInterval] = useState<number>(5000);
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    if (refreshInterval === 0) return;
    setCountdown(refreshInterval / 1000);
    const interval = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? refreshInterval / 1000 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  // Active Patient Calling Announcement with Audio Hospital Chime
  const [activeCallAnnouncement, setActiveCallAnnouncement] = useState<{
    patientName: string;
    token: string;
    doctorName: string;
    cabin: string;
    time: string;
  } | null>(null);

  // Web Audio Hospital Chime Tone Generator
  const playHospitalChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, start: number, dur: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };

      // Two-tone hospital chime (D5: 587.33 Hz, A5: 880 Hz)
      playTone(587.33, 0, 0.4);
      playTone(880, 0.25, 0.6);
    } catch {
      // Audio autoplay policy fallback
    }
  };

  const handleCallPatient = (apt: Appointment) => {
    playHospitalChime();
    const cabin = apt.doctorId === 'doc-swagatha' ? 'Cabin 1 (Gynecology)' : apt.doctorId === 'doc-dhershana' ? 'Cabin 2 (Gynecology)' : 'Cabin 3 (General OPD)';
    setActiveCallAnnouncement({
      patientName: apt.patientName,
      token: apt.bookingReference,
      doctorName: apt.doctorName,
      cabin,
      time: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })
    });

    if (apt.status === 'confirmed' || apt.status === 'waiting') {
      handleQuickStatusChange(apt.id, 'in-consultation');
    }
  };

  // Printable OPD Token & Slip State
  const [printApt, setPrintApt] = useState<Appointment | null>(null);

  // Supabase Sync States
  const [isSyncingSupabase, setIsSyncingSupabase] = useState(false);
  const [supabaseSyncMessage, setSupabaseSyncMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  // Filter states for appointments
  const [aptStatusFilter, setAptStatusFilter] = useState('all');
  const [aptSearch, setAptSearch] = useState('');

  // Status edit modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [newStatus, setNewStatus] = useState<string>('confirmed');
  const [adminNotes, setAdminNotes] = useState('');

  // Doctor edit modal state
  const [doctorModalOpen, setDoctorModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [doctorFee, setDoctorFee] = useState<number>(600);
  const [doctorActive, setDoctorActive] = useState<boolean>(true);
  const [doctorOpdStatus, setDoctorOpdStatus] = useState<'available' | 'in-consultation' | 'break' | 'off-duty'>('available');

  // Add New Doctor modal
  const [addDoctorModalOpen, setAddDoctorModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpeciality, setNewDocSpeciality] = useState('General & Internal Medicine');
  const [newDocQualifications, setNewDocQualifications] = useState('MBBS, MD');
  const [newDocFee, setNewDocFee] = useState(500);

  // Add New Service modal
  const [addServiceModalOpen, setAddServiceModalOpen] = useState(false);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceCategory, setNewServiceCategory] = useState<'consultation' | 'diagnostic' | 'health-check' | 'procedure'>('diagnostic');
  const [newServicePrice, setNewServicePrice] = useState(500);
  const [newServiceDuration, setNewServiceDuration] = useState(20);

  // Broadcast Notice Modal
  const [broadcastModalOpen, setBroadcastModalOpen] = useState(false);
  const [broadcastMessageInput, setBroadcastMessageInput] = useState('');
  const [broadcastTypeInput, setBroadcastTypeInput] = useState<'info' | 'warning' | 'urgent'>('info');
  const [broadcastActiveInput, setBroadcastActiveInput] = useState(true);

  // Walk-In appointment modal
  const [walkinModalOpen, setWalkinModalOpen] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinAge, setWalkinAge] = useState('');
  const [walkinGender, setWalkinGender] = useState<'male' | 'female' | 'other'>('male');
  const [walkinDoctorId, setWalkinDoctorId] = useState('doc-rajesh');
  const [walkinServiceId, setWalkinServiceId] = useState('srv-gen-consult');
  const [walkinPaymentMode, setWalkinPaymentMode] = useState('cash-at-clinic');
  const [isSubmittingWalkin, setIsSubmittingWalkin] = useState(false);

  // Clinic settings state
  const [settingsForm, setSettingsForm] = useState<ClinicConfig>({ ...VERIFIED_CLINIC_CONFIG });
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  // Live Queries with Configurable Auto-Refresh Interval
  const { data: stats, refetch: refetchStats, isFetching: isRefreshingStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.getAdminStats(),
    enabled: !!authToken,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false
  });

  const { data: appointments = [], refetch: refetchAppointments } = useQuery({
    queryKey: ['admin-appointments', aptStatusFilter, aptSearch],
    queryFn: () => api.getAdminAppointments({
      status: aptStatusFilter === 'all' ? undefined : aptStatusFilter,
      search: aptSearch.trim() || undefined
    }),
    enabled: !!authToken,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false
  });

  const { data: doctors = [], refetch: refetchDoctors } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: () => api.getDoctors(),
    enabled: !!authToken,
    refetchInterval: refreshInterval > 0 ? refreshInterval : false
  });

  const { data: services = [], refetch: refetchServices } = useQuery({
    queryKey: ['admin-services'],
    queryFn: () => api.getServices(),
    enabled: !!authToken
  });

  const { data: broadcast, refetch: refetchBroadcast } = useQuery({
    queryKey: ['clinic-broadcast'],
    queryFn: () => api.getBroadcast(),
    enabled: !!authToken,
    refetchInterval: 10000
  });

  const { data: auditLogs = [], refetch: refetchAudit } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => api.getAdminAuditLogs(),
    enabled: !!authToken && activeTab === 'audit',
    refetchInterval: 8000
  });

  const { data: supabaseStatus, refetch: refetchSupabaseStatus, isFetching: isCheckingSupabase } = useQuery({
    queryKey: ['supabase-status'],
    queryFn: () => api.getSupabaseStatus(),
    enabled: !!authToken && activeTab === 'supabase'
  });

  const handleSyncToSupabase = async () => {
    setIsSyncingSupabase(true);
    setSupabaseSyncMessage(null);
    try {
      const res = await api.syncAllToSupabase();
      setSupabaseSyncMessage(`Sync dispatched to Supabase (Project: ${res.projectId}): ${res.syncedCount}/${res.total} appointments synced.`);
      refetchSupabaseStatus();
    } catch (err: any) {
      setSupabaseSyncMessage(`Sync notice: ${err.message || 'Error communicating with Supabase API'}`);
    } finally {
      setIsSyncingSupabase(false);
    }
  };

  // Handle Login Authentication
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const response = await api.adminLogin({
        username: loginUsername.trim(),
        password: loginPassword.trim()
      });

      sessionStorage.setItem('apollo_admin_token', response.token);
      sessionStorage.setItem('apollo_admin_user', JSON.stringify(response.user));
      setAuthToken(response.token);
      setCurrentUser(response.user);
    } catch (err: any) {
      setLoginError(err.message || 'Invalid credentials. Access restricted to authorized personnel.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    sessionStorage.removeItem('apollo_admin_token');
    sessionStorage.removeItem('apollo_admin_user');
    setAuthToken(null);
    setCurrentUser(null);
    setLoginUsername('');
    setLoginPassword('');
  };

  // Status update
  const handleUpdateStatusSubmit = async () => {
    if (!selectedApt) return;
    try {
      await api.updateAppointmentStatus(selectedApt.id, newStatus, adminNotes);
      setStatusModalOpen(false);
      refetchAppointments();
      refetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Quick 1-click status update
  const handleQuickStatusChange = async (aptId: string, targetStatus: string) => {
    try {
      await api.updateAppointmentStatus(aptId, targetStatus, `Triage status updated to ${targetStatus}`);
      refetchAppointments();
      refetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to update status');
    }
  };

  // Doctor fee/availability update
  const handleDoctorUpdateSubmit = async () => {
    if (!editingDoctor) return;
    try {
      await api.updateDoctor(editingDoctor.id, {
        consultationFee: doctorFee,
        active: doctorActive,
        opdStatus: doctorOpdStatus
      });
      setDoctorModalOpen(false);
      refetchDoctors();
    } catch (err: any) {
      alert(err.message || 'Failed to update doctor');
    }
  };

  // Quick doctor OPD status change
  const handleQuickDoctorOpdChange = async (docId: string, status: 'available' | 'in-consultation' | 'break' | 'off-duty') => {
    try {
      await api.updateDoctor(docId, { opdStatus: status });
      refetchDoctors();
      refetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to update doctor OPD status');
    }
  };

  // Add New Doctor Submit
  const handleAddDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addDoctor({
        name: newDocName.trim(),
        specialityId: 'spec-general-medicine',
        specialityName: newDocSpeciality.trim(),
        qualifications: newDocQualifications.trim(),
        experienceYears: 10,
        languages: ['English', 'Kannada', 'Hindi'],
        consultationFee: Number(newDocFee),
        isFeeConfirmed: true,
        availableDays: [1, 2, 3, 4, 5, 6],
        active: true,
        opdStatus: 'available',
        photoUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80',
        about: 'Consultant physician at Apollo Clinic Basaveshwar Nagar.'
      });
      setAddDoctorModalOpen(false);
      setNewDocName('');
      refetchDoctors();
      refetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to add doctor');
    }
  };

  // Add New Service Submit
  const handleAddServiceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addService({
        name: newServiceName.trim(),
        category: newServiceCategory,
        price: Number(newServicePrice),
        durationMinutes: Number(newServiceDuration),
        specialityId: 'spec-general-medicine',
        specialityName: 'Diagnostic & Pathology',
        description: 'Apollo Clinic Diagnostic Service',
        isActive: true,
        isPriceConfirmed: true
      });
      setAddServiceModalOpen(false);
      setNewServiceName('');
      refetchServices();
      refetchStats();
    } catch (err: any) {
      alert(err.message || 'Failed to add diagnostic service');
    }
  };

  // Update Broadcast Submit
  const handleBroadcastSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateBroadcast({
        message: broadcastMessageInput.trim(),
        type: broadcastTypeInput,
        active: broadcastActiveInput
      });
      setBroadcastModalOpen(false);
      refetchBroadcast();
    } catch (err: any) {
      alert(err.message || 'Failed to update broadcast notice');
    }
  };

  // Walk-in booking submission
  const handleWalkinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingWalkin(true);
    try {
      const created = await api.createWalkinAppointment({
        patientName: walkinName.trim() || 'Walk-in Patient',
        patientPhone: walkinPhone.trim() || '9800000000',
        doctorId: walkinDoctorId,
        serviceId: walkinServiceId,
        paymentMode: walkinPaymentMode
      });
      setWalkinModalOpen(false);
      setWalkinName('');
      setWalkinPhone('');
      setWalkinAge('');
      refetchAppointments();
      refetchStats();
      // Auto open print token for immediate physical slip issuance
      if (created) {
        setPrintApt(created);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to register walk-in');
    } finally {
      setIsSubmittingWalkin(false);
    }
  };

  const handleSaveClinicSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateClinicSettings(settingsForm);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update settings');
    }
  };

  // =========================================================================
  // =========================================================================
  // RENDER: UNAPPROVED / LOGIN VIEW (STRICTLY CONFIDENTIAL - NO CREDENTIAL HINTS)
  // =========================================================================
  if (!authToken) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 sm:px-6 py-12 bg-[#F8FAFC] text-[#0F172A]">
        <div className="max-w-md w-full bg-[#FFFFFF] rounded-3xl border border-[#E2E8F0] shadow-sm p-8 space-y-6">
          <div className="text-center space-y-2">
            <img
              src="/assets/aistudio/Glossy_LifeCare_Healthcare_Logo__1__87cd2d7a.png"
              alt="LifeCare Hospital"
              className="h-16 mx-auto object-contain mb-2"
            />
            <div className="w-12 h-12 rounded-2xl bg-[#0F172A] text-[#FFFFFF] flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-6 h-6 text-[#FFFFFF]" />
            </div>
            <h1 className="text-2xl font-extrabold text-[#0F172A] tracking-tight">
              Staff & Administrator Portal
            </h1>
            <p className="text-xs text-[#64748B] font-medium">
              LifeCare Hospital • Basaveshwar Nagar Branch • Clinical Operations Access
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Administrator Username
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                placeholder="Enter administrator username"
                className="w-full py-2.5 px-3 border border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                Security Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="Enter security password"
                  className="w-full py-2.5 px-3 pr-10 border border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] rounded-xl text-sm focus:ring-2 focus:ring-[#2563EB] focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-[#64748B] hover:text-[#0F172A]"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full justify-center shadow-sm py-2.5"
              disabled={isLoggingIn || !loginUsername || !loginPassword}
            >
              {isLoggingIn ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Verifying Credentials...
                </span>
              ) : (
                'Sign In to Admin Operations'
              )}
            </Button>
          </form>

          <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
              Role-Based Access Control
            </span>
            <span>Basaveshwar Nagar, Bengaluru</span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: AUTHENTICATED ADVANCED LIVE DASHBOARD & COMMAND CENTER
  // =========================================================================
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 bg-[#F8FAFC] text-[#0F172A]">
      
      {/* Real-time Broadcast Notice Bar if active */}
      {broadcast && broadcast.active && (
        <div className={`p-3.5 rounded-xl border flex items-center justify-between text-xs transition-all shadow-xs ${
          broadcast.type === 'urgent'
            ? 'bg-rose-50 border-rose-200 text-rose-900'
            : broadcast.type === 'warning'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : 'bg-sky-50 border-sky-200 text-sky-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <Megaphone className={`w-4 h-4 shrink-0 ${
              broadcast.type === 'urgent' ? 'text-rose-600 animate-bounce' : 'text-sky-600'
            }`} />
            <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded bg-white/70 border border-current">
              Clinic Broadcast
            </span>
            <span className="font-semibold">{broadcast.message}</span>
          </div>
          <button
            onClick={() => {
              setBroadcastMessageInput(broadcast.message);
              setBroadcastTypeInput(broadcast.type);
              setBroadcastActiveInput(broadcast.active);
              setBroadcastModalOpen(true);
            }}
            className="text-[11px] underline font-bold shrink-0 hover:opacity-80"
          >
            Edit Notice
          </button>
        </div>
      )}

      {/* Real-time Patient Calling Chime Announcement Banner */}
      {activeCallAnnouncement && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg flex items-center justify-between animate-fade-in border border-emerald-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white shrink-0">
              <Volume2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded">
                  Now Calling Patient
                </span>
                <span className="text-xs text-emerald-100 font-mono">{activeCallAnnouncement.time}</span>
              </div>
              <h2 className="text-base sm:text-lg font-extrabold tracking-tight mt-0.5">
                Token #{activeCallAnnouncement.token}: {activeCallAnnouncement.patientName} → {activeCallAnnouncement.cabin}
              </h2>
              <p className="text-xs text-emerald-100">
                Consultant: {activeCallAnnouncement.doctorName}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={playHospitalChime}
              className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-xs font-semibold backdrop-blur-xs transition-colors flex items-center gap-1"
              title="Repeat Audio Chime"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Chime</span>
            </button>
            <button
              onClick={() => setActiveCallAnnouncement(null)}
              className="p-1.5 rounded-lg bg-black/20 hover:bg-black/30 text-white/90 transition-colors text-xs font-bold px-2.5"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Top Operations Command Bar with Live Pulse & Time */}
      <div className="bg-[#0F172A] rounded-2xl p-5 text-[#FFFFFF] flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md border border-slate-800">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Live OPD Feed Active
            </span>
            <span className="text-[#64748B]">•</span>
            <span className="text-xs text-slate-300 font-semibold font-mono">
              🕒 {currentTime} ({currentDateString})
            </span>
            <span className="text-[#64748B]">•</span>
            <span className="text-xs text-[#E2E8F0] font-semibold">
              Admin: {currentUser?.username || 'Arjun'}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#FFFFFF] flex items-center gap-2">
            LifeCare Hospital Operations Command Center
          </h1>
          <p className="text-xs text-slate-300/80">
            Basaveshwar Nagar, Bengaluru • Real-time patient triage, queue announcements, and revenue tracking
          </p>
        </div>

        {/* Live Controls & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Auto Refresh Interval Selector */}
          <div className="flex items-center bg-[#3E352F] rounded-lg p-1 border border-[#4E433C] text-xs">
            <span className="px-2 text-[#D8CEC4] font-medium hidden sm:inline">Refresh:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-transparent text-[#FFFFFF] font-semibold text-xs border-none focus:outline-none cursor-pointer py-1 pr-1"
            >
              <option value={5000} className="bg-[#0F172A] text-[#FFFFFF]">5s (Hyper-Live)</option>
              <option value={10000} className="bg-[#0F172A] text-[#FFFFFF]">10s (Standard)</option>
              <option value={30000} className="bg-[#0F172A] text-[#FFFFFF]">30s</option>
              <option value={0} className="bg-[#0F172A] text-[#FFFFFF]">Paused</option>
            </select>
            {refreshInterval > 0 && (
              <span className="px-2 text-[10px] text-emerald-400 font-mono font-bold">
                {countdown}s
              </span>
            )}
          </div>

          {/* Sync Button */}
          <button
            onClick={() => {
              refetchStats();
              refetchAppointments();
              refetchDoctors();
              refetchBroadcast();
            }}
            title="Refresh Live Data Feed"
            className="p-2 rounded-lg bg-[#3E352F] hover:bg-[#4E433C] text-[#D8CEC4] hover:text-[#FFFFFF] transition-colors border border-[#4E433C] flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStats ? 'animate-spin text-[#FFFFFF]' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          {/* Walk-in Booking Button */}
          <Button
            size="sm"
            onClick={() => setWalkinModalOpen(true)}
            className="text-xs font-bold shadow-md bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF]"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Express Walk-In
          </Button>

          {/* Broadcast Message Trigger */}
          <button
            onClick={() => {
              setBroadcastMessageInput(broadcast?.message || 'Apollo Clinic OPD is active. Walk-in consultations open.');
              setBroadcastTypeInput(broadcast?.type || 'info');
              setBroadcastActiveInput(broadcast?.active ?? true);
              setBroadcastModalOpen(true);
            }}
            className="p-2 rounded-lg bg-[#3E352F] hover:bg-[#4E433C] text-[#D8CEC4] border border-[#4E433C] text-xs font-semibold flex items-center gap-1"
            title="Broadcast Alert to Clinic"
          >
            <Megaphone className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden lg:inline">Notice</span>
          </button>

          {/* Export CSV */}
          <a
            href={api.getExportCsvUrl()}
            download="apollo_clinic_appointments.csv"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#3E352F] hover:bg-[#4E433C] text-[#D8CEC4] text-xs font-semibold border border-[#4E433C] transition-colors"
            title="Download CSV of all appointments"
          >
            <Download className="w-3.5 h-3.5 text-[#D8CEC4]" />
            <span className="hidden sm:inline">CSV</span>
          </a>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-xs font-semibold border border-rose-800 transition-colors"
            title="Log out from admin session"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E2E8F0] pb-2">
        {[
          { id: 'live-queue', label: '⚡ Live OPD Queue', icon: Activity },
          { id: 'overview', label: '📊 Executive Analytics', icon: BarChart3 },
          { id: 'appointments', label: '📅 All Appointments', icon: Calendar },
          { id: 'doctors', label: '🩺 Doctor Cabins & Fees', icon: Stethoscope },
          { id: 'services', label: '🔬 Diagnostic Services', icon: FileText },
          { id: 'broadcast', label: '📢 Clinic Broadcast', icon: Megaphone },
          { id: 'supabase', label: '🗄️ Supabase Cloud DB', icon: Database },
          { id: 'settings', label: '⚙️ Branch Settings', icon: Settings },
          { id: 'audit', label: '🛡️ Audit Trail', icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#2563EB] text-[#FFFFFF] shadow-xs'
                  : 'text-[#64748B] hover:bg-[#FFFFFF] hover:text-[#0F172A]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =================================================================== */}
      {/* TAB 1: ⚡ REAL-TIME OPD WAITING ROOM & QUEUE BOARD */}
      {/* =================================================================== */}
      {activeTab === 'live-queue' && (
        <div className="space-y-6">
          {/* Real-time Queue Status Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Today's Bookings</span>
              <p className="text-2xl font-black text-[#0F172A] mt-1">{stats?.todayAppointments ?? 0}</p>
              <span className="text-[10px] text-[#64748B]">Total registered</span>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block">Waiting in Lobby</span>
              <p className="text-2xl font-black text-[#2563EB] mt-1">{stats?.waitingCount ?? 0}</p>
              <span className="text-[10px] text-[#64748B]">Checked-in & seated</span>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-[11px] font-bold text-[#0F172A] uppercase tracking-wider block">In Consultation</span>
              <p className="text-2xl font-black text-[#0F172A] mt-1">{stats?.inConsultationCount ?? 0}</p>
              <span className="text-[10px] text-[#64748B]">Currently in cabin</span>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Completed</span>
              <p className="text-2xl font-black text-emerald-800 mt-1">{stats?.completedAppointments ?? 0}</p>
              <span className="text-[10px] text-emerald-700">Discharged / Consulted</span>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-[11px] font-bold text-[#2563EB] uppercase tracking-wider block">Estimated Today</span>
              <p className="text-2xl font-black text-[#0F172A] mt-1">₹{(stats?.todayRevenueEstimated ?? 0).toLocaleString()}</p>
              <span className="text-[10px] text-[#64748B]">OPD Revenue</span>
            </div>

            <div className="bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
              <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Specialists on Duty</span>
              <p className="text-2xl font-black text-[#2563EB] mt-1">{stats?.activeDoctorsCount ?? 3}</p>
              <span className="text-[10px] text-[#64748B]">Active roster</span>
            </div>
          </div>

          {/* Quick Doctor Cabin Ticker */}
          <div className="bg-[#FFFFFF] p-4 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#2563EB]" />
                Live OPD Cabin Roster & Status
              </h3>
              <span className="text-[11px] text-[#64748B]">Click to change consultant live status</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {doctors.map((doc, idx) => {
                const currentOpd = doc.opdStatus || (doc.active ? 'available' : 'off-duty');
                const cabinNum = idx + 1;
                return (
                  <div key={doc.id} className="p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-[#2563EB]/15 text-[#2563EB] flex items-center justify-center font-bold text-xs">
                        C{cabinNum}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-[#0F172A]">{doc.name}</p>
                        <p className="text-[11px] text-[#64748B]">{doc.specialityName}</p>
                      </div>
                    </div>

                    <select
                      value={currentOpd}
                      onChange={(e) => handleQuickDoctorOpdChange(doc.id, e.target.value as any)}
                      className={`text-[11px] font-bold py-1 px-2 rounded-lg border focus:outline-none cursor-pointer ${
                        currentOpd === 'available'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : currentOpd === 'in-consultation'
                          ? 'bg-[#2563EB]/15 text-[#2563EB] border-[#2563EB]/30'
                          : currentOpd === 'break'
                          ? 'bg-amber-50 text-amber-900 border-amber-300'
                          : 'bg-[#E2E8F0] text-[#0F172A] border-[#DCD3C7]'
                      }`}
                    >
                      <option value="available">🟢 Available (Cabin {cabinNum})</option>
                      <option value="in-consultation">🔵 In Consultation</option>
                      <option value="break">🟡 Break (15 min)</option>
                      <option value="off-duty">⚫ Off Duty</option>
                    </select>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Patient Queue List with Instant One-Click Actions */}
          <div className="bg-[#FFFFFF] rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden space-y-4 p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-[#0F172A] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#2563EB]" />
                  Active OPD Queue Management
                </h3>
                <p className="text-xs text-[#64748B]">
                  Call patients, update waiting room stage, issue printable token slips, and collect consultation fees
                </p>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#64748B] absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={aptSearch}
                    onChange={(e) => setAptSearch(e.target.value)}
                    placeholder="Search token, patient name..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-[#FFFFFF] text-[#0F172A]"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={playHospitalChime}
                  title="Test Sound Chime"
                  className="text-xs font-semibold"
                >
                  <Volume2 className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="hidden sm:inline">Test Chime</span>
                </Button>
              </div>
            </div>

            {/* Table of Live Patients */}
            <div className="overflow-x-auto border border-[#E2E8F0] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#0F172A] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Token & Ref</th>
                    <th className="py-3 px-4">Patient Information</th>
                    <th className="py-3 px-4">Doctor & Cabin</th>
                    <th className="py-3 px-4">Slot Time</th>
                    <th className="py-3 px-4">Fee / Payment</th>
                    <th className="py-3 px-4">Queue Status</th>
                    <th className="py-3 px-4 text-right">Instant Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {appointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#64748B]">
                        No appointments currently registered. Click <strong>Express Walk-In</strong> to register the first patient!
                      </td>
                    </tr>
                  ) : (
                    appointments.map((apt) => (
                      <tr key={apt.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-[#0F172A] block text-xs">
                            {apt.bookingReference}
                          </span>
                          <span className="text-[10px] text-[#64748B] uppercase">
                            {apt.visitType === 'follow-up' ? 'Follow-Up' : 'Consultation'}
                          </span>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{apt.patientName}</div>
                          <div className="text-slate-500 text-[11px]">{apt.patientPhone}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-medium text-slate-900">{apt.doctorName}</div>
                          <div className="text-sky-700 text-[11px] font-semibold">{apt.doctorSpeciality}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{apt.appointmentTime}</div>
                          <div className="text-slate-500 text-[11px]">{apt.appointmentDate}</div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">₹{apt.fee}</div>
                          <div className="text-[10px]">
                            {apt.paymentStatus === 'paid' ? (
                              <span className="text-emerald-700 font-bold flex items-center gap-1">
                                <Check className="w-3 h-3" /> Paid ({apt.paymentMode})
                              </span>
                            ) : (
                              <button
                                onClick={() => handleQuickStatusChange(apt.id, 'confirmed')}
                                className="text-amber-800 font-semibold underline hover:text-amber-900"
                              >
                                Pay at Desk (Pending)
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <StatusBadge status={apt.status} />
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            {/* Audio & Visual Call Button */}
                            <button
                              onClick={() => handleCallPatient(apt)}
                              title="Announce patient call to cabin"
                              className="px-2.5 py-1 rounded-lg text-xs font-bold bg-sky-700 hover:bg-sky-800 text-white shadow-xs flex items-center gap-1 transition-all"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                              <span>Call</span>
                            </button>

                            {/* Mark Waiting in Lobby */}
                            {apt.status === 'confirmed' && (
                              <button
                                onClick={() => handleQuickStatusChange(apt.id, 'waiting')}
                                title="Mark patient arrived & waiting in lobby"
                                className="px-2 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                              >
                                Lobby
                              </button>
                            )}

                            {/* Mark Completed */}
                            {(apt.status === 'in-consultation' || apt.status === 'waiting' || apt.status === 'confirmed') && (
                              <button
                                onClick={() => handleQuickStatusChange(apt.id, 'completed')}
                                title="Complete consultation"
                                className="px-2 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                              >
                                Done
                              </button>
                            )}

                            {/* Print Token Slip */}
                            <button
                              onClick={() => setPrintApt(apt)}
                              title="Print OPD Token Slip"
                              className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>

                            {/* Manage Details */}
                            <button
                              onClick={() => {
                                setSelectedApt(apt);
                                setNewStatus(apt.status);
                                setAdminNotes(apt.adminNotes || '');
                                setStatusModalOpen(true);
                              }}
                              className="px-2 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: ADVANCED EXECUTIVE ANALYTICS */}
      {/* =================================================================== */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Executive KPI Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Bookings</span>
                <span className="p-1.5 rounded-lg bg-sky-50 text-sky-700">
                  <Calendar className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">{stats.totalAppointments}</p>
              <p className="text-[11px] text-slate-500 mt-1">Total lifetime appointments</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Queue</span>
                <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-extrabold text-emerald-700">{stats.todayAppointments}</p>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1">
                {stats.confirmedAppointments} confirmed active
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Live Revenue</span>
                <span className="p-1.5 rounded-lg bg-teal-50 text-teal-700">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-extrabold text-slate-900">₹{stats.revenueEstimated.toLocaleString()}</p>
              <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                <span className="text-emerald-700 font-semibold">Online: ₹{(stats.revenueOnline || 0).toLocaleString()}</span>
                <span>•</span>
                <span className="text-amber-800">Cash: ₹{(stats.revenueCash || 0).toLocaleString()}</span>
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Roster Capacity</span>
                <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <p className="text-3xl font-extrabold text-indigo-700">{stats.activeDoctorsCount} Specialists</p>
              <p className="text-[11px] text-slate-500 mt-1">
                {stats.activeServicesCount} procedures active
              </p>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart 1: Today's Hourly Appointment Timeline & Density */}
            <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-sky-700" />
                    Hourly Appointment Load Distribution (08:00 - 18:00)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">Real-time patient distribution across consultation hours</p>
                </div>
                <span className="text-xs font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded">
                  Live Hourly Timeline
                </span>
              </div>

              <div className="pt-4 flex items-end gap-3 h-48 border-b border-slate-200 pb-2">
                {(stats.hourlyDistribution || []).map((h) => {
                  const maxCount = Math.max(1, ...((stats.hourlyDistribution || []).map(x => x.count)));
                  const heightPercent = Math.max(15, Math.round((h.count / maxCount) * 100));
                  return (
                    <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                      <span className="text-[10px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                        {h.count}
                      </span>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-lg transition-all ${
                          h.count > 0 ? 'bg-sky-700 group-hover:bg-sky-800' : 'bg-slate-100'
                        }`}
                      ></div>
                      <span className="text-[10px] text-slate-500 font-mono mt-1">
                        {h.hour}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span>Peak OPD Hours: <strong>10:00 AM - 01:00 PM</strong></span>
                <span>Break Window: <strong>01:00 PM - 02:00 PM</strong></span>
              </div>
            </div>

            {/* Chart 2: Revenue & Channel Breakdown */}
            <div className="lg:col-span-5 bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#2563EB]" />
                Payment Channels Breakdown
              </h3>
              <p className="text-xs text-[#64748B]">Collected vs pending revenue by payment mode</p>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#2563EB]"></span>
                      Online (Razorpay / UPI / Card)
                    </span>
                    <span className="font-bold text-[#0F172A]">
                      ₹{(stats.revenueOnline || 0).toLocaleString()} ({stats.onlineCount || 0} Apts)
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#F8FAFC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#2563EB] rounded-full transition-all"
                      style={{
                        width: `${stats.revenueEstimated > 0 ? ((stats.revenueOnline || 0) / stats.revenueEstimated) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-[#0F172A] flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#64748B]"></span>
                      Cash at Clinic Reception
                    </span>
                    <span className="font-bold text-[#0F172A]">
                      ₹{(stats.revenueCash || 0).toLocaleString()} ({stats.cashCount || 0} Apts)
                    </span>
                  </div>
                  <div className="h-2.5 bg-[#F8FAFC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#64748B] rounded-full transition-all"
                      style={{
                        width: `${stats.revenueEstimated > 0 ? ((stats.revenueCash || 0) / stats.revenueEstimated) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between text-xs">
                  <span className="text-[#64748B]">Total Confirmed Value</span>
                  <span className="text-base font-extrabold text-[#0F172A]">₹{stats.revenueEstimated.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Chart 3: Speciality Demand */}
            <div className="lg:col-span-6 bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#2563EB]" />
                Speciality Patient Distribution
              </h3>

              <div className="space-y-3 pt-1">
                {(stats.specialityBreakdown || []).map((spec) => (
                  <div key={spec.speciality} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#0F172A]">{spec.speciality}</span>
                      <span className="font-bold text-[#0F172A]">{spec.count} booked ({spec.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-[#F8FAFC] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#2563EB] rounded-full transition-all"
                        style={{ width: `${spec.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 4: Doctor Workload */}
            <div className="lg:col-span-6 bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2563EB]" />
                Consultant Workload & Availability Status
              </h3>

              <div className="space-y-3 pt-1">
                {(stats.doctorWorkload || []).map((doc) => (
                  <div key={doc.doctorId} className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-[#0F172A] block">{doc.doctorName}</span>
                      <span className="text-[#2563EB] text-[11px]">{doc.speciality}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-[#0F172A] block">{doc.bookedCount} patient(s)</span>
                      <span className="text-[#2563EB] text-[10px] font-semibold uppercase">{doc.opdStatus || 'Available'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: ALL APPOINTMENTS & RECORDS */}
      {/* =================================================================== */}
      {activeTab === 'appointments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-[#FFFFFF] p-4 rounded-xl border border-[#E2E8F0]">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-[#64748B] absolute left-3 top-2.5" />
              <input
                type="text"
                value={aptSearch}
                onChange={(e) => setAptSearch(e.target.value)}
                placeholder="Search patient, reference, phone..."
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-[#E2E8F0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563EB] bg-[#FFFFFF] text-[#0F172A]"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-[#64748B] font-semibold">Filter:</span>
              <select
                value={aptStatusFilter}
                onChange={(e) => setAptStatusFilter(e.target.value)}
                className="py-1.5 px-3 text-xs border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none"
              >
                <option value="all">All Appointments</option>
                <option value="confirmed">Confirmed</option>
                <option value="waiting">Waiting in Lobby</option>
                <option value="in-consultation">In Consultation</option>
                <option value="completed">Completed</option>
                <option value="no-show">No-Show</option>
                <option value="cancelled">Cancelled</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>

          <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#0F172A] font-semibold">
                  <tr>
                    <th className="py-3 px-4">Ref ID</th>
                    <th className="py-3 px-4">Patient</th>
                    <th className="py-3 px-4">Doctor & Speciality</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Fee & Payment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-[#F8FAFC]/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">
                        {apt.bookingReference}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F172A]">{apt.patientName}</div>
                        <div className="text-[#64748B] text-[11px]">{apt.patientPhone}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-[#0F172A]">{apt.doctorName}</div>
                        <div className="text-[#2563EB] text-[11px]">{apt.doctorSpeciality}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-[#0F172A]">{apt.appointmentDate}</div>
                        <div className="text-[#64748B] text-[11px]">{apt.appointmentTime}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-[#0F172A]">₹{apt.fee}</div>
                        <div className="text-[10px]">
                          {apt.paymentStatus === 'paid' ? (
                            <span className="text-emerald-800 font-semibold">
                              ✓ Paid ({apt.paymentMode})
                            </span>
                          ) : (
                            <span className="text-[#2563EB] font-medium">Cash on Slot</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={apt.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setPrintApt(apt)}
                            title="Print Token Slip"
                            className="p-1 rounded text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedApt(apt);
                              setNewStatus(apt.status);
                              setAdminNotes(apt.adminNotes || '');
                              setStatusModalOpen(true);
                            }}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-[#2563EB]/10 text-[#2563EB] border border-[#2563EB]/20 hover:bg-[#2563EB]/20"
                          >
                            Manage
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: DOCTOR ROSTER, OPD CABINS & FEES */}
      {/* =================================================================== */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Specialist Consultant Roster & OPD Cabins</h3>
              <p className="text-xs text-[#64748B]">Configure consultation fees, active availability, and real-time cabin status</p>
            </div>
            <Button size="sm" onClick={() => setAddDoctorModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Specialist
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doc, idx) => (
              <div key={doc.id} className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
                <div className="flex items-start gap-3">
                  <img src={doc.photoUrl} alt={doc.name} className="w-14 h-14 rounded-xl object-cover shrink-0 border border-[#E2E8F0]" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#0F172A]">{doc.name}</h4>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#2563EB]/10 text-[#2563EB]">
                        Cabin {idx + 1}
                      </span>
                    </div>
                    <p className="text-xs text-[#2563EB] font-semibold">{doc.specialityName}</p>
                    <p className="text-xs text-[#64748B]">{doc.qualifications}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs py-2 border-y border-[#E2E8F0]">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Consultation Fee:</span>
                    <span className="font-bold text-[#0F172A]">₹{doc.consultationFee}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Experience:</span>
                    <span className="font-semibold text-[#0F172A]">{doc.experienceYears} Years</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Languages:</span>
                    <span className="text-[#0F172A] truncate max-w-[180px]">{doc.languages.join(', ')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[#64748B]">OPD Status:</span>
                    <span className={`font-bold uppercase text-[10px] px-2 py-0.5 rounded ${
                      (doc.opdStatus || 'available') === 'available'
                        ? 'bg-emerald-100 text-emerald-800'
                        : (doc.opdStatus === 'in-consultation')
                        ? 'bg-[#2563EB]/15 text-[#2563EB]'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.opdStatus || (doc.active ? 'Available' : 'Off Duty')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className={`text-xs font-semibold ${doc.active ? 'text-emerald-800' : 'text-[#64748B]'}`}>
                    {doc.active ? '● Booking Enabled' : '○ Booking Paused'}
                  </span>
                  <button
                    onClick={() => {
                      setEditingDoctor(doc);
                      setDoctorFee(doc.consultationFee);
                      setDoctorActive(doc.active);
                      setDoctorOpdStatus(doc.opdStatus || 'available');
                      setDoctorModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2563EB]/10 text-[#2563EB] hover:bg-[#2563EB]/20 border border-[#2563EB]/20"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: DIAGNOSTIC SERVICES & PROCEDURES */}
      {/* =================================================================== */}
      {activeTab === 'services' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">Diagnostic Services, Health Checks & Packages</h3>
              <p className="text-xs text-[#64748B]">Manage catalog pricing, sample turnaround, and patient preparation notes</p>
            </div>
            <Button size="sm" onClick={() => setAddServiceModalOpen(true)}>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Add Diagnostic Service
            </Button>
          </div>

          <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#0F172A] font-semibold">
                <tr>
                  <th className="py-3 px-4">Service Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Standard Price</th>
                  <th className="py-3 px-4">Preparation Note</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {services.map((srv) => (
                  <tr key={srv.id} className="hover:bg-[#F8FAFC]/50">
                    <td className="py-3 px-4 font-bold text-[#0F172A]">
                      {srv.name}
                      <span className="block text-[11px] font-normal text-[#64748B]">{srv.description}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#F8FAFC] text-[#0F172A] border border-[#E2E8F0]">
                        {srv.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[#0F172A]">{srv.durationMinutes} mins</td>
                    <td className="py-3 px-4 font-bold text-[#0F172A]">₹{srv.price}</td>
                    <td className="py-3 px-4 text-[#64748B] max-w-xs truncate">
                      {srv.preparationInstructions || 'Standard OPD consultation'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-semibold ${srv.isActive ? 'text-emerald-800' : 'text-[#64748B]'}`}>
                        {srv.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 6: CLINIC BROADCAST & EMERGENCY NOTICES */}
      {/* =================================================================== */}
      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-6 max-w-2xl">
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#2563EB]" />
                Live Clinic Emergency & Operational Broadcast
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                Broadcast messages are shown instantly across the clinic booking portal and reception screens.
              </p>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">
                  Announcement Message *
                </label>
                <textarea
                  rows={3}
                  required
                  value={broadcastMessageInput || (broadcast?.message || '')}
                  onChange={(e) => setBroadcastMessageInput(e.target.value)}
                  placeholder="e.g. Dr. Swagatha arriving at 10:30 AM due to emergency surgery..."
                  className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg text-sm bg-[#FFFFFF] text-[#0F172A] focus:ring-2 focus:ring-[#2563EB] focus:outline-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Alert Level</label>
                  <select
                    value={broadcastTypeInput}
                    onChange={(e) => setBroadcastTypeInput(e.target.value as any)}
                    className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none"
                  >
                    <option value="info">Info (Standard Clinical Notice)</option>
                    <option value="warning">Warning (Delay / Schedule Change)</option>
                    <option value="urgent">Urgent (Emergency Alert)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="broadcastActiveCheckbox"
                    checked={broadcastActiveInput}
                    onChange={(e) => setBroadcastActiveInput(e.target.checked)}
                    className="rounded border-[#E2E8F0] text-[#2563EB] focus:ring-[#2563EB]"
                  />
                  <label htmlFor="broadcastActiveCheckbox" className="font-semibold text-[#0F172A] cursor-pointer">
                    Enable & Display Live Banner
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <Button type="submit" size="sm">
                  Publish Broadcast Notice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 7: SUPABASE CLOUD DATABASE */}
      {/* =================================================================== */}
      {activeTab === 'supabase' && (
        <div className="space-y-6">
          <div className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8F0]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 text-[#2563EB] flex items-center justify-center border border-[#2563EB]/20 shadow-xs">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight flex items-center gap-2">
                    Supabase PostgreSQL & REST Service
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#2563EB]/15 text-[#2563EB]">
                      Live Project
                    </span>
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Production cloud relational storage for Apollo Clinic Basaveshwar Nagar
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetchSupabaseStatus()}
                  disabled={isCheckingSupabase}
                >
                  <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isCheckingSupabase ? 'animate-spin' : ''}`} />
                  Test Ping
                </Button>
                <Button
                  size="sm"
                  onClick={handleSyncToSupabase}
                  disabled={isSyncingSupabase}
                >
                  <Database className="w-3.5 h-3.5 mr-1" />
                  {isSyncingSupabase ? 'Syncing...' : 'Sync to Supabase'}
                </Button>
                <a
                  href="https://supabase.com/dashboard/project/kwzqkpeeaqxlpymrohkt"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0F172A] hover:bg-[#3E352F] text-[#FFFFFF] transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Dashboard
                </a>
              </div>
            </div>

            {supabaseSyncMessage && (
              <div className="p-3.5 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 text-[#0F172A] text-xs flex items-center justify-between">
                <span>{supabaseSyncMessage}</span>
                <button onClick={() => setSupabaseSyncMessage(null)} className="text-[#2563EB] hover:text-[#0F172A] font-bold ml-2">×</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Supabase Project ID</span>
                <code className="text-sm font-mono font-bold text-[#0F172A] block select-all">kwzqkpeeaqxlpymrohkt</code>
                <span className="text-[11px] text-[#2563EB] font-medium">Verified Active Project</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">REST API Endpoint</span>
                <code className="text-xs font-mono font-semibold text-[#2563EB] block truncate select-all">
                  https://kwzqkpeeaqxlpymrohkt.supabase.co/rest/v1/
                </code>
                <span className="text-[11px] text-[#64748B]">PostgREST v12 API</span>
              </div>

              <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block">Connection Health</span>
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-xs font-bold text-[#0F172A]">
                    {supabaseStatus ? (supabaseStatus.connected ? 'Operational' : 'Reachable') : 'Online'}
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  {supabaseStatus?.message || 'Endpoint ping responding normally'}
                </p>
              </div>
            </div>

            {/* Supabase Schema SQL Setup Card */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#2563EB]" />
                    Supabase Schema Setup (SQL Editor Script)
                  </h4>
                  <p className="text-[11px] text-[#64748B]">
                    Paste this into your Supabase Dashboard SQL Editor to create the appointments table and row-level security:
                  </p>
                </div>
                <button
                  onClick={() => {
                    const sql = `-- Supabase Table Setup for Project: kwzqkpeeaqxlpymrohkt\nCREATE TABLE IF NOT EXISTS public.appointments (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  booking_reference TEXT UNIQUE NOT NULL,\n  patient_name TEXT NOT NULL,\n  patient_phone TEXT NOT NULL,\n  patient_email TEXT NOT NULL,\n  doctor_id TEXT NOT NULL,\n  doctor_name TEXT NOT NULL,\n  service_id TEXT NOT NULL,\n  service_name TEXT NOT NULL,\n  appointment_date DATE NOT NULL,\n  appointment_time TEXT NOT NULL,\n  status TEXT NOT NULL DEFAULT 'confirmed',\n  fee NUMERIC(10, 2) NOT NULL DEFAULT 500,\n  payment_mode TEXT NOT NULL DEFAULT 'cash-at-clinic',\n  payment_status TEXT NOT NULL DEFAULT 'pending',\n  payment_id TEXT,\n  notes TEXT,\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()\n);\n\nALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;\nCREATE POLICY "Allow public insert" ON public.appointments FOR INSERT WITH CHECK (true);\nCREATE POLICY "Allow public select" ON public.appointments FOR SELECT USING (true);\nCREATE POLICY "Allow public update" ON public.appointments FOR UPDATE USING (true);`;
                    navigator.clipboard.writeText(sql);
                    setCopiedSql(true);
                    setTimeout(() => setCopiedSql(false), 2500);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#2563EB]/10 hover:bg-[#2563EB]/20 text-[#2563EB] border border-[#2563EB]/20 transition-colors"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Copy SQL Script</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3.5 rounded-xl bg-[#0F172A] text-[#D8CEC4] text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed select-all border border-[#3E352F]">
{`-- Project ID: kwzqkpeeaqxlpymrohkt
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_reference TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_phone TEXT NOT NULL,
  patient_email TEXT NOT NULL,
  doctor_id TEXT NOT NULL,
  doctor_name TEXT NOT NULL,
  service_id TEXT NOT NULL,
  service_name TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed',
  fee NUMERIC(10, 2) NOT NULL DEFAULT 500,
  payment_mode TEXT NOT NULL DEFAULT 'cash-at-clinic',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow public update" ON public.appointments FOR UPDATE USING (true);`}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 8: BRANCH SETTINGS */}
      {/* =================================================================== */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveClinicSettings} className="bg-[#FFFFFF] p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-6 max-w-4xl">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0]">
            <div>
              <h3 className="text-base font-extrabold text-[#0F172A] tracking-tight">
                Branch Operational Settings
              </h3>
              <p className="text-xs text-[#64748B]">
                Official branch details displayed to patients on appointment booking confirmations
              </p>
            </div>
            {settingsSuccess && (
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                ✓ Settings Saved!
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Branch Name</label>
              <input
                type="text"
                value={settingsForm.branchName}
                onChange={(e) => setSettingsForm({ ...settingsForm, branchName: e.target.value })}
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Central OPD Helpline</label>
              <input
                type="text"
                value={settingsForm.contacts.centralHelpline}
                onChange={(e) => setSettingsForm({
                  ...settingsForm,
                  contacts: { ...settingsForm.contacts, centralHelpline: e.target.value }
                })}
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block font-semibold text-[#0F172A] mb-1">Address Line 1</label>
              <input
                type="text"
                value={settingsForm.address.line1}
                onChange={(e) => setSettingsForm({
                  ...settingsForm,
                  address: { ...settingsForm.address, line1: e.target.value }
                })}
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="pt-2">
            <Button type="submit" size="sm">
              Save Clinic Configuration
            </Button>
          </div>
        </form>
      )}

      {/* =================================================================== */}
      {/* TAB 9: AUDIT TRAIL */}
      {/* =================================================================== */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A]">Live Clinical Operations Audit Trail</h3>
            <span className="text-xs text-[#64748B]">Auto-refreshing log stream</span>
          </div>
          <div className="bg-[#FFFFFF] rounded-xl border border-[#E2E8F0] overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#0F172A] font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Resource</th>
                  <th className="py-3 px-4">Staff Member</th>
                  <th className="py-3 px-4">Operational Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-3 px-4 font-mono text-[#64748B] text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true })}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#2563EB]">{log.action}</td>
                    <td className="py-3 px-4 font-mono text-[#0F172A]">{log.resourceType}: {log.resourceId}</td>
                    <td className="py-3 px-4 font-semibold text-[#0F172A]">{log.performedBy}</td>
                    <td className="py-3 px-4 text-[#64748B]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: EXPRESS WALK-IN REGISTRATION */}
      {/* =================================================================== */}
      <Modal
        isOpen={walkinModalOpen}
        onClose={() => setWalkinModalOpen(false)}
        title="Register Quick Walk-In Patient"
      >
        <form onSubmit={handleWalkinSubmit} className="space-y-4 text-xs text-[#0F172A]">
          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Patient Full Name *</label>
            <input
              type="text"
              required
              value={walkinName}
              onChange={(e) => setWalkinName(e.target.value)}
              placeholder="e.g. Ramesh Babu"
              className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Mobile Number *</label>
              <input
                type="tel"
                required
                value={walkinPhone}
                onChange={(e) => setWalkinPhone(e.target.value)}
                placeholder="e.g. 9845011223"
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Gender</label>
              <select
                value={walkinGender}
                onChange={(e) => setWalkinGender(e.target.value as any)}
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Assign Specialist Doctor *</label>
            <select
              value={walkinDoctorId}
              onChange={(e) => setWalkinDoctorId(e.target.value)}
              className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none"
            >
              {doctors.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.specialityName})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Payment Method</label>
            <select
              value={walkinPaymentMode}
              onChange={(e) => setWalkinPaymentMode(e.target.value)}
              className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none"
            >
              <option value="cash-at-clinic">Cash at Clinic Reception</option>
              <option value="card">Card Swipe at Reception</option>
              <option value="phonepe">PhonePe / UPI at Reception</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setWalkinModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSubmittingWalkin}>
              {isSubmittingWalkin ? 'Generating Token...' : 'Register & Print Token'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL 2: OFFICIAL PRINTABLE OPD TOKEN SLIP */}
      {/* =================================================================== */}
      <Modal
        isOpen={!!printApt}
        onClose={() => setPrintApt(null)}
        title="OPD Patient Token & Consultation Slip"
      >
        {printApt && (
          <div className="space-y-4">
            <div className="p-5 bg-[#FFFFFF] border border-[#E2E8F0] rounded-xl space-y-4 text-xs font-sans print:border-none print:p-0 text-[#0F172A]">
              <div className="text-center border-b border-[#E2E8F0] pb-3 space-y-1">
                <img
                  src="/assets/aistudio/Glossy_LifeCare_Healthcare_Logo__1__87cd2d7a.png"
                  alt="LifeCare Hospital"
                  className="h-12 mx-auto object-contain mb-1"
                />
                <h3 className="text-base font-black text-[#0F172A] tracking-tight">
                  LIFECARE HOSPITAL
                </h3>
                <p className="text-[11px] font-bold text-[#2563EB]">Basaveshwar Nagar Branch, Bengaluru</p>
                <p className="text-[10px] text-[#64748B]">No. 881/A, Yashodhaara Building, Modi Hospital Road</p>
                <p className="text-[10px] text-[#64748B]">Helpline: 1860-500-7788 • Landline: +91 80 2315 7788</p>
              </div>

              <div className="bg-[#F8FAFC] p-3 rounded-xl text-center space-y-0.5 border border-[#E2E8F0]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#64748B]">OPD Consultation Token</span>
                <p className="text-2xl font-black text-[#0F172A] tracking-tight font-mono">{printApt.bookingReference}</p>
                <p className="text-[11px] font-bold text-[#2563EB]">
                  {printApt.appointmentDate} • Scheduled: {printApt.appointmentTime}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs border-y border-[#E2E8F0] py-3">
                <div>
                  <span className="text-[#64748B] block text-[10px]">PATIENT NAME</span>
                  <span className="font-bold text-[#0F172A]">{printApt.patientName}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">PHONE</span>
                  <span className="font-mono text-[#0F172A]">{printApt.patientPhone}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">CONSULTANT</span>
                  <span className="font-bold text-[#0F172A]">{printApt.doctorName}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">SPECIALITY</span>
                  <span className="text-[#0F172A]">{printApt.doctorSpeciality}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">CONSULTATION FEE</span>
                  <span className="font-bold text-[#0F172A]">₹{printApt.fee}</span>
                </div>
                <div>
                  <span className="text-[#64748B] block text-[10px]">PAYMENT STATUS</span>
                  <span className="font-bold uppercase text-emerald-800">{printApt.paymentStatus}</span>
                </div>
              </div>

              <div className="text-[10px] text-[#64748B] space-y-1">
                <p>• Please report to OPD Lobby A 10 minutes prior to slot.</p>
                <p>• Keep previous prescription records and diagnostic reports handy.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
              <Button variant="outline" size="sm" onClick={() => setPrintApt(null)}>
                Close
              </Button>
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="w-3.5 h-3.5 mr-1" />
                Print OPD Slip
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* =================================================================== */}
      {/* MODAL 3: STATUS UPDATE MODAL */}
      {/* =================================================================== */}
      <Modal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        title={`Manage Appointment ${selectedApt?.bookingReference}`}
      >
        {selectedApt && (
          <div className="space-y-4 text-xs text-[#0F172A]">
            <div className="p-3 bg-[#F8FAFC] rounded-lg space-y-1 border border-[#E2E8F0]">
              <p><strong>Patient:</strong> {selectedApt.patientName} ({selectedApt.patientPhone})</p>
              <p><strong>Doctor:</strong> {selectedApt.doctorName}</p>
              <p><strong>Scheduled:</strong> {selectedApt.appointmentDate} at {selectedApt.appointmentTime}</p>
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Appointment Stage / Queue Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none"
              >
                <option value="confirmed">Confirmed</option>
                <option value="waiting">Waiting in Lobby (Checked In)</option>
                <option value="in-consultation">In Consultation Cabin</option>
                <option value="completed">Completed (Patient Attended)</option>
                <option value="no-show">No-Show</option>
                <option value="cancelled">Cancelled (Release Slot)</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Administrative Notes</label>
              <textarea
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Internal reception notes..."
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              ></textarea>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-[#E2E8F0]">
              <Button variant="outline" size="sm" onClick={() => setStatusModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleUpdateStatusSubmit}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* =================================================================== */}
      {/* MODAL 4: DOCTOR EDIT MODAL */}
      {/* =================================================================== */}
      <Modal
        isOpen={doctorModalOpen}
        onClose={() => setDoctorModalOpen(false)}
        title={`Edit ${editingDoctor?.name}`}
      >
        {editingDoctor && (
          <div className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Consultation Fee (INR)</label>
              <input
                type="number"
                value={doctorFee}
                onChange={(e) => setDoctorFee(Number(e.target.value))}
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB] text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Real-Time OPD Cabin Status</label>
              <select
                value={doctorOpdStatus}
                onChange={(e) => setDoctorOpdStatus(e.target.value as any)}
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="available">Available in OPD Cabin</option>
                <option value="in-consultation">In Consultation</option>
                <option value="break">Short Break (15 min)</option>
                <option value="off-duty">Off Duty</option>
              </select>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="docActiveToggle"
                checked={doctorActive}
                onChange={(e) => setDoctorActive(e.target.checked)}
                className="accent-[#2563EB] rounded border-[#E2E8F0]"
              />
              <label htmlFor="docActiveToggle" className="font-semibold text-[#0F172A] cursor-pointer">
                Profile Active for Online Patient Appointments
              </label>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-[#E2E8F0]">
              <Button variant="outline" size="sm" onClick={() => setDoctorModalOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleDoctorUpdateSubmit}>
                Save Doctor Settings
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* =================================================================== */}
      {/* MODAL 5: ADD NEW DOCTOR MODAL */}
      {/* =================================================================== */}
      <Modal
        isOpen={addDoctorModalOpen}
        onClose={() => setAddDoctorModalOpen(false)}
        title="Add New Consultant Specialist"
      >
        <form onSubmit={handleAddDoctorSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Doctor Name *</label>
            <input
              type="text"
              required
              value={newDocName}
              onChange={(e) => setNewDocName(e.target.value)}
              placeholder="e.g. Dr. Anand Murthy"
              className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Speciality *</label>
            <input
              type="text"
              required
              value={newDocSpeciality}
              onChange={(e) => setNewDocSpeciality(e.target.value)}
              placeholder="e.g. Cardiology, Pediatrics"
              className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Qualifications</label>
              <input
                type="text"
                value={newDocQualifications}
                onChange={(e) => setNewDocQualifications(e.target.value)}
                placeholder="e.g. MBBS, MD, DNB"
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Consultation Fee (₹)</label>
              <input
                type="number"
                value={newDocFee}
                onChange={(e) => setNewDocFee(Number(e.target.value))}
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setAddDoctorModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Doctor
            </Button>
          </div>
        </form>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL 6: ADD NEW SERVICE MODAL */}
      {/* =================================================================== */}
      <Modal
        isOpen={addServiceModalOpen}
        onClose={() => setAddServiceModalOpen(false)}
        title="Add Diagnostic Service / Test"
      >
        <form onSubmit={handleAddServiceSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Service / Test Name *</label>
            <input
              type="text"
              required
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="e.g. Comprehensive Lipid Profile"
              className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Category</label>
              <select
                value={newServiceCategory}
                onChange={(e) => setNewServiceCategory(e.target.value as any)}
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="diagnostic">Diagnostic / Lab</option>
                <option value="consultation">Consultation</option>
                <option value="health-check">Health Package</option>
                <option value="procedure">Procedure</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Price (₹)</label>
              <input
                type="number"
                value={newServicePrice}
                onChange={(e) => setNewServicePrice(Number(e.target.value))}
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Duration (Mins)</label>
              <input
                type="number"
                value={newServiceDuration}
                onChange={(e) => setNewServiceDuration(Number(e.target.value))}
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setAddServiceModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Save Service
            </Button>
          </div>
        </form>
      </Modal>

      {/* =================================================================== */}
      {/* MODAL 7: BROADCAST MODAL */}
      {/* =================================================================== */}
      <Modal
        isOpen={broadcastModalOpen}
        onClose={() => setBroadcastModalOpen(false)}
        title="Update Clinic Broadcast Announcement"
      >
        <form onSubmit={handleBroadcastSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#0F172A] mb-1">Announcement Text *</label>
            <textarea
              rows={3}
              required
              value={broadcastMessageInput}
              onChange={(e) => setBroadcastMessageInput(e.target.value)}
              placeholder="Enter announcement text for patients and staff..."
              className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            ></textarea>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#0F172A] mb-1">Alert Level</label>
              <select
                value={broadcastTypeInput}
                onChange={(e) => setBroadcastTypeInput(e.target.value as any)}
                className="w-full py-2 px-3 border border-[#E2E8F0] rounded-lg bg-[#FFFFFF] text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="modalBroadcastActive"
                checked={broadcastActiveInput}
                onChange={(e) => setBroadcastActiveInput(e.target.checked)}
                className="accent-[#2563EB] rounded border-[#E2E8F0]"
              />
              <label htmlFor="modalBroadcastActive" className="font-semibold text-[#0F172A] cursor-pointer">
                Show Live Banner
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setBroadcastModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Publish Notice
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
