// src/components/ListControls/SortControls.jsx
import React from "react";

export default function SortControls({ sortBy, sortDir, onChange = ()=>{}, fields = [] }) {
  const changeField = (k) => {
    if (k === sortBy) onChange({ sortBy: k, sortDir: sortDir === "asc" ? "desc" : "asc" });
    else onChange({ sortBy: k, sortDir: "asc" });
  };
  return (
    <div className="flex items-center gap-2">
      {fields.map(f => (
        <button
          key={f.key}
          onClick={() => changeField(f.key)}
          className={`px-3 py-1 border rounded text-sm ${sortBy === f.key ? "font-semibold" : ""}`}
        >
          {f.label} {sortBy === f.key ? (sortDir === "asc" ? "⬆" : "⬇") : ""}
        </button>
      ))}
    </div>
  );
}
