// src/components/RoleSelector.jsx
import React from "react";

/**
 * RoleSelector props:
 *  - availableRoles: array of strings or array of {role, ...}
 *  - activeRole: string
 *  - onSwitch(role): fn
 */
export default function RoleSelector({ availableRoles = [], activeRole, onSwitch }) {
  const roles = (availableRoles || []).map(r => (typeof r === "string" ? r : r.role || r));
  if (!roles || roles.length <= 1) {
    return <div style={{padding:'6px 10px', borderRadius:8, border:'1px solid rgba(0,0,0,0.04)', background:'#fff', fontSize:13}}>{activeRole || roles[0] || "—"}</div>;
  }

  return (
    <select
      value={activeRole || roles[0]}
      onChange={(e) => onSwitch(e.target.value)}
      style={{ padding:8, borderRadius:8, border:'1px solid rgba(0,0,0,0.08)', background:'#fff' }}
      aria-label="Active role"
    >
      {roles.map(r => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}
