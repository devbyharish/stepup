// -------------------------
// src/components/DashboardLayout.jsx
// -------------------------
import React from 'react';
export default function DashboardLayout({ children, header }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="flex">
        {children}
      </div>
    </div>
  );
}
