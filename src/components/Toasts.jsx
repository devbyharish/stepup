// src/components/Toasts.jsx
import React, { useEffect, useState } from "react";
export function Toast({ message = "" }) {
  const [show, setShow] = useState(!!message);
  useEffect(()=> { setShow(!!message); if (message) { const t = setTimeout(()=>setShow(false), 3500); return ()=>clearTimeout(t); } }, [message]);
  if (!show) return null;
  return <div className="fixed bottom-6 right-6 bg-slate-800 text-white px-4 py-2 rounded">{message}</div>;
}
