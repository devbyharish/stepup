// src/App.jsx
import React from "react";
import { Routes, Route, useLocation } from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import StudentsList from "./pages/StudentsList";
import StudentDetail from "./pages/StudentDetail";
import PlannerList from "./pages/PlannerList";
import PlannerDetail from "./pages/PlannerDetail";

import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";

import { useAuth } from "./lib/useAuth";
import useRole from "./hooks/useRole";
// near other imports at top of file
import UserManagement from "./pages/OpsAdmin/UserManagement";


export default function App() {
  const { user, loading: authLoading } = useAuth();
  const location = useLocation();

  // Fetch roles from SharePoint (ALWAYS)
  const {
    availableRoles,
    activeRole,
    switchRole,
    refreshRoles,
    loading: rolesLoading
  } = useRole(user);

  // Effective role selection
  const effectiveRole = activeRole || user?.role || "educator";

  // Breadcrumb title
  const pageTitle = (() => {
    if (location.pathname.startsWith("/students")) return "Students Directory";
    if (location.pathname.startsWith("/planners")) return "Planners";
    if (location.pathname.startsWith("/attendance")) return "Attendance";
    if (location.pathname.startsWith("/assessments")) return "Assessments";
    return "Home";
  })();

  if (authLoading || rolesLoading) {
    return (
      <div className="w-full h-screen flex items-center justify-center text-slate-600">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F3F2F1]">

      {/* LEFT SIDEBAR */}
      <Sidebar
        role={effectiveRole}
        availableRoles={availableRoles}
        activeRole={activeRole}
        onSwitchRole={switchRole}
        userDisplay={user?.name}
        userEmail={user?.username}
      />

      {/* RIGHT CONTENT AREA */}
      <div className="flex flex-col flex-1">

        {/* TOP HEADER (Breadcrumb-only) */}
        <Header title={pageTitle} />

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<div className="p-6">Welcome — select a page</div>} />

              <Route
                path="/students"
                element={
                  <ProtectedRoute allowed={["*"]}>
                    <StudentsList role={effectiveRole} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/students/:id"
                element={
                  <ProtectedRoute allowed={["*"]}>
                    <StudentDetail role={effectiveRole} />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/users"
              element={
                <ProtectedRoute allowed={["opsadmin","sysadmin"]}>
                  <UserManagement />
                </ProtectedRoute>
                }
              />
              <Route
                path="/planners"
                element={
                  <ProtectedRoute allowed={["educator", "supervisor", "sysadmin"]}>
                    <PlannerList role={effectiveRole} />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/planners/:id"
                element={
                  <ProtectedRoute allowed={["educator", "supervisor", "sysadmin"]}>
                    <PlannerDetail role={effectiveRole} />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<div className="p-6">Page not found</div>} />
            </Routes>
          </ErrorBoundary>
        </div>
      </div>
    </div>
  );
}
