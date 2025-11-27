// src/components/AddStudentModal.jsx
import React, { useState } from "react";
import { createItem } from "../lib/graphClient";

export default function AddStudentModal({ onClose, onAdded }) {
  const [form, setForm] = useState({ Title: "", StudentId: "", Class: "", Section: "", DOB: "", Status: "Active" });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const onSubmit = async () => {
    setSaving(true);
    setErr(null);
    try {
      const created = await createItem("students", form);
      // Graph returns complex object; try to normalize
      const normalized = (created.id || created.ID) ? (created) : { id: created.id || created.ID || `mock_${Date.now()}`, ...form };
      onAdded && onAdded(normalized);
    } catch (e) {
      console.error("AddStudentModal create failed", e);
      setErr(e?.message || "Create failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Add Student</h3>
          <button onClick={onClose} className="text-slate-500">Close</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <input placeholder="Name" value={form.Title} onChange={e=>onChange("Title", e.target.value)} className="border rounded px-3 py-2" />
          <input placeholder="Student ID" value={form.StudentId} onChange={e=>onChange("StudentId", e.target.value)} className="border rounded px-3 py-2" />
          <input placeholder="Class" value={form.Class} onChange={e=>onChange("Class", e.target.value)} className="border rounded px-3 py-2" />
          <input placeholder="Section" value={form.Section} onChange={e=>onChange("Section", e.target.value)} className="border rounded px-3 py-2" />
          <input type="date" value={form.DOB} onChange={e=>onChange("DOB", e.target.value)} className="border rounded px-3 py-2" />
          <select value={form.Status} onChange={e=>onChange("Status", e.target.value)} className="border rounded px-3 py-2">
            <option>Active</option><option>Inactive</option><option>Alumni</option>
          </select>
        </div>

        {err && <div className="text-red-600 mt-3">{err}</div>}

        <div className="mt-4 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1 rounded border">Cancel</button>
          <button onClick={onSubmit} disabled={saving} className="px-4 py-2 rounded text-white" style={{ background: "var(--brand-primary)" }}>
            {saving ? "Saving..." : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}
