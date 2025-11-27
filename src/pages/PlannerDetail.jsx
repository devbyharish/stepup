// -------------------------
// src/pages/PlannerDetail.jsx
// -------------------------
import React, { useEffect, useState } from 'react';
import { fetchItem, updateItem } from '../lib/graphClient';

export default function PlannerDetail({ id, role }) {
  const [planner, setPlanner] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});

  useEffect(() => {
    (async () => {
      const it = await fetchItem('lessonPlans', id);
      setPlanner(it);
      setForm(it || {});
    })();
  }, [id]);

  async function save() {
    await updateItem('lessonPlans', id, form);
    setPlanner(form);
    setEditing(false);
  }

  async function submitForApproval() {
    await updateItem('lessonPlans', id, { Status: 'Submitted' });
    setPlanner({...planner, Status: 'Submitted'});
  }

  async function approve() {
    await updateItem('lessonPlans', id, { Status: 'Approved' });
    setPlanner({...planner, Status: 'Approved'});
  }

  if (!planner) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">{planner.Title}</h2>
          <div className="text-sm text-slate-500">{planner.Class} • {planner.Teacher}</div>
        </div>
        <div className="flex gap-2">
          {role === 'educator' && planner.Status === 'Draft' && <button onClick={submitForApproval} className="px-3 py-2 bg-orange-500 text-white rounded">Submit</button>}
          {role === 'supervisor' && planner.Status === 'Submitted' && <button onClick={approve} className="px-3 py-2 bg-green-600 text-white rounded">Approve</button>}
          {(role === 'opsadmin' || role === 'sysadmin') && <button onClick={()=>setEditing(e=>!e)} className="px-3 py-2 border rounded">{editing?'Cancel':'Edit'}</button>}
        </div>
      </div>

      <div className="bg-white rounded shadow p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-500">From</label>
          <div className="mt-1">{editing ? <input type="date" className="border p-2" value={form.FromDate||''} onChange={e=>setForm({...form, FromDate:e.target.value})} /> : <div className="p-2">{planner.FromDate}</div>}</div>
        </div>
        <div>
          <label className="text-xs text-slate-500">To</label>
          <div className="mt-1">{editing ? <input type="date" className="border p-2" value={form.ToDate||''} onChange={e=>setForm({...form, ToDate:e.target.value})} /> : <div className="p-2">{planner.ToDate}</div>}</div>
        </div>

        <div className="md:col-span-2">
          <label className="text-xs text-slate-500">Summary</label>
          <div className="mt-1">{editing ? <textarea rows={6} className="border p-2 w-full" value={form.Summary||''} onChange={e=>setForm({...form, Summary:e.target.value})} /> : <div className="p-2">{planner.Summary}</div>}</div>
        </div>

        <div className="md:col-span-2">
          <div className="flex justify-between items-center">
            <div className="text-sm text-slate-500">Status</div>
            <div className="text-sm font-semibold">{planner.Status || 'Draft'}</div>
          </div>

          {editing && <div className="mt-2 flex gap-2">
            <button onClick={save} className="px-3 py-2 bg-indigo-600 text-white rounded">Save</button>
            <button onClick={()=>setEditing(false)} className="px-3 py-2 border rounded">Cancel</button>
          </div>}
        </div>
      </div>
    </div>
  );
}
