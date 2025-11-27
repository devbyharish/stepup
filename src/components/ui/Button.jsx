import React from "react";
export default function Button({ children, variant="primary", className="", ...p }) {
  const base = "px-4 py-2 rounded-md font-medium shadow-sm";
  const v = variant==="primary" ? "btn-primary" : variant==="accent" ? "btn-accent" : "btn-navy";
  return <button className={`${base} ${v} ${className}`} {...p}>{children}</button>;
}
