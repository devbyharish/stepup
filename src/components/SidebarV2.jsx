// components/SidebarV2.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { HomeIcon, UsersIcon, ClipboardListIcon, BookOpenIcon, CalendarIcon, CogIcon, ChartBarIcon } from '@heroicons/react/24/outline';

const menu = [
  { id: 'home', label: 'Home', to: '/', roles: ['sysadmin','opsadmin','educator','supervisor'], icon: HomeIcon },
  { id: 'students', label: 'Students', to: '/students', roles: ['sysadmin','opsadmin','educator','supervisor'], icon: UsersIcon },
  { id: 'manage-students', label: 'Manage Students', to: '/students/manage', roles: ['sysadmin','opsadmin'], icon: UsersIcon },
  { id: 'planners', label: 'Planners', to: '/planners', roles: ['sysadmin','educator','supervisor'], icon: BookOpenIcon },
  { id: 'attendance', label: 'Attendance', to: '/attendance', roles: ['sysadmin','opsadmin','educator','supervisor'], icon: CalendarIcon },
  { id: 'assessments', label: 'Assessments', to: '/assessments', roles: ['sysadmin','opsadmin','educator','supervisor'], icon: ClipboardListIcon },
  { id: 'requests', label: 'Leaves', to: '/requests', roles: ['sysadmin','educator','supervisor'], icon: ClipboardListIcon },
  { id: 'teacher-dashboard', label: 'Teacher Performance', to: '/teacher-dashboard', roles: ['sysadmin','supervisor'], icon: ChartBarIcon },
  { id: 'admin', label: 'Admin', to: '/admin', roles: ['sysadmin'], icon: CogIcon }
];

export default function SidebarV2({ role }) {
  const [open, setOpen] = useState(true);
  const loc = useLocation();

  return (
    <aside className={`h-screen bg-white border-r ${open ? 'w-64' : 'w-16'} transition-all`}>
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-slate-800 text-white flex items-center justify-center font-bold">SU</div>
          {open && <div>
            <div className="text-lg font-semibold">StepUp</div>
            <div className="text-xs text-slate-500">Role: {role}</div>
          </div>}
        </div>
        <button className="p-1" onClick={()=>setOpen(v=>!v)} aria-label="toggle sidebar">
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 18h16" stroke="currentColor" strokeWidth="2"/></svg>
        </button>
      </div>

      <nav className="p-2 space-y-1">
        {menu.map(m => {
          if (!m.roles.includes(role)) return null;
          const Icon = m.icon;
          const active = loc.pathname === m.to;
          return (
            <Link key={m.id} to={m.to} className={`flex items-center gap-3 p-2 rounded ${active ? 'bg-slate-100' : 'hover:bg-slate-50'}`}>
              <Icon className="w-5 h-5" />
              {open && <span className="text-sm">{m.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-3 border-t text-xs text-slate-500">
        {open ? 'v1.0 • StepUp' : 'v1.0'}
      </div>
    </aside>
  );
}
