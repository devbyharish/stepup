// src/components/RecordViewModal.jsx
import React from "react";

export default function RecordViewModal({
  title = "Details",
  record = null,
  fields = [],
  isAdmin = false,
  onEdit,
  onClose
}) {
  if (!record) return null;
  const stop = e => e.stopPropagation();

  return (
    <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50" onClick={onClose}>
      <div className="modal-card w-full max-w-2xl" onClick={stop}>
        <div className="flex-between" style={{marginBottom:8}}>
          <div>
            <h3 style={{margin:0, color:'var(--brand-navy)'}}>{title}</h3>
            <div className="muted" style={{marginTop:6}}>{record?.Title || ''}</div>
          </div>

          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            {isAdmin && typeof onEdit === "function" && (
              <button onClick={onEdit} className="btn-primary">Edit</button>
            )}
            <button onClick={onClose} className="btn-ghost">Close</button>
          </div>
        </div>

        <div style={{height:1, background:'rgba(15,43,61,0.04)', margin:'10px 0'}} />

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          {fields.map(f => (
            <div key={f.key}>
              <div className="small muted">{f.label}</div>
              <div style={{fontWeight:600, marginTop:6}}>{record[f.key] ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
