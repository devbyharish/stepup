// src/auth/msal.js
import { PublicClientApplication } from "@azure/msal-browser";

/**
 * MSAL helper used by the app.
 *
 * Environment variables (vite):
 *  - VITE_AAD_CLIENT_ID
 *  - VITE_AAD_TENANT_ID
 *  - VITE_REDIRECT_URI
 *
 * Exports:
 *  - msalInstance (configured)
 *  - createGetToken(msal) -> () => tokenString
 *  - initMsal() -> Promise that resolves after initialize() + handleRedirectPromise() are done
 */

const CLIENT_ID = import.meta.env.VITE_AAD_CLIENT_ID || "";
const TENANT_ID = import.meta.env.VITE_AAD_TENANT_ID || "common";
const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || window.location.origin;

export const GRAPH_SCOPES = [
  "User.Read",
  "offline_access",
  "openid",
  "profile",
  "User.ReadBasic.All",
  "Sites.ReadWrite.All"
];

export const msalConfig = {
  auth: {
    clientId: CLIENT_ID,
    authority: `https://login.microsoftonline.com/${TENANT_ID}`,
    redirectUri: REDIRECT_URI,
  },
  cache: {
    cacheLocation: "localStorage",
    storeAuthStateInCookie: false,
  },
};

export const msalInstance = new PublicClientApplication(msalConfig);

/**
 * initMsal(): ensures msal.initialize() (if available) is awaited first,
 * then runs handleRedirectPromise() (if available). This prevents the
 * "uninitialized_public_client_application" error when handleRedirectPromise
 * runs before initialize.
 */
export async function initMsal() {
  try {
    // 1) If the library exposes initialize(), call it and await
    if (typeof msalInstance.initialize === "function") {
      try {
        await msalInstance.initialize();
        console.info("msal.initialize() done");
      } catch (initErr) {
        // log but continue to attempt handleRedirectPromise — some versions may throw harmlessly
        console.warn("msal.initialize() failed:", initErr?.message || initErr);
        // Important: do NOT rethrow here - we still want to attempt handleRedirectPromise below
      }
    }

    // 2) Now call handleRedirectPromise() if available (safe now because initialize was awaited)
    if (typeof msalInstance.handleRedirectPromise === "function") {
      try {
        await msalInstance.handleRedirectPromise();
        console.info("msal.handleRedirectPromise() done");
      } catch (hrpErr) {
        // handleRedirectPromise can throw for non-fatal reasons (no code, cancelled) — log and continue
        console.info("msal.handleRedirectPromise() non-fatal:", hrpErr?.message || hrpErr);
      }
    }
  } catch (e) {
    // Bubble up only unexpected errors
    console.warn("initMsal: unexpected error", e?.message || e);
    // Let caller decide whether to continue or not
    throw e;
  }
}

/**
 * createGetToken: returns a function that will attempt silent token acquisition first,
 * and fallback to an interactive popup if silent fails.
 */
export function createGetToken(msalInstanceLocal = msalInstance) {
  return async function getToken() {
    // pick account if available
    const accounts = msalInstanceLocal.getAllAccounts();
    const account = msalInstanceLocal.getActiveAccount() || accounts[0] || null;
    const silentRequest = { scopes: GRAPH_SCOPES, account };

    // try silent acquire
    try {
      const resp = await msalInstanceLocal.acquireTokenSilent(silentRequest);
      if (resp && resp.accessToken) return resp.accessToken;
    } catch (silentErr) {
      // silent failed -> log and try interactive popup
      console.info("acquireTokenSilent failed:", silentErr?.message || silentErr);
    }

    // interactive popup fallback
    try {
      const popupReq = { scopes: GRAPH_SCOPES };
      const resp2 = await msalInstanceLocal.acquireTokenPopup(popupReq);
      if (resp2 && resp2.accessToken) return resp2.accessToken;
      throw new Error("Failed to acquire token interactively");
    } catch (popupErr) {
      // bubble up meaningful message
      console.error("acquireTokenPopup failed:", popupErr?.message || popupErr);
      throw popupErr;
    }
  };
}
