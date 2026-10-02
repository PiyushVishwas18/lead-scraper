import React from 'react';
import { CheckIcon, CloseIcon } from './Icons';

interface ToastProps {
  notification: { type: 'success' | 'error'; message: string } | null;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({ notification, onClose }) => {
  if (!notification) return null;

  const isSuccess = notification.type === 'success';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl text-xs font-medium border backdrop-blur-md transition-all duration-300 animate-fade-in ${
        isSuccess
          ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 shadow-emerald-950/50'
          : 'bg-rose-950/90 border-rose-500/40 text-rose-200 shadow-rose-950/50'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
          isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        }`}
      >
        {isSuccess ? <CheckIcon className="w-3.5 h-3.5" /> : <CloseIcon className="w-3.5 h-3.5" />}
      </div>
      <span className="leading-snug">{notification.message}</span>
      {onClose && (
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white ml-2 p-0.5 rounded transition-colors"
          aria-label="Dismiss notification"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
