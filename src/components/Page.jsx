import React from "react";
export default function Page({ title, subtitle, actions, children }) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--brand-navy)]">{title}</h1>
          {subtitle && <div className="text-sm text-[var(--muted)]">{subtitle}</div>}
        </div>
        <div>{actions}</div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
        {children}
      </div>
    </div>
  );
}
