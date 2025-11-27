// src/auth/msal.js
import { PublicClientApplication, InteractionRequiredAuthError } from "@azure/msal-browser";

/**
 * MSAL init helper that:
 *  - waits for handleRedirectPromise() once at startup
 *  - exposes initMsal() that resolves when redirect handling completes
 *  - createGetToken() will wait for init to finish before trying to acquire tokens
 *
 * Notes:
 *  - set env vars for Vite: VITE_AAD_CLIENT_ID, VITE_AAD_TENANT_ID, VITE_REDIRECT_URI
 *  - We intentionally use loginRedirect() as fallback to avoid popup concurrency in Teams.
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

/* ---------- initialization guard ---------- */
// Promise that resolves once handleRedirectPromise() is done.
let _initResolve;
let _initReject;
let _initPromise = new Promise((res, rej) => { _initResolve = res; _initReject = rej; });
let _initialized = false;

export async function initMsal() {
  if (_initialized) return Promise.resolve();
  try {
    // Wait for any redirect response to be processed.
    const redirectResp = await msalInstance.handleRedirectPromise();
    // If redirect returned an account, set it active; otherwise pick one from cache.
    if (redirectResp && redirectResp.account) {
      msalInstance.setActiveAccount(redirectResp.account);
    } else {
      const accounts = msalInstance.getAllAccounts();
      if (accounts && accounts.length > 0) msalInstance.setActiveAccount(accounts[0]);
    }
    _initialized = true;
    _initResolve(true);
    return true;
  } catch (err) {
    console.error("initMsal: handleRedirectPromise failed", err);
    _initialized = true; // still resolve so app doesn't block; components will handle auth errors
    _initResolve(true);
    return false;
  }
}

/* In case someone imports without explicitly calling initMsal, start init automatically */
initMsal().catch(e => { /* already handled in initMsal */ });

/* ---------- token getter factory ---------- */
/**
 * Returns a function `getToken()` that:
 *  - awaits initMsal()
 *  - tries acquireTokenSilent
 *  - if interactive required, triggers loginRedirect (instead of popup) so Teams/embedded flows work reliably
 */
export function createGetToken(msalInstanceLocal = msalInstance) {
  return async function getToken() {
    // ensure redirect handling finished
    await _initPromise;

    // get active account (if any)
    const accounts = msalInstanceLocal.getAllAccounts();
    const account = msalInstanceLocal.getActiveAccount() || (accounts && accounts[0]);

    const silentRequest = { account, scopes: GRAPH_SCOPES };

    try {
      const resp = await msalInstanceLocal.acquireTokenSilent(silentRequest);
      if (resp && resp.accessToken) return resp.accessToken;
      throw new Error("acquireTokenSilent returned no token");
    } catch (err) {
      // If the error indicates interaction required, trigger a redirect login (or rethrow)
      const isInteractionRequired =
        err instanceof InteractionRequiredAuthError ||
        (err && err.errorCode && err.errorCode.includes("interaction_required")) ||
        (err && String(err.message || "").toLowerCase().includes("interaction"));

      if (isInteractionRequired) {
        // Use redirect because popup-based interactive flows often conflict in embedded/Teams contexts.
        try {
          await msalInstanceLocal.loginRedirect({ scopes: GRAPH_SCOPES });
          // loginRedirect will navigate away; this code rarely continues immediately.
          return null;
        } catch (redirErr) {
          console.error("loginRedirect failed", redirErr);
          throw redirErr;
        }
      }

      // other errors
      console.error("acquireTokenSilent failed", err);
      throw err;
    }
  };
}
