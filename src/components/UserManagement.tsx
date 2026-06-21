import React, { useState, useEffect } from 'react';
import { getStaffMembers, addStaffMember, removeStaffMember } from '../store';
import { StaffMember } from '../types';
import { Users, Plus, Trash2, Mail, Building, UserCheck } from 'lucide-react';

export function UserManagement() {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => setStaffList(getStaffMembers());

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !department) return;
    
    addStaffMember({ name, email, department });
    setName('');
    setEmail('');
    setDepartment('');
    refresh();
  };

  const handleRemove = (id: string) => {
    removeStaffMember(id);
    refresh();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto w-full">
      <div className="bg-white p-6 border-b border-slate-200">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="w-5 h-5 text-indigo-600" />
          Assign GRM Officers
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">
          Register and manage Grievance Redress Mechanism (GRM) officers. Officers assigned here can be allocated to specific grievances within their corresponding department in the Central Grievance Database.
        </p>
      </div>

      <div className="p-6 w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Registration Form */}
        <div className="md:col-span-1">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Register New Officer</h3>
            <form onSubmit={handleRegister} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  placeholder="e.g. John Doe"
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Email <span className="text-slate-400 font-normal">(.go.ke preferred)</span></label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  placeholder="e.g. jdoe@taitataveta.go.ke"
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Assigned Department</label>
                <select 
                  value={department} 
                  onChange={e => setDepartment(e.target.value)} 
                  className="w-full px-3 py-2 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="">Select Department...</option>
                  <option value="Roads, Public Works, and Infrastructure">Roads, Public Works, and Infrastructure</option>
                  <option value="Lands, Housing, and Urban Development">Lands, Housing, and Urban Development</option>
                  <option value="Water, Environment, and Natural Resources">Water, Environment, and Natural Resources</option>
                  <option value="Health Services">Health Services</option>
                  <option value="Education, Library, and ICT">Education, Library, and ICT</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-medium px-4 py-2 rounded hover:bg-indigo-700 transition"
              >
                <Plus className="w-4 h-4" /> Register Officer
              </button>
            </form>
          </div>
        </div>

        {/* Staff List */}
        <div className="md:col-span-2">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 w-48">Officer Name</th>
                  <th className="p-4">Department & Role</th>
                  <th className="p-4 w-48">Contact</th>
                  <th className="p-4 w-12 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {staffList.length > 0 ? staffList.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50 transition">
                    <td className="p-4 text-sm font-medium text-slate-800">
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-indigo-500" />
                        {staff.name}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 w-fit border border-slate-200">
                          {staff.department}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {staff.role}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1.5 truncate" title={staff.email}>
                        <Mail className="w-3 h-3 text-slate-400" />
                        {staff.email}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => handleRemove(staff.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition"
                        title="Remove Officer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500 text-sm">
                      No GRM Officers registered. Add an officer using the panel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
