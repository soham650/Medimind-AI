import React from 'react';

export function Loader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3">
      <div className="w-8 h-8 border-4 border-[#0a4bb5]/20 border-t-[#0a4bb5] rounded-full animate-spin"></div>
      <p className="text-xs font-semibold text-[#64748b]">{message}</p>
    </div>
  );
}
