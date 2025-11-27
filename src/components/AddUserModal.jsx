// src/components/AddUserModal.jsx
import React, { useEffect, useState, useCallback } from "react";
import ModalForm from "./ModalForm";
import RoleSelector from "./RoleSelector";
import { Toast } from "./Toasts";

/**
 * Props:
 * - visible: boolean
 * - onClose: () => void
 * - onAssign: async ({ upn, displayName, role }) => createdItem   // REQUIRED
 * - onAdded: (createdItem) => void   // optional: called after successful assign
 * - allowedRoles: [{value,label}]     // optional, defaults to educator only
 * - loadAadUsers: async () => [{label,value}] // optional; if not provided the component shows a text input
 */
export default function AddUserModal({
  visible = false,
  onClose = () => {},
  onAssign,
  onAdded,
  allowedRoles = [{ value: "educator", label: "Educator" }],
  loadAadUsers // optional
}) {
  const [upn, setUpn] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState(allowedRoles[0]?.value || "educator");
  const [aadUsers, setAadUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    // reset when opened
    if (visible) {
      setUpn("");
      setDisplayName("");
      setRole(allowedRoles[0]?.value || "educator");
      setToast("");
    }
  }, [visible, allowedRoles]);

  const handleLoadAad = useCallback(async () => {
    if (!loadAadUsers) {
      // try an inline fetch if window.auth is available (best-effort)
      if (!window?.auth?.getToken) {
        setToast("No AAD loader provided and auth helper missing.");
        return;
      }
      setLoadingUsers(true);
      try {
        const token = await window.auth.getToken();
        const site = encodeURIComponent(window.SITE_ID || "");
        // best-effort AAD fetch via Graph (users list) - keep small selection
        const url = `https://graph.microsoft.com/v1.0/users?$select=displayName,userPrincipalName&$top=250`;
        const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        const json = await res.json();
        const users = (json.value || []).map(u => ({ label: u.displayName || u.userPrincipalName, value: u.userPrincipalName }));
        setAadUsers(users);
        setToast("AAD users loaded");
      } catch (e) {
        console.error("AAD load failed", e);
        setToast("Failed to load AAD users (permissions?)");
        setAadUsers([]);
      } finally {
        setLoadingUsers(false);
      }
      return;
    }

    setLoadingUsers(true);
    try {
      const users = await loadAadUsers();
      setAadUsers(Array.isArray(users) ? users : []);
      setToast("AAD users loaded");
    } catch (e) {
      console.error("loadAadUsers failed", e);
      setToast("Failed to load AAD users");
      setAadUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [loadAadUsers]);

  const handleAssign = async () => {
    if (!onAssign || typeof onAssign !== "function") {
      setToast("onAssign callback required");
      return;
    }
    if (!upn) {
      setToast("Please provide user email (UPN)");
      return;
    }
    setSaving(true);
    setToast("");
    try {
      const payload = { upn, displayName: displayName || upn, role };
      const created = await onAssign(payload);
      setToast("Assigned");
      if (typeof onAdded === "function") onAdded(created);
      onClose();
    } catch (e) {
      console.error("assign failed", e);
      setToast((e && e.message) ? `Assign failed: ${e.message}` : "Assign failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalForm visible={visible} title="Assign role" onClose={onClose}>
      <div className="grid grid-cols-1 gap-3">
        <label className="text-xs text-slate-600">Select user (or type email)</label>

        <div className="flex gap-2">
          <div style={{ flex: 1 }}>
            {aadUsers && aadUsers.length > 0 ? (
              <select
                className="rounded-xl border px-3 py-2 w-full"
                value={upn}
                onChange={(e) => {
                  const val = e.target.value;
                  setUpn(val);
                  const u = aadUsers.find(x => x.value === val);
                  if (u) setDisplayName(u.label || val);
                }}
              >
                <option value="">— pick user —</option>
                {aadUsers.map(u => <option key={u.value} value={u.value}>{u.label} · {u.value}</option>)}
              </select>
            ) : (
              <input
                className="rounded-xl border px-3 py-2 w-full"
                value={upn}
                onChange={(e) => setUpn(e.target.value)}
                placeholder="user@org.com"
              />
            )}
          </div>

          <button
            disabled={loadingUsers}
            className="rounded-xl px-3 py-2 border text-xs"
            onClick={handleLoadAad}
          >
            {loadingUsers ? "Loading…" : "Load users"}
          </button>
        </div>

        <label className="text-xs text-slate-600">Display name (optional)</label>
        <input
          className="rounded-xl border px-3 py-2"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Full name"
        />

        <label className="text-xs text-slate-600">Role</label>
        <RoleSelector
          allowedRoles={allowedRoles}
          value={role}
          onChange={(v) => setRole(v)}
        />

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="rounded-xl px-3 py-2 border">Cancel</button>
          <button onClick={handleAssign} disabled={saving} className="rounded-xl px-3 py-2 bg-blue-600 text-white">
            {saving ? "Assigning…" : "Assign"}
          </button>
        </div>

        <Toast message={toast} />
      </div>
    </ModalForm>
  );
}
