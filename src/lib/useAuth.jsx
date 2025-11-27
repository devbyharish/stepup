// src/lib/useAuth.jsx  (REPLACE file)
import React, { createContext, useContext, useEffect, useState } from "react";
import { fetchItems } from "./graphClient";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { upn, displayName, role }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        let upn = null;
        let displayName = null;

        // --- Safe: only call window.auth if it exists and provides getToken/getAccount
        try {
          if (window.auth && typeof window.auth.getToken === "function") {
            await window.auth.getToken(); // may throw if not configured
          }
          if (window.auth && typeof window.auth.getAccount === "function") {
            const acct = window.auth.getAccount();
            if (acct) {
              upn = acct.username || acct.homeAccountId || null;
              displayName = acct.name || null;
            }
          }
        } catch (e) {
          console.debug("Auth: getToken/getAccount unavailable or failed:", e?.message || e);
        }

        // 1) Check localStorage default (pre-login role)
        const defaultRole = localStorage.getItem("stepup_default_role");
        if (defaultRole) {
          const resolved = {
            upn: upn || `dev.${defaultRole}@local`,
            displayName: displayName || `Dev (${defaultRole})`,
            role: defaultRole
          };
          if (mounted) setUser(resolved);
          if (mounted) setLoading(false);
          return;
        }

        // 2) Check global STEPUP_DEBUG override (console bootstrap)
        if (window.STEPUP_DEBUG && window.STEPUP_DEBUG.user) {
          const u = window.STEPUP_DEBUG.user;
          const resolved = {
            upn: upn || u.upn || "local@local",
            displayName: displayName || u.displayName || "Local Dev",
            role: u.role || "educator"
          };
          if (mounted) setUser(resolved);
          if (mounted) setLoading(false);
          return;
        }

        // 3) If userRoles list present, try map real user
        let role = "educator"; // safe default
        if (window.LISTS && window.LISTS.userRoles) {
          try {
            const allRoles = await fetchItems("userRoles").catch(() => []);
            const me = allRoles.find((r) => {
              const u = (r.UserPrincipalName || "").toLowerCase();
              if (upn && u && upn.toLowerCase().includes(u)) return true;
              if (displayName && (r.DisplayName || "").toLowerCase() === displayName?.toLowerCase())
                return true;
              if (upn && (r.DisplayName || "").toLowerCase().includes(upn.split("@")[0])) return true;
              return false;
            });
            role = me?.Role || role;
            if (me && !displayName) displayName = me.DisplayName || displayName;
            if (me && !upn) upn = me.UserPrincipalName || upn;
          } catch (e) {
            console.debug("Auth: fetchItems(userRoles) failed:", e?.message || e);
          }
        }

        const resolved = {
          upn: upn || "local@local",
          displayName: displayName || "Local Dev",
          role
        };

        if (mounted) setUser(resolved);
      } catch (err) {
        console.warn("AuthProvider: role detection failed (fallback).", err?.message || err);
        if (mounted) setUser({ upn: "local@local", displayName: "Local Dev", role: "educator" });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
