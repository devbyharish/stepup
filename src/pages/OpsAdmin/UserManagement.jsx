// src/pages/OpsAdmin/UserManagement.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { SITE_ID, LISTS } from "../../config/sharepoint";

import { useAuth } from "../../lib/useAuth";
import useRole from "../../hooks/useRole";

import SearchBar from "../../components/ListControls/SearchBar";
import FiltersBar from "../../components/ListControls/FiltersBar";
import useListControls from "../../hooks/useListControls";

import ModalForm from "../../components/ModalForm";
import RoleSelector from "../../components/RoleSelector";
import AddUserModal from "../../components/AddUserModal"; // optional if you have one; fallback to internal modal used below
import RecordViewModal from "../../components/RecordViewModal"; // optional
import { Toast } from "../../components/Toasts";

/* ----------------------------- constants ----------------------------- */
const DEFAULT_ROLE_FIELD = "DefaultRole";
const ROLE_FIELD = "Role";
const UPN_FIELD = "UserPrincipalName";
const DISPLAY_FIELD = "DisplayName";
const TITLE_FIELD = "Title";

const ALLOWED_ASSIGN = [{ value: "educator", label: "Educator" }];

/* ----------------------------- Graph helpers (same as before) ----------------------------- */
async function getTokenOrThrow() {
  if (!window?.auth?.getToken) throw new Error("window.auth.getToken() missing");
  const t = await window.auth.getToken();
  if (!t) throw new Error("No token returned");
  return t;
}

function graphBase(siteId) {
  const enc = encodeURIComponent(siteId);
  return `https://graph.microsoft.com/v1.0/sites/${enc}`;
}

