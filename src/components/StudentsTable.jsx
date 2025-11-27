// components/StudentsTable.jsx
import React from 'react';

export default function StudentsTable({ students, onEdit, onDelete, role }) {
  return (
    <div className="bg-white rounded shadow-sm border overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Class</th>
            <th className="p-2 text-left">DOB</th>
            <th className="p-2 text-left">Parent</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map(s => (
            <tr key={s.id} className="border-t">
              <td className="p-2">{s.title || s.name}</td>
              <td className="p-2">{s.class}</td>
              <td className="p-2">{s.dob}</td>
              <td className="p-2">{s.parentName}</td>
              <td className="p-2">{s.status}</td>
              <td className="p-2 text-right">
                <button onClick={()=>onEdit(s)} className="text-sm px-2 py-1 rounded hover:bg-slate-100">View</button>
                {(role === 'opsadmin' || role==='sysadmin') && (
                  <>
                    <button onClick={()=>onEdit(s,true)} className="text-sm px-2 py-1 rounded hover:bg-slate-100">Edit</button>
                    <button onClick={()=>onDelete(s)} className="text-sm px-2 py-1 text-red-600 rounded hover:bg-red-50">Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
