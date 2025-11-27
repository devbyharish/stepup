// src/auth/msal.js
import { PublicClientApplication } from "@azure/msal-browser";

/**
 * Simple MSAL setup. Set env vars in .env (Vite):
 * VITE_AAD_CLIENT_ID, VITE_AAD_TENANT_ID, VITE_REDIRECT_URI
 *
 * GRAPH_SCOPES: scopes your app requests (Sites.* for SharePoint + user read)
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
  // for SharePoint list CRUD: Sites.ReadWrite.All or Sites.Manage.All depending on need
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

// convenience wrapper used by components to acquire token.
// returns a function that when called returns a token string (or throws)
export function createGetToken(msalInstanceLocal = msalInstance) {
  return async function getToken() {
    // attempt silent first; fallback to interactive popup
    const accounts = msalInstanceLocal.getAllAccounts();
    const account = msalInstanceLocal.getActiveAccount() || accounts[0];
    const silentRequest = { scopes: GRAPH_SCOPES, account };
    try {
      const resp = await msalInstanceLocal.acquireTokenSilent(silentRequest);
      return resp.accessToken;
    } catch (err) {
      // fallback to interactive popup
      const popupReq = { scopes: GRAPH_SCOPES };
      const resp2 = await msalInstanceLocal.acquireTokenPopup(popupReq);
      if (resp2 && resp2.accessToken) return resp2.accessToken;
      throw new Error("Failed to acquire token");
    }
  };
}
