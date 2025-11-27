import React from "react";
export default function Select({ label, value, onChange, options=[], className="" }) {
  return (
    <label className="block">
      {label && <div className="text-xs text-[var(--muted)] mb-1">{label}</div>}
      <select value={value||""} onChange={e=>onChange?.(e.target.value)}
              className={`border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] ${className}`}>
        <option value="">— select —</option>
        {options.map(o=> <option key={o.value||o} value={o.value||o}>{o.label||o}</option>)}
      </select>
    </label>
  );
}
