// src/hooks/useRole.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchItems, updateItem } from "../lib/graphClient";

/**
 * useRole - production-friendly role hook
 * - always reads userRoles from SharePoint (no localStorage)
 * - safe client-side filtering (avoids non-indexed Graph filter errors)
 * - supports DefaultRole as boolean / "Yes" / "True" / "1"
 * - dispatch 'stepup:roles:changed' to force global refresh
 */

function parseIsDefault(v) {
  if (v == null) return false;
  if (typeof v === "boolean") return v;
  const s = ("" + v).trim().toLowerCase();
  return s === "yes" || s === "true" || s === "1";
}

function extractRoleFromRow(r) {
  if (!r) return null;
  return r.Role || r.role || r.fields?.Role || r.fields?.Roles || null;
}

export default function useRole(user) {
  const [rows, setRows] = useState([]); // raw rows array (as returned by fetchItems)
  const [availableRoles, setAvailableRoles] = useState([]); // [{id, role, isDefault}]
  const [activeRole, setActiveRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // normalizes raw rows into { id, role, isDefault, raw }
  const buildFromRows = useCallback((fetchedRows) => {
    const normalized = (fetchedRows || []).map(r => {
      const role = extractRoleFromRow(r) || (r.fields && (r.fields.Role || r.fields.Roles)) || null;
      const isDefault = parseIsDefault(r.DefaultRole ?? r.fields?.DefaultRole ?? r.defaultRole);
      return { id: r.id, role, isDefault, raw: r };
    }).filter(x => !!x.role);

    setRows(fetchedRows || []);
    setAvailableRoles(normalized.map(x => ({ id: x.id, role: x.role, isDefault: x.isDefault })));

    // choose active role: DefaultRole -> educator -> first
    let chosen = null;
    const def = normalized.find(x => x.isDefault);
    if (def) chosen = def.role;
    if (!chosen) {
      const edu = normalized.find(x => x.role && x.role.toLowerCase() === "educator");
      if (edu) chosen = edu.role;
    }
    if (!chosen && normalized.length) chosen = normalized[0].role;

    setActiveRole(chosen);

    // debug globals for console inspection
    try {
      window.__STEPUP_DEBUG_AVAILABLE_ROLES__ = normalized;
      window.__STEPUP_DEBUG_LAST_USERROLES__ = fetchedRows || [];
      window.__STEPUP_DEBUG_ACTIVE_ROLE__ = chosen;
    } catch (_) {}
  }, []);

  // robustly derive UPN from various user object shapes
  const deriveUpn = useCallback((u) => {
    if (!u) return "";
    return String(u.userPrincipalName || u.username || u.mail || u.user_name || u.upn || u.id || "").trim();
  }, []);

  // fetch roles and pick those for this user (client-side filter)
  const fetchRolesForUser = useCallback(async () => {
    if (!user) {
      setRows([]);
      setAvailableRoles([]);
      setActiveRole(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const upn = deriveUpn(user);
      // fetch all rows (expand fields) and filter locally
      let all = [];
      try {
        all = await fetchItems("userRoles", "&$top=500");
      } catch (e) {
        console.warn("useRole: fetchItems(userRoles) failed:", e?.message || e);
        all = [];
      }

      let matched = [];
      if (upn) {
        const u = upn.toLowerCase();
        matched = (all || []).filter(r => {
          const rUpn = (r.UserPrincipalName || r.fields?.UserPrincipalName || r.fields?.Title || r.Title || "").toString().toLowerCase();
          return rUpn === u;
        });
      } else {
        matched = all || [];
      }

      // fallback loose match (if exact didn't find)
      if ((!matched || matched.length === 0) && upn && (all && all.length)) {
        const u = upn.toLowerCase();
        matched = all.filter(r => {
          const candidates = [
            r.UserPrincipalName, r.fields?.UserPrincipalName,
            r.fields?.Title, r.Title,
            r.fields?.DisplayName, r.DisplayName
          ];
          return candidates.some(v => (v || "").toString().toLowerCase().includes(u));
        });
      }

      if (!matched || matched.length === 0) {
        // final fallback: create a local row from token user.role
        const fallback = [{ id: "local", Role: user?.role || user?.username || "educator", DefaultRole: true }];
        buildFromRows(fallback);
        setLoading(false);
        return;
      }

      buildFromRows(matched);
    } catch (err) {
      console.error("useRole fetchRolesForUser error", err);
      const fallback = [{ id: "local", Role: user?.role || user?.username || "educator", DefaultRole: true }];
      buildFromRows(fallback);
    } finally {
      setLoading(false);
    }
  }, [user, buildFromRows, deriveUpn]);

  // public: switch active role locally (must be one of availableRoles)
  const switchRole = useCallback((role) => {
    if (!role) return;
    if (!availableRoles.some(a => a.role === role)) return;
    setActiveRole(role);
    try { window.__STEPUP_DEBUG_ACTIVE_ROLE__ = role; } catch (_) {}
  }, [availableRoles]);

  // server-side: set DefaultRole for a row (clears others)
  const setDefaultRoleOnServer = useCallback(async (rowId) => {
    if (!rowId) throw new Error("rowId required");
    // fetch current rows, clear previous defaults and set target
    let current = [];
    try {
      current = await fetchItems("userRoles", "&$top=500");
    } catch (e) {
      console.warn("setDefaultRoleOnServer: fetchItems failed:", e?.message || e);
      current = [];
    }

    // clear other defaults (best-effort)
    for (const r of (current || [])) {
      try {
        const isDef = parseIsDefault(r.DefaultRole ?? r.fields?.DefaultRole ?? r.defaultRole);
        if (isDef && r.id && r.id !== rowId) {
          // set to false
          await updateItem("userRoles", r.id, { DefaultRole: false }).catch(e => console.warn("clear default failed for", r.id, e));
        }
      } catch (e) { /* continue */ }
    }

    // set target default
    await updateItem("userRoles", rowId, { DefaultRole: true });
  }, []);

  const refreshRoles = useCallback(async () => { await fetchRolesForUser(); }, [fetchRolesForUser]);

  // initial fetch
  useEffect(() => { fetchRolesForUser(); }, [fetchRolesForUser]);

  // listen for global event to refresh roles (dispatched by OpsAdmin after update)
  useEffect(() => {
    const handler = () => { fetchRolesForUser().catch(e => console.error("roles refresh handler failed", e)); };
    window.addEventListener("stepup:roles:changed", handler);
    return () => window.removeEventListener("stepup:roles:changed", handler);
  }, [fetchRolesForUser]);

  return useMemo(() => ({
    rows, availableRoles, activeRole, switchRole, setDefaultRoleOnServer, refreshRoles, loading
  }), [rows, availableRoles, activeRole, switchRole, setDefaultRoleOnServer, refreshRoles, loading]);
}
