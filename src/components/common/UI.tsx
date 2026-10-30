import React from 'react';

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  ...props
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  onClick?: (e?: any) => void;
  type?: 'button' | 'submit' | 'reset';
  [key: string]: any;
}) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus:ring-[#2563EB] shadow-xs active:scale-[0.99]',
    secondary: 'bg-[#64748B] text-white hover:bg-[#475569] focus:ring-[#64748B] shadow-xs active:scale-[0.99]',
    outline: 'border border-[#E2E8F0] bg-[#FFFFFF] text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#2563EB] focus:ring-[#2563EB] shadow-xs',
    danger: 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500 shadow-xs',
    ghost: 'text-[#0F172A] hover:bg-[#F1F5F9] hover:text-[#2563EB] focus:ring-[#64748B]'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5'
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; text: string; border: string }> = {
    confirmed: { label: 'Confirmed', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    waiting: { label: 'Waiting in Lobby', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    'in-consultation': { label: 'In Consultation', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    pending: { label: 'Pending Request', bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
    rescheduled: { label: 'Rescheduled', bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200' },
    completed: { label: 'Completed', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-300' },
    'no-show': { label: 'No-Show', bg: 'bg-orange-50', text: 'text-orange-800', border: 'border-orange-200' },
    cancelled: { label: 'Cancelled', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
    rejected: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-800', border: 'border-red-200' },
  };

  const current = map[status] || { label: status, bg: 'bg-[#F8FAFC]', text: 'text-[#0F172A]', border: 'border-[#E2E8F0]' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${current.bg} ${current.text} ${current.border}`}>
      <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-current opacity-80"></span>
      {current.label}
    </span>
  );
}

export function Modal({
  isOpen,
  onClose,
  title,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] text-[#0F172A] rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E2E8F0] relative animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] mb-4">
          <h3 className="text-base sm:text-lg font-bold text-[#0F172A] tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="text-[#64748B] hover:text-[#0F172A] rounded-md p-1 focus:outline-none transition-colors"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function SkeletonLoader({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-20 bg-[#E2E8F0] rounded-xl w-full"></div>
      ))}
    </div>
  );
}
