import React from 'react';

export function Card({ children, title, className = '', borderLeftColor = '' }) {
  return (
    <div 
      className={`bg-white border border-[#e2e8f0] p-6 rounded-xl shadow-sm ${className}`}
      style={borderLeftColor ? { borderLeft: `4px solid ${borderLeftColor}` } : {}}
    >
      {title && <h3 className="text-base font-extrabold text-[#1e293b] mb-4">{title}</h3>}
      {children}
    </div>
  );
}
