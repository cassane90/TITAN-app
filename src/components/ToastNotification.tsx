import React, { useEffect } from 'react';

interface ToastProps {
  message: string;
  type?: 'error' | 'warning' | 'info' | 'success';
  onDismiss: () => void;
  autoDismissMs?: number;
}

/**
 * ToastNotification — Inline feedback component.
 *
 * HCI Rationale:
 *   - Shneiderman Rule 3: Offers informative feedback without blocking the UI (unlike alert())
 *   - Shneiderman Rule 5: Shows meaningful error messages with actionable text
 *   - Nielsen Heuristic 9: Helps users recognise, diagnose and recover from errors
 */
const ToastNotification: React.FC<ToastProps> = ({
  message,
  type = 'error',
  onDismiss,
  autoDismissMs,
}) => {
  useEffect(() => {
    if (!autoDismissMs) return;
    const timer = setTimeout(onDismiss, autoDismissMs);
    return () => clearTimeout(timer);
  }, [autoDismissMs, onDismiss]);

  const styles = {
    error:   { border: 'border-red-500/40',   bg: 'bg-red-500/10',   text: 'text-red-400',   icon: 'error' },
    warning: { border: 'border-yellow-500/40', bg: 'bg-yellow-500/10', text: 'text-yellow-400', icon: 'warning' },
    info:    { border: 'border-primary/40',    bg: 'bg-primary/10',    text: 'text-primary',    icon: 'info' },
    success: { border: 'border-green-500/40',  bg: 'bg-green-500/10',  text: 'text-green-400',  icon: 'check_circle' },
  }[type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`flex items-start gap-3 p-4 border ${styles.border} ${styles.bg} animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <span className={`material-symbols-outlined text-lg mt-0.5 shrink-0 ${styles.text}`}>
        {styles.icon}
      </span>
      <p className={`text-[11px] font-bold uppercase leading-relaxed flex-1 ${styles.text}`}>
        {message}
      </p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss notification"
        className="material-symbols-outlined text-sm opacity-40 hover:opacity-100 transition-opacity shrink-0"
      >
        close
      </button>
    </div>
  );
};

export default ToastNotification;
