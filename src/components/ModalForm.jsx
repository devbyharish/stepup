// src/components/ModalForm.jsx
import React from "react";
export default function ModalForm({ visible, title, onClose, children }) {
  if (!visible) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-xl p-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <button onClick={onClose} className="text-sm text-slate-500">Close</button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </div>
  );
}
