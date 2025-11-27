// components/PlannerCard.jsx
export default function PlannerCard({ planner, onEdit, onSubmit, onApprove, onSignoff, role }) {
  return (
    <div className="bg-white p-4 rounded border shadow-sm">
      <div className="flex justify-between">
        <div>
          <div className="text-sm font-semibold">{planner.title}</div>
          <div className="text-xs text-slate-500">{planner.class} • {planner.teacher}</div>
        </div>
        <div className="text-right">
          <div className="text-xs">{planner.from} → {planner.to}</div>
          <div className={`mt-2 inline-block px-2 py-1 text-xs rounded ${planner.status==='Draft'?'bg-slate-100':planner.status==='Submitted'?'bg-orange-100':'bg-green-100'}`}>{planner.status}</div>
        </div>
      </div>

      <div className="mt-3 text-sm text-slate-700">{planner.summary}</div>

      <div className="mt-3 flex gap-2">
        {role === 'educator' && planner.status === 'Draft' && <button onClick={()=>onSubmit(planner)} className="px-3 py-1 rounded bg-blue-600 text-white">Submit</button>}
        {role === 'educator' && planner.status === 'InProgress' && <button onClick={()=>onSignoff(planner)} className="px-3 py-1 rounded bg-indigo-600 text-white">Send For Signoff</button>}
        {role === 'supervisor' && planner.status === 'Submitted' && <button onClick={()=>onApprove(planner)} className="px-3 py-1 rounded bg-green-600 text-white">Approve</button>}
        {role === 'supervisor' && (planner.status === 'SentForSignoff') && <button onClick={()=>onSignoff(planner)} className="px-3 py-1 rounded bg-green-700 text-white">Sign off</button>}
        {(role === 'opsadmin' || role === 'sysadmin') && <button onClick={()=>onEdit(planner,true)} className="px-3 py-1 rounded border">Edit</button>}
      </div>
    </div>
  );
}
