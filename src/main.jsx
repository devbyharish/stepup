// src/main.jsx
import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./lib/useAuth";
import "./index.css";
import { loadConfigToWindow } from "./config";
import { msalInstance, createGetToken } from "./auth/msal";

// 1) load env -> window.* BEFORE anything else
loadConfigToWindow();

// helper: robust MSAL init
async function bootstrapMsal(msalInstance) {
  try {
    if (typeof msalInstance.initialize === "function") {
      await msalInstance.initialize();
      console.info("msal.initialize() done");
      return;
    }
    if (typeof msalInstance.handleRedirectPromise === "function") {
      try {
        await msalInstance.handleRedirectPromise();
        console.info("msal.handleRedirectPromise() done");
      } catch (e) {
        // not fatal
        console.info("msal.handleRedirectPromise() non-fatal:", e?.message || e);
      }
    }
  } catch (e) {
    console.warn("bootstrapMsal failed (continuing):", e?.message || e);
  }
}

(async () => {
  // 2) ensure msal is initialized (so getAllAccounts / silent acquire won't throw)
  try {
    await bootstrapMsal(msalInstance);
  } catch (e) {
    console.warn("MSAL bootstrap error (continuing):", e);
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
    window.auth.loginPopup = async () => {
      try {
        await getTokenFn();
        return true;
      } catch (e) {
        console.warn("loginPopup failed:", e);
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
