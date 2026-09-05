import React from 'react';

export function Button({ children, onClick, type = 'button', className = '', disabled = false }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {children}
    </button>
  );
}
