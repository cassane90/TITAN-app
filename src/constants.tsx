
import React from 'react';

export const API_KEYS = {
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON: import.meta.env.VITE_SUPABASE_ANON_KEY
};

export const formatCurrency = (amount: string | number | undefined, code: string = 'USD'): string => {
  if (!amount) return '---';
  const value = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.-]+/g, '')) : amount;
  if (isNaN(value)) return String(amount);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: code,
    minimumFractionDigits: 0
  }).format(value);
};

export const Icons = {
  Terminal: ({ className }: { className?: string }) => <span className={`material-symbols-outlined ${className}`}>terminal</span>,
  Radar: ({ className }: { className?: string }) => <span className={`material-symbols-outlined ${className}`}>radar</span>,
  Circuit: ({ className }: { className?: string }) => <span className={`material-symbols-outlined ${className}`}>memory</span>,
  Grounded: ({ className }: { className?: string }) => <span className={`material-symbols-outlined ${className}`}>verified</span>,
  Hazard: ({ className }: { className?: string }) => <span className={`material-symbols-outlined ${className}`}>report_problem</span>,
  ArrowRight: ({ className }: { className?: string }) => <span className={`material-symbols-outlined ${className}`}>arrow_forward</span>,
  Check: ({ className }: { className?: string }) => <span className={`material-symbols-outlined ${className}`}>check_circle</span>,
  X: ({ className }: { className?: string }) => <span className={`material-symbols-outlined ${className}`}>close</span>,
  Chat: ({ className }: { className?: string }) => <span className={`material-symbols-outlined ${className}`}>chat</span>,
  ChevronRight: ({ className }: { className?: string }) => <span className={`material-symbols-outlined ${className}`}>chevron_right</span>,
  Chart: ({ className }: { className?: string }) => <span className={`material-symbols-outlined ${className}`}>bar_chart</span>,
  Briefcase: ({ className }: { className?: string }) => <span className={`material-symbols-outlined ${className}`}>work</span>,
};
