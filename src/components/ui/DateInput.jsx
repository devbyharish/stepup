import React from "react";
export default function DateInput({ label, value, onChange, className="" }){
  return (
    <label className="block">
      {label && <div className="text-xs text-[var(--muted)] mb-1">{label}</div>}
      <input type="date" value={value||""} onChange={e=>onChange?.(e.target.value)}
             className={`border rounded-md p-2 w-full ${className}`} />
    </label>
  );
}
