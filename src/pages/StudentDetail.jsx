// src/pages/StudentDetail.jsx
import React, { useEffect, useState } from "react";
import { fetchItem, updateItem } from "../lib/graphClient";
import { useAuth } from "../lib/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import dayjs from "dayjs";

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || "educator";
  const isAdmin = role === "opsadmin" || role === "sysadmin";

  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(()=>{
    let mounted = true;
    (async ()=>{
      setLoading(true);
      try {
        const it = await fetchItem("students", id);
        if (!mounted) return;
        setItem(it);
        setForm({
          Title: it.Title || "",
          StudentId: it.StudentId || "",
          Class: it.Class || "",
          Section: it.Section || "",
          DOB: it.DOB ? dayjs(it.DOB).format("YYYY-MM-DD") : "",
          Status: it.Status || "Active"
        });
      } catch(e){
        console.error("StudentDetail fetch error", e);
        setErr(e?.message || "Failed to load");
      } finally { if (mounted) setLoading(false); }
    })();
    return ()=> mounted = false;
  }, [id]);

  if (loading) return <div className="p-6">Loading...</div>;
  if (err) return <div className="p-6 text-red-600">Error: {err}</div>;
  if (!item) return <div className="p-6">Student not found.</div>;

  const onChange = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const onSave = async () => {
    setSaving(true);
    try {
      await updateItem("students", item.id, form);
      // reload item
      const updated = await fetchItem("students", item.id);
      setItem(updated);
      setEditing(false);
    } catch (e) {
      console.error("save failed", e);
      setErr(e?.message || "Save failed");
    } finally { setSaving(false); }
  };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-semibold">{item.Title || "—"}</h2>
          <div className="text-sm text-slate-500">Student ID: {item.StudentId || "—"}</div>
        </div>

        <div className="flex items-center gap-2">
          {isAdmin && !editing && (
            <button onClick={()=>setEditing(true)} className="px-3 py-1 rounded" style={{ background: "var(--brand-primary)", color: "white" }}>
              Edit
            </button>
          )}
          {editing && (
            <>
              <button onClick={onSave} disabled={saving} className="px-3 py-1 rounded bg-[var(--brand-navy)] text-white">Save</button>
              <button onClick={()=>{ setEditing(false); setForm({ ...form, ...{ Title: item.Title } }) }} className="px-3 py-1 rounded border">Cancel</button>
            </>
          )}
          <button onClick={()=>navigate(-1)} className="px-3 py-1 rounded border">Back</button>
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow-sm grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-slate-600">Name</label>
          <input value={form.Title} onChange={e=>onChange("Title", e.target.value)} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Student ID</label>
          <input value={form.StudentId} onChange={e=>onChange("StudentId", e.target.value)} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Class</label>
          <input value={form.Class} onChange={e=>onChange("Class", e.target.value)} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Section</label>
          <input value={form.Section} onChange={e=>onChange("Section", e.target.value)} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">DOB</label>
          <input type="date" value={form.DOB} onChange={e=>onChange("DOB", e.target.value)} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2" />
        </div>
        <div>
          <label className="text-sm text-slate-600">Status</label>
          <select value={form.Status} onChange={e=>onChange("Status", e.target.value)} disabled={!editing} className="mt-1 block w-full border rounded px-3 py-2">
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Alumni">Alumni</option>
          </select>
        </div>
      </div>

      {err && <div className="mt-4 text-red-600">{err}</div>}
    </div>
  );
}
