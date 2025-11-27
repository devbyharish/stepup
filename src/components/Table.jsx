// src/components/Table.jsx
import React from "react";

export default function Table({ columns = [], rows = [], actions }) {
  return (
    <table className="w-full border-collapse">
      <thead>
        <tr>
          {columns.map(c => <th key={c.key} className="text-left p-2 text-xs text-slate-600 border-b">{c.label}</th>)}
          <th className="text-right p-2 text-xs text-slate-600 border-b">Actions</th>
        </tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.id || r.fields?.Id || Math.random()}>
            {columns.map(c => <td key={c.key} className="p-2 border-b text-sm">{c.render ? c.render(r) : (r.fields?.[c.key] ?? "—")}</td>)}
            <td className="p-2 border-b text-right">{actions ? actions(r) : null}</td>
          </tr>
        ))}
        {!rows.length && <tr><td colSpan={columns.length+1} className="p-4 text-sm text-slate-500">No rows</td></tr>}
      </tbody>
    </table>
  );
}
