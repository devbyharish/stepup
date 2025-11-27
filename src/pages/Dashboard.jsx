import React from "react";
import Page from "../components/Page";

function Card({ title, value, sub }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border">
      <div className="text-xs text-[var(--muted)]">{title}</div>
      <div className="text-2xl font-semibold text-[var(--brand-navy)] mt-1">{value}</div>
      {sub && <div className="text-sm text-[var(--muted)] mt-1">{sub}</div>}
    </div>
  );
}

export default function Dashboard({ role }) {
  const cards = role==='educator' ? [
    { title:'Today — Class', value:'2A', sub:'25 students' },
    { title:'My Planners', value:'3', sub:'1 pending' },
    { title:'Attendance', value:'Open', sub:'Mark now' },
    { title:'Avg Score', value:'78%', sub:'Class 2A' }
  ] : role==='supervisor' ? [
    { title:'Pending Approvals', value:'4' },
    { title:'Teachers needing help', value:'2' },
    { title:'Average Score (All)', value:'72%' },
    { title:'Absent Today', value:'12' }
  ] : [
    { title:'Total Students', value:'420' },
    { title:'Active Educators', value:'18' },
    { title:'Pending Imports', value:'0' },
    { title:'System Health', value:'OK' }
  ];

  return (
    <Page title="Home" subtitle="Quick overview">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c,i)=> <Card key={i} {...c} />)}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="col-span-2 bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm text-[var(--muted)]">Class Performance</div>
          <svg viewBox="0 0 200 60" className="w-full mt-3">
            <rect x="0" y="20" width="40" height="40" rx="4" fill="url(#g1)"></rect>
            <rect x="50" y="10" width="40" height="50" rx="4" fill="url(#g1)"></rect>
            <rect x="100" y="30" width="40" height="30" rx="4" fill="url(#g1)"></rect>
            <defs><linearGradient id="g1" x1="0" x2="1"><stop offset="0" stopColor="var(--brand-primary)"/><stop offset="1" stopColor="var(--brand-navy)"/></linearGradient></defs>
          </svg>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm">
          <div className="text-sm text-[var(--muted)]">Recent Activity</div>
          <ul className="mt-3 text-sm space-y-2">
            <li className="flex justify-between"><div>Planner submitted — Ms Priya</div><div className="text-[var(--muted)]">2h ago</div></li>
            <li className="flex justify-between"><div>Leave approved — Mr Arun</div><div className="text-[var(--muted)]">1d ago</div></li>
          </ul>
        </div>
      </div>
    </Page>
  );
}
