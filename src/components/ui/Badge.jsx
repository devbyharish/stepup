import React from "react";
const styles = {
  Draft: "bg-slate-100 text-slate-700",
  Submitted: "bg-[#fff7cc] text-[#b56a00]",
  Approved: "bg-[#ecfdf5] text-[#065f46]",
  InProgress: "bg-[#eef2ff] text-[#3730a3]",
  SignedOff: "bg-[#ddf7e9] text-[#065f46]",
  Rejected: "bg-[#fff1f2] text-[#b91c1c]"
};
export default function Badge({ status }) {
  return <span className={`px-3 py-1 text-xs rounded-full ${styles[status]||"bg-slate-100 text-slate-700"}`}>{status||'—'}</span>;
}
