// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  BookOpenIcon,
  CalendarIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";
import RoleSelector from "./RoleSelector";
import logoImg from "../assets/logo.png";

const menu = [
  { id: "home", to: "/", label: "Dashboard", roles: ["*"], icon: HomeIcon },
  { id: "students", to: "/students", label: "Students", roles: ["educator","opsadmin","supervisor","sysadmin"], icon: UsersIcon },
  { id: "planners", to: "/planners", label: "Planners", roles: ["educator","supervisor","sysadmin"], icon: BookOpenIcon },
  { id: "attendance", to: "/attendance", label: "Attendance", roles: ["educator","supervisor","sysadmin"], icon: CalendarIcon },
  { id: "assessments", to: "/assessments", label: "Assessments", roles: ["educator","supervisor","sysadmin"], icon: ClipboardDocumentListIcon },
  { id: "teacher-dashboard", to: "/teacher-dashboard", label: "Performance", roles: ["supervisor","sysadmin"], icon: ChartBarIcon },
   // Admin area - visible only to sysadmin / opsadmin
  { id: "manage-users", to: "/admin/users", label: "User Roles", roles: ["opsadmin","sysadmin"], icon: Cog6ToothIcon },
  { id: "admin", to: "/admin", label: "Admin", roles: ["sysadmin"], icon: Cog6ToothIcon },
];

export default function Sidebar({
  role,
  userDisplay,
  userEmail,
  availableRoles = [],
  activeRole = null,
  onSwitchRole = () => {}
}) {

  const loc = useLocation();
  const [open, setOpen] = useState(true);
  const effectiveRole = activeRole || role || "";

  useEffect(() => {
    console.log("Sidebar props:", { role, userDisplay, userEmail, activeRole, availableRoles });
  }, [role, userDisplay, userEmail, activeRole, availableRoles]);

  const roleOptions = (availableRoles || []).map(r => {
    if (!r) return null;
    if (typeof r === "string") return { value: r, label: r };
    const val = r.role || r.Role || r.value || (r.fields && (r.fields.Role || r.fields.Title)) || r.Title || r.id;
    const label = r.displayName || r.DisplayName || val;
    return { value: String(val || ""), label: String(label || val || "") };
  }).filter(Boolean);

  const currentRoleValue = activeRole || role || (roleOptions[0] && roleOptions[0].value) || "";

  return (
    <aside className={`h-screen bg-white border-r border-slate-200 shadow-sm transition-all ${open ? "w-64" : "w-20"}`}>
      <div className="p-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3">
          <img src={logoImg} alt="logo" className="w-9 h-9 rounded-full border object-cover" />
          {open && (
            <div className="leading-tight">
              <div className="text-xs text-slate-600">First Step Academy</div>
              <div className="font-semibold text-[var(--brand-navy)]">StepUp</div>
            </div>
          )}
        </div>

        <button onClick={() => setOpen(!open)} className="text-slate-400 hover:text-slate-600 p-1" aria-label="Toggle sidebar">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeWidth="2" strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <nav className="mt-3">
        {menu.map((item) => {
          const Icon = item.icon;
          if (!item.roles.includes("*") && (!effectiveRole || !item.roles.includes(effectiveRole))) return null;

          const active = loc.pathname === item.to || (item.to !== "/" && loc.pathname.startsWith(item.to));
          return (
            <Link
              key={item.id}
              to={item.to}
              className={`flex items-center gap-3 mx-3 my-1 rounded-lg px-4 py-3 text-sm transition-all ${
                active
                  ? "bg-[var(--brand-primary)]/10 text-[var(--brand-navy)] font-semibold shadow-sm border-l-4 border-[var(--brand-primary)]"
                  : "text-[var(--brand-navy)]/70 hover:bg-slate-100 hover:text-[var(--brand-navy)]"
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? "text-[var(--brand-primary)]" : "text-[var(--brand-navy)]/50"}`} />
              {open && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* bottom user card + role selector */}
      <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
            {String(userDisplay || (window.auth?.getAccount && window.auth.getAccount()?.name) || "U")
              .split(" ")
              .map(s => s[0])
              .slice(0,2)
              .join("")}
          </div>

          {open && (
            <div className="flex-1">
              {/* show display name or fallback to MSAL account */}
              <p className="text-sm font-semibold text-gray-700">
                {userDisplay || (window.auth?.getAccount && window.auth.getAccount()?.name) || ""}
              </p>
              <p className="text-xs text-gray-500">
                {userEmail || (window.auth?.getAccount && window.auth.getAccount()?.username) || ""}
              </p>

              {/* wrap selector in a capped container so it doesn't stretch full width */}
              <div className="mt-2 max-w-[220px]">
                <RoleSelector
                  availableRoles={availableRoles}
                  activeRole={activeRole || ""}
                  onSwitchRole={onSwitchRole}
                  size="small"
                />
              </div>
            </div>
          )}
        </div>
      </div>

    </aside>
  );
}
