import React from "react";
export default function Input({ label, value, onChange, placeholder="", type="text", className="" }) {
  return (
    <label className="block">
      {label && <div className="text-xs text-[var(--muted)] mb-1">{label}</div>}
      <input type={type} value={value||""} onChange={e=>onChange?.(e.target.value)} placeholder={placeholder}
             className={`border rounded-md p-2 w-full focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] ${className}`} />
    </label>
  );
}
