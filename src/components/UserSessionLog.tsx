import React, { useEffect, useState } from 'react';
import { getAccessLogs, AccessLog } from '../store';
import { ShieldAlert, Activity, User, Clock, FileText } from 'lucide-react';

export function UserSessionLog() {
  const [logs, setLogs] = useState<AccessLog[]>([]);

  useEffect(() => {
    // Refresh logs on mount and every 3 seconds to catch updates
    setLogs(getAccessLogs());
    const intervalId = setInterval(() => {
      setLogs(getAccessLogs());
    }, 3000);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto w-full">
      <div className="bg-white p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-rose-600" />
          User Session & Audit Logs
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-4xl">
          Immutable ledger of staff access to sensitive grievance data. Tracks view events on records categorized under Gender-Based Violence (GBV), Corruption, and other high-priority classifications to ensure accountability and data integrity.
        </p>
      </div>
      <div className="p-6 w-full max-w-7xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="p-4 w-48">Timestamp</th>
                <th className="p-4 w-40">User</th>
                <th className="p-4 w-32">Action</th>
                <th className="p-4 w-48">Resource ID</th>
                <th className="p-4">Context / Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length > 0 ? logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </td>
                  <td className="p-4 text-sm font-medium text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {log.user}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${log.action === 'VIEW' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-600 font-mono">
                    <span className="flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      {log.resourceId}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-slate-700">
                    {log.details}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-sm">
                    No access events logged yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
