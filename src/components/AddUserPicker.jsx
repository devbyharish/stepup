// src/components/AddUserPicker.jsx
import React, { useEffect, useState } from "react";
import { useMsal } from "@azure/msal-react";

export default function AddUserPicker({ open, onClose, onSelect }) {
  const { instance } = useMsal();
  const [token, setToken] = useState(null);
  const [users, setUsers] = useState([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const acc = instance.getActiveAccount() || (await instance.loginPopup({ scopes: ["User.Read.All"] }));
        const t = (await instance.acquireTokenSilent({ account: acc, scopes: ["User.Read.All"] })).accessToken;
        if (!mounted) return;
        setToken(t);
        const res = await fetch(`https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName&$top=50`, { headers: { Authorization: `Bearer ${t}` }});
        const b = await res.json();
        if (!mounted) return;
        setUsers(b.value || []);
      } catch (e) {
        console.error(e);
      } finally { if (mounted) setLoading(false); }
    })();
    return () => { mounted = false; };
  }, [open, instance]);

  useEffect(() => {
    if (!token) return;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        const qEnc = encodeURIComponent(q);
        const url = q ? `https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName&$top=50&$filter=startsWith(displayName,'${qEnc}') or startsWith(userPrincipalName,'${qEnc}') or startsWith(mail,'${qEnc}')` : `https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName&$top=50`;
        const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` }});
        const b = await r.json();
        setUsers(b.value || []);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }, 250);
    return () => clearTimeout(id);
  }, [q, token]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl p-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Pick user</h3>
          <button onClick={onClose} className="text-sm text-slate-500">Close</button>
        </div>

        <div className="mt-3">
          <input className="w-full rounded-lg border px-3 py-2" placeholder="Search by name or email" value={q} onChange={e=>setQ(e.target.value)} />
        </div>

        <div className="mt-3 max-h-64 overflow-auto border rounded-lg p-2">
          {loading && <div className="text-sm text-slate-500">Loading…</div>}
          {users.map(u=>(
            <div key={u.id} onClick={()=>{ onSelect(u); onClose(); }} className="p-2 hover:bg-slate-50 rounded cursor-pointer">
              <div className="font-medium">{u.displayName}</div>
              <div className="text-xs text-slate-500">{u.mail || u.userPrincipalName}</div>
            </div>
          ))}
          {!users.length && !loading && <div className="text-sm text-slate-500">No users</div>}
        </div>
      </div>
    </div>
  );
}
