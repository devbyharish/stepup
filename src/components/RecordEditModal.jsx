// src/components/RecordEditModal.jsx
import React, { useState, useEffect } from "react";

export default function RecordEditModal({ title = "Edit", record = {}, fields = [], onSave, onClose }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { setForm(record ? { ...record } : {}); }, [record]);

  const handleChange = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const submit = async () => {
    setErr("");
    if (!onSave || typeof onSave !== "function") {
      setErr("Save handler not provided");
      return;
    }
    try {
      setSaving(true);
      await onSave(form);
    } catch (e) {
      setErr(e?.message || "Failed to save");
      throw e;
    } finally {
      setSaving(false);
    }
  };

  if (!record) return null;

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={onClose}>
      <div className="modal-card w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <div className="flex-between" style={{marginBottom:10}}>
          <div>
            <h3 style={{margin:0, color:'var(--brand-navy)'}}>{title}</h3>
            <div className="muted" style={{marginTop:6}}>{record?.Title || ''}</div>
          </div>
          <button onClick={onClose} className="btn-ghost">Close</button>
        </div>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12}}>
          {fields.map(f => {
            const val = form[f.key] ?? "";
            if (f.type === "select") {
              return (
                <div key={f.key}>
                  <div className="small muted" style={{marginBottom:6}}>{f.label}</div>
                  <select value={val} onChange={(e)=>handleChange(f.key, e.target.value)} className="search-input">
                    <option value="">— select —</option>
                    {(f.options||[]).map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              );
            }
            return (
              <div key={f.key}>
                <div className="small muted" style={{marginBottom:6}}>{f.label}</div>
                <input value={val} onChange={(e)=>handleChange(f.key, e.target.value)} className="search-input" />
              </div>
            );
          })}
        </div>

        {err && <div style={{color:'#ef4444', marginTop:12}}>{err}</div>}

        <div style={{display:'flex', justifyContent:'flex-end', gap:10, marginTop:18}}>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
          <button onClick={submit} className="btn-primary">{saving ? "Saving…" : "Save"}</button>
        </div>
      </div>
    </div>
  );
}