async function graphFetch(siteId, path, opts = {}) {
  const token = await getTokenOrThrow();
  const url = `${graphBase(siteId)}${path}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(opts.headers || {}) },
    method: opts.method || "GET",
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { json = text; }
  if (!res.ok) {
    const err = new Error(`Graph ${res.status}: ${JSON.stringify(json)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function listItems(siteId, listId, rawQuery = "") {
  const q = rawQuery ? `?${rawQuery}` : "?$expand=fields";
  const path = q.includes("$expand=fields") ? `/lists/${listId}/items${q}` : `/lists/${listId}/items${q}&$expand=fields`;
  return await graphFetch(siteId, path);
}
async function createItem(siteId, listId, fieldsObj) {
  return await graphFetch(siteId, `/lists/${listId}/items`, { method: "POST", body: { fields: fieldsObj } });
}
async function deleteItem(siteId, listId, itemId) {
  await graphFetch(siteId, `/lists/${listId}/items/${itemId}`, { method: "DELETE" });
  return true;
}
async function patchFields(siteId, listId, itemId, patchObj) {
  return await graphFetch(siteId, `/lists/${listId}/items/${itemId}/fields`, { method: "PATCH", body: patchObj });
}

/* ----------------------------- Main component ----------------------------- */
export default function UserManagement({ role: roleProp }) {
  // auth + server-driven roles
  const { user } = useAuth();
  const { availableRoles: availableRolesFromHook = [], activeRole: activeRoleFromHook = null, loading: rolesHookLoading = false } = useRole(user);

  // UI state
  const [rows, setRows] = useState([]); // raw rows from SP (id, fields)
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false); // modal assign
  const [form, setForm] = useState({ upn: "", displayName: "", role: "educator" });
  const [toast, setToast] = useState("");
  const [aadUsers, setAadUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const listId = LISTS.userRoles;
  const siteId = SITE_ID;

  // effective role (prefer server-driven activeRole)
  const effectiveRole = roleProp || activeRoleFromHook || window.__STEPUP_DEBUG_ACTIVE_ROLE__ || window.__STEPUP_ACTIVE_ROLE__ || (user && user.role) || null;
  const isAdmin = effectiveRole === "opsadmin" || effectiveRole === "sysadmin";

  /* ----------------------------- list controls (search/filter/sort) ----------------------------- */
  // defaults: search empty, filter role/all/default, sort by DisplayName
  const controls = useListControls({ search: "", filters: {}, sortBy: "DisplayName", sortDir: "asc", debounceMs: 250 });

  /* ----------------------------- load roles ----------------------------- */
  const loadRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listItems(siteId, listId, "$expand=fields&$top=500");
      const mapped = (res.value || []).map(r => ({ id: r.id, fields: r.fields || {}, raw: r }));
      setRows(mapped);
    } catch (e) {
      console.error("Load roles failed", e);
      setToast("Failed to load roles");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [siteId, listId]);

  useEffect(() => { loadRoles(); }, [loadRoles]);

  /* ----------------------------- load aad users for modal dropdown ----------------------------- */
  const loadAadUsers = useCallback(async () => {
    setLoadingUsers(true);
    try {
      const res = await graphFetch(siteId, `/users?$select=id,displayName,userPrincipalName&$top=999`);
      setAadUsers((res.value || []).map(u => ({ label: u.displayName || u.userPrincipalName, value: u.userPrincipalName })));
    } catch (e) {
      console.warn("Could not load AAD users", e);
      setToast("Could not load AAD users");
      setAadUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [siteId]);

  useEffect(() => { if (open && aadUsers.length === 0 && !loadingUsers) loadAadUsers(); }, [open, aadUsers.length, loadingUsers, loadAadUsers]);

  /* ----------------------------- duplicate check ----------------------------- */
  const checkDuplicate = useCallback(async (upn) => {
    if (!upn) return false;
    const safe = upn.replace(/'/g, "''");
    try {
      const res = await listItems(siteId, listId, `$expand=fields&$filter=fields/${UPN_FIELD} eq '${safe}'&$top=1`);
      return !!(res.value && res.value.length > 0);
    } catch (e) {
      console.warn("duplicate check failed", e);
      return false;
    }
  }, [siteId, listId]);

  /* ----------------------------- create assignment ----------------------------- */
  const onCreate = async () => {
    try {
      if (!form.upn || !form.role) { setToast("UPN and role required"); return; }
      if (form.role !== "educator") { setToast("Only 'educator' allowed here"); return; }

      const dup = await checkDuplicate(form.upn);
      if (dup) { setToast("User already assigned"); return; }

      const payload = { [UPN_FIELD]: form.upn, [ROLE_FIELD]: form.role, [DISPLAY_FIELD]: form.displayName || form.upn, [TITLE_FIELD]: form.displayName || form.upn };
      await createItem(siteId, listId, payload);
      setToast("Assignment created");
      setOpen(false);
      setForm({ upn: "", displayName: "", role: "educator" });
      await loadRoles();
    } catch (e) {
      console.error("assign failed", e);
      setToast("Assign failed");
    }
  };

  /* ----------------------------- revoke ----------------------------- */
  const onRemove = useCallback(async (row) => {
    try {
      if (!row?.id) throw new Error("Row id missing");
      await deleteItem(siteId, listId, row.id);
      setToast("Revoked");
      await loadRoles();
    } catch (e) {
      console.error("revoke failed", e);
      setToast("Failed to revoke");
    }
  }, [siteId, listId, loadRoles]);

  /* ----------------------------- set default per-user ----------------------------- */
  const setDefaultRoleOnServer = useCallback(async (rowId) => {
    try {
      const all = await listItems(siteId, listId, "$expand=fields&$top=500");
      const allRows = all.value || [];
      const target = allRows.find(r => r.id === rowId);
      if (!target) throw new Error("Target not found");

      const targetUpn = (target.fields && (target.fields[UPN_FIELD] || target.fields.UserPrincipalName)) || target[UPN_FIELD] || target.UserPrincipalName || null;
      if (!targetUpn) throw new Error("Target missing UPN");

      const safeUpn = String(targetUpn).toLowerCase();

      const toClear = allRows.filter(r => {
        if (!r.id || r.id === rowId) return false;
        const rUpn = (r.fields && (r.fields[UPN_FIELD] || r.fields.UserPrincipalName)) || r[UPN_FIELD] || r.UserPrincipalName || "";
        if (!rUpn) return false;
        if (String(rUpn).toLowerCase() !== safeUpn) return false;
        const v = r.fields?.[DEFAULT_ROLE_FIELD] ?? r[DEFAULT_ROLE_FIELD] ?? r.DefaultRole;
        if (v == null) return false;
        return (typeof v === "boolean" && v === true) || `${v}`.toLowerCase() === "true" || `${v}`.toLowerCase() === "yes";
      });

      for (const r of toClear) {
        try { await patchFields(siteId, listId, r.id, { [DEFAULT_ROLE_FIELD]: false }); } catch (e) { console.warn("clear default failed", r.id, e); }
      }
      await patchFields(siteId, listId, rowId, { [DEFAULT_ROLE_FIELD]: true });
      await loadRoles();
      setToast("Default set");
      return true;
    } catch (e) {
      console.error("setDefault failed", e);
      setToast("Failed to set default");
      throw e;
    }
  }, [siteId, listId, loadRoles]);

  /* ----------------------------- derived lists/filters ----------------------------- */
  // available role values (from rows)
  const rolesList = useMemo(() => {
    const s = Array.from(new Set(rows.map(r => (r.fields?.[ROLE_FIELD] || "").toString()).filter(Boolean)));
    s.sort();
    return s;
  }, [rows]);

  // apply search/filters/sort to rows -> visible
  const visible = useMemo(() => {
    let out = rows.slice();
    const q = (controls.debouncedSearch || "").toLowerCase();
    if (q) {
      out = out.filter(r => {
        const name = ((r.fields?.[DISPLAY_FIELD] || r.fields?.[UPN_FIELD] || "") + "").toLowerCase();
        const role = (r.fields?.[ROLE_FIELD] || "").toLowerCase();
        return name.includes(q) || role.includes(q);
      });
    }
    // filters (controls.filters.role, controls.filters.default)
    if (controls.filters?.role) out = out.filter(r => (r.fields?.[ROLE_FIELD] || "") === controls.filters.role);
    if (controls.filters?.default) {
      if (controls.filters.default === "default") out = out.filter(r => {
        const v = r.fields?.[DEFAULT_ROLE_FIELD] ?? r[DEFAULT_ROLE_FIELD];
        if (v == null) return false;
        return (typeof v === "boolean" && v === true) || `${v}`.toLowerCase() === "true" || `${v}`.toLowerCase() === "yes";
      });
      if (controls.filters.default === "not-default") out = out.filter(r => {
        const v = r.fields?.[DEFAULT_ROLE_FIELD] ?? r[DEFAULT_ROLE_FIELD];
        if (v == null) return true;
        return !((typeof v === "boolean" && v === true) || `${v}`.toLowerCase() === "true" || `${v}`.toLowerCase() === "yes");
      });
    }

    // sort
    const sortBy = controls.sortBy || "DisplayName";
    const sortDir = controls.sortDir || "asc";
    out.sort((a, b) => {
      const A = ((a.fields && (a.fields[sortBy] || "")) || "").toString().toLowerCase();
      const B = ((b.fields && (b.fields[sortBy] || "")) || "").toString().toLowerCase();
      if (A === B) return 0;
      const r = A < B ? -1 : 1;
      return sortDir === "asc" ? r : -r;
    });

    return out;
  }, [rows, controls.debouncedSearch, controls.filters, controls.sortBy, controls.sortDir]);

  /* ----------------------------- Safe early returns ----------------------------- */
  if (rolesHookLoading) {
    return <div className="p-6 text-slate-600">Loading roles…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="p-6">
        <h3 className="text-lg font-semibold">Access denied</h3>
        <p className="mt-2 text-sm text-slate-600">You need admin permissions (opsadmin / sysadmin) to view user roles.</p>
      </div>
    );
  }

  /* ----------------------------- Render (students-list style) ----------------------------- */
  const handleSortClick = (field) => {
    if (controls.sortBy === field) {
      controls.setSortDir(controls.sortDir === "asc" ? "desc" : "asc");
    } else {
      controls.setSortBy(field);
      controls.setSortDir("asc");
    }
  };
  const renderSortIndicator = (field) => {
    if (controls.sortBy !== field) return null;
    return <span className="small" aria-hidden>{controls.sortDir === "asc" ? "▲" : "▼"}</span>;
  };

  return (
    <div className="p-6">
      <div className="flex-between mb-4">
        <div>
          <h1 style={{ fontSize: 22, margin: 0 }}>User Roles</h1>
          <div className="muted" style={{ marginTop: 6 }}>Total: {rows.length} — Showing: {visible.length}</div>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 360 }}>
            <SearchBar value={controls.search} onChange={controls.setSearch} placeholder="Search name / upn / role..." />
          </div>

          <div style={{ minWidth: 240 }}>
            <FiltersBar
              filters={controls.filters}
              options={{ role: rolesList, default: ["default", "not-default"] }}
              onChange={(f) => controls.setFilters(f)}
            />
          </div>

          <button onClick={controls.resetControls} className="btn-ghost">Reset</button>

          <button onClick={() => setOpen(true)} className="btn-primary">+ Add assignment</button>
        </div>
      </div>

      <div className="surface-card table-card">
        <table className="w-full">
          <thead className="table-head">
            <tr>
              <th className="table-cell cursor-pointer" onClick={() => handleSortClick(DISPLAY_FIELD)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Name</span>{renderSortIndicator(DISPLAY_FIELD)}
                </div>
              </th>

              <th className="table-cell cursor-pointer" onClick={() => handleSortClick(UPN_FIELD)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>User</span>{renderSortIndicator(UPN_FIELD)}
                </div>
              </th>

              <th className="table-cell cursor-pointer" onClick={() => handleSortClick(ROLE_FIELD)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Role</span>{renderSortIndicator(ROLE_FIELD)}
                </div>
              </th>

              <th className="table-cell cursor-pointer" onClick={() => handleSortClick(DEFAULT_ROLE_FIELD)}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span>Default</span>{renderSortIndicator(DEFAULT_ROLE_FIELD)}
                </div>
              </th>

              <th className="table-cell">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading && <tr><td colSpan={5} className="table-cell muted">Loading...</td></tr>}
            {!loading && visible.length === 0 && <tr><td colSpan={5} className="table-cell">No roles found.</td></tr>}

            {!loading && visible.map(r => {
              const isDefault = (() => {
                const v = r.fields?.[DEFAULT_ROLE_FIELD] ?? r[DEFAULT_ROLE_FIELD];
                if (v == null) return false;
                if (typeof v === "boolean") return v;
                return ("" + v).toLowerCase() === "yes" || ("" + v).toLowerCase() === "true";
              })();

              return (
                <tr key={r.id} className="table-row">
                  <td className="table-cell">
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div className="avatar-circle" style={{ background: "var(--brand-cyan)" }}>
                        {String((r.fields?.[DISPLAY_FIELD] || r.fields?.[UPN_FIELD] || "--")).split(" ").map(x => x[0]).slice(0,2).join("")}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.fields?.[DISPLAY_FIELD] || "—"}</div>
                        <div className="small muted">{r.fields?.Title || ""}</div>
                      </div>
                    </div>
                  </td>

                  <td className="table-cell small">{r.fields?.[UPN_FIELD] || "—"}</td>
                  <td className="table-cell small">{r.fields?.[ROLE_FIELD] || "—"}</td>
                  <td className="table-cell">
                    {isDefault ? <span className="badge" style={{ background: "#eefaf6", color: "#0f9d6a", padding: "6px 10px", borderRadius: 999 }}>Default</span> : <span className="small muted">—</span>}
                  </td>

                  <td className="table-cell">
                    <div className="flex gap-2 justify-end items-center">
                      <button className="rounded-md px-3 py-1 border text-xs" onClick={() => setDefaultRoleOnServer(r.id)}>
                        Set default
                      </button>
                      <button className="rounded-md px-3 py-1 border text-xs" onClick={() => onRemove(r)}>
                        Revoke
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

          </tbody>
        </table>

        <div style={{ padding: 12, color: "rgba(15,43,61,0.5)" }}>
          Showing {visible.length} of {rows.length} roles
        </div>
      </div>

      {/* use the reusable AddUserModal (delegates create to onAssign) */}
      <AddUserModal
        visible={open}
        onClose={() => setOpen(false)}
        // called by modal when user clicks Assign; payload: { upn, displayName, role }
        onAssign={async ({ upn, displayName, role }) => {
          // keep the same validation/behavior as your onCreate
          if (!upn || !role) throw new Error("UPN and role required");
          if (role !== "educator") throw new Error("Only 'educator' allowed here");

          const dup = await checkDuplicate(upn);
          if (dup) throw new Error("User already assigned");

          const payload = {
            [UPN_FIELD]: upn,
            [ROLE_FIELD]: role,
            [DISPLAY_FIELD]: displayName || upn,
            [TITLE_FIELD]: displayName || upn,
          };

          const created = await createItem(siteId, listId, payload);
          // refresh list after successful create
          await loadRoles();
          return created;
        }}
        // optional callback for extra UI behavior after assign
        onAdded={(created) => {
          setToast("Assignment created");
          setOpen(false);
        }}
        // pass allowed roles into modal so RoleSelector shows correct options
        allowedRoles={ALLOWED_ASSIGN}
        // let modal fetch AAD users by reusing your existing loader
        loadAadUsers={async () => {
          // reuse existing graphFetch based function
          const res = await graphFetch(siteId, `/users?$select=id,displayName,userPrincipalName&$top=999`);
          return (res.value || []).map(u => ({ label: u.displayName || u.userPrincipalName, value: u.userPrincipalName }));
        }}
      />


      <Toast message={toast} />
    </div>
  );
}
