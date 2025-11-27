// src/pages/Students/Student360.jsx
import React, { useEffect, useState } from "react";
import { createGetToken } from "../../auth/msal";
import { createGraphClient } from "../../graph/client";
import { getItem, updateItem } from "../../utils/graph";
import { SITE_ID, LISTS } from "../../config/sharepoint";
import { useMsal } from "@azure/msal-react";

export default function Student360({ studentId }) {
  const { instance } = useMsal();
  const [client, setClient] = useState(null);
  const [student, setStudent] = useState(null);

  useEffect(()=> {
    const g = createGetToken(instance);
    setClient(createGraphClient(g));
  }, [instance]);

  useEffect(()=> {
    (async ()=>{
      if (!client || !studentId) return;
      try {
        const listId = LISTS.students;
        const res = await getItem(client, undefined, listId, studentId);
        setStudent(res);
      } catch (e) {
        console.error(e);
      }
    })();
  }, [client, studentId]);

  if (!studentId) return <div className="p-6 text-slate-500">Select a student to view</div>;
  if (!student) return <div className="p-6">Loading student…</div>;

  const f = student.fields || {};
  return (
    <div className="rounded-xl border p-6">
      <div className="flex items-start gap-6">
        <div className="w-28 h-28 rounded-xl bg-slate-100 grid place-items-center text-slate-400">
          {f.Photo ? <img src={f.Photo} alt="photo" className="w-full h-full object-cover rounded-xl" /> : "Photo"}
        </div>
        <div>
          <div className="text-xl font-semibold">{f.Title || f.FullName || "—"}</div>
          <div className="text-sm text-slate-500">{f.Class} · {f.Section}</div>
          <div className="mt-2 text-sm">Parent: {f.ParentName || "—"}</div>
          <div className="text-sm">DOB: {f.DOB || "—"}</div>
          <div className="mt-4 text-sm text-slate-600">Status: {f.Status || "—"}</div>
        </div>
      </div>

      <div className="mt-6">
        <h4 className="font-semibold">Recent Assessments</h4>
        <div className="mt-2 text-sm text-slate-500">(will show assessment entries)</div>
      </div>
    </div>
  );
}
