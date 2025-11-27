// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./lib/useAuth";
import "./index.css";
import { loadConfigToWindow } from "./config";
import { msalInstance, createGetToken, initMsal } from "./auth/msal";

// 1) load env -> window.* BEFORE anything else
loadConfigToWindow();

/**
 * This bootstrap waits for initMsal() which resolves after handleRedirectPromise() finished.
 * That prevents interaction_in_progress races where components call getToken while redirect login is ongoing.
 *
 * We still wrap with try/catch so startup never crashes if auth initialization has an issue.
 */

(async () => {
  // 2) ensure msal is initialized (so getAllAccounts / silent acquire won't throw)
  try {
    // prefer initMsal exported from src/auth/msal (handles redirect promise)
    await initMsal();
    console.info("msal.initMsal() done");
  } catch (e) {
    console.warn("MSAL initMsal() failed (continuing):", e?.message || e);
    // continue — window.auth will still be prepared below, components should handle auth errors gracefully
  }

  // 3) create getToken and account helpers and expose window.auth for graphClient & useAuth
  try {
    const getTokenFn = createGetToken(msalInstance);
    const getAccountFn = () => {
      const active = msalInstance.getActiveAccount();
      if (active) return { username: active.username || active.homeAccountId, name: active.name || active.username };
      const all = msalInstance.getAllAccounts() || [];
      const a = all[0];
      return a ? { username: a.username || a.homeAccountId, name: a.name || a.username } : null;
    };

    window.auth = window.auth || {};
    window.auth.getToken = async () => {
      return await getTokenFn();
    };
    window.auth.getAccount = getAccountFn;
    // keep loginPopup helper for existing code; underlying msal createGetToken will redirect when needed
    window.auth.loginPopup = async () => {
      try {
        await getTokenFn();
        return true;
      } catch (e) {
        console.warn("loginPopup/getToken fallback failed:", e);
        return false;
      }
    };

    console.info("window.auth prepared.");
  } catch (e) {
    console.warn("Failed to prepare window.auth (continuing):", e);
  }

  // 4) mount the app
  const root = createRoot(document.getElementById("root"));
  root.render(
    <React.StrictMode>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </React.StrictMode>
  );
})();
