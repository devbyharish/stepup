// src/components/RoleSelector.jsx
import React from "react";

/**
 * Minimal RoleSelector
 * Props:
 *  - availableRoles: array of { value, label } OR array of strings OR server rows
 *  - activeRole: string
 *  - onSwitchRole: function(roleValue)
 *  - size: "small" | "normal"
 *  - className: optional extra classes passed from parent
 */
export default function RoleSelector({
  availableRoles = [],
  activeRole = "",
  onSwitchRole = () => {},
  size = "normal",
  className = ""
}) {
  const opts = (availableRoles || []).map(r => {
    if (!r) return null;
    if (typeof r === "string") return { value: r, label: r };
    if (r.value && r.label) return { value: String(r.value), label: String(r.label) };
    const v = r.role || r.Role || (r.fields && (r.fields.Role || r.fields.Title)) || r.value || r.Title || "";
    const label = r.displayName || r.DisplayName || v;
    return { value: String(v || ""), label: String(label || v || "") };
  }).filter(Boolean);

  const current = activeRole || (opts[0] && opts[0].value) || "";

  // small uses compact padding, normal is slightly larger
  const sizeCls = size === "small" ? "text-xs px-2 py-1" : "text-sm px-3 py-1";

  // NOTE: we DO NOT force w-full here — let parent control width. Default to w-full if parent wants it.
  const baseCls = `border rounded ${sizeCls} ${className}`;

  return (
    <select
      aria-label="Select role"
      value={current}
      onChange={(e) => onSwitchRole(e.target.value)}
      className={baseCls}
      title="Switch active role"
    >
      {opts.length === 0 ? (
        <option value={current}>{current || "—"}</option>
      ) : (
        opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)
      )}
    </select>
  );
}
