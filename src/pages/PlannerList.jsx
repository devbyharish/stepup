import React, {useEffect, useState} from "react";
import { useParams } from "react-router-dom";
import Page from "../components/Page";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";
import { fetchItem, updateItem } from "../lib/graphClient";

export default function PlannerDetail({ role }) {
  const { id } = useParams();
  const [plan, setPlan] = useState(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({});

  useEffect(()=>{ if(!id) return; (async()=>{ const it = await fetchItem('lessonPlans', id); setPlan(it); setForm(it||{}); })(); }, [id]);

  async function save(){ await updateItem('lessonPlans', id, form); setPlan(form); setEdit(false); }
  async function submitForApproval(){ await updateItem('lessonPlans', id, { Status:'Submitted' }); setPlan({...plan, Status:'Submitted'}); }
  async function approve(){ await updateItem('lessonPlans', id, { Status:'Approved' }); setPlan({...plan, Status:'Approved'}); }

  if(!plan) return <div className="p-6">Loading...</div>;

  return (
    <Page title={plan.Title} subtitle={`${plan.Class} • ${plan.Teacher}`} actions={<div className="flex gap-2">
      { role==='educator' && plan.Status==='Draft' && <Button onClick={submitForApproval}>Submit</Button> }
      { role==='supervisor' && plan.Status==='Submitted' && <Button variant="accent" onClick={approve}>Approve</Button> }
      {(role==='opsadmin'||role==='sysadmin') && <Button onClick={()=>setEdit(v=>!v)} variant="navy">{edit? 'Cancel':'Edit'}</Button>}
    </div>}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-[var(--muted)]">From</div>
          {edit ? <input type="date" className="border p-2 rounded w-full" value={form.FromDate||''} onChange={e=>setForm({...form, FromDate:e.target.value})} /> : <div className="p-2">{plan.FromDate}</div>}
        </div>
        <div>
          <div className="text-xs text-[var(--muted)]">To</div>
          {edit ? <input type="date" className="border p-2 rounded w-full" value={form.ToDate||''} onChange={e=>setForm({...form, ToDate:e.target.value})} /> : <div className="p-2">{plan.ToDate}</div>}
        </div>
        <div className="md:col-span-2">
          <div className="text-xs text-[var(--muted)]">Summary</div>
          {edit ? <textarea rows={6} className="border p-2 rounded w-full" value={form.Summary||''} onChange={e=>setForm({...form, Summary:e.target.value})} /> : <div className="p-3 bg-slate-50 rounded">{plan.Summary}</div>}
        </div>

        <div className="md:col-span-2 flex items-center justify-between">
          <div><div className="text-xs text-[var(--muted)]">Status</div><div className="mt-1"><Badge status={plan.Status||'Draft'} /></div></div>
          {edit && <div className="flex gap-2"><Button onClick={save}>Save</Button><button className="px-3 py-2 border rounded" onClick={()=>setEdit(false)}>Cancel</button></div>}
        </div>
      </div>
    </Page>
  );
}
