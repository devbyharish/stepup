// src/components/ListControls/FiltersBar.jsx
import React from "react";

/**
 * FiltersBar
 * Props:
 * - filters: { class: '2A', status: 'Active' }
 * - options: { class: ['2A','3A'], status: ['Active','Inactive'] }
 * - onChange: (newFilters) => void
 */
export default function FiltersBar({ filters = {}, options = {}, onChange = () => {} }) {
  const handle = (key, val) => onChange({ ...filters, [key]: val });

  return (
    <div className="flex items-center gap-2">
      {Object.keys(options).map((key) => (
        <select
          key={key}
          value={filters[key] || ""}
          onChange={(e) => handle(key, e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">{`All ${key}`}</option>
          {options[key].map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      ))}
    </div>
  );
}
