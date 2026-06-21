import React, { useState, useEffect, useMemo } from 'react';
import { getGrievances, updateGrievance, logAccess, addInternalNote } from '../store';
import { Grievance, Status } from '../types';
import { BarChart3, Database, Filter, Search, Users, ChevronDown, CheckCircle2, AlertTriangle, ShieldAlert, Accessibility, Flame, Paperclip, BookOpen, Plus, Trash2, History, Activity, FileText, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AccessibilityDashboard } from './AccessibilityDashboard';
import { KnowledgeBase } from './KnowledgeBase';
import { DepartmentHeatmap } from './DepartmentHeatmap';
import { UserSessionLog } from './UserSessionLog';
import { UserManagement } from './UserManagement';
import { getStaffMembers } from '../store';
import { WhatsAppIntegration } from './WhatsAppIntegration';

const getUrgency = (item: Grievance): 'High' | 'Medium' | 'Low' => {
  if (item.category === 'Emergency' || item.category === 'GBV') return 'High';
  const desc = item.description.toLowerCase();
  const highKeywords = ['urgent', 'emergency', 'danger', 'critical', 'immediate', 'life', 'bribe', 'death', 'rape', 'assault', 'violence', 'blood', 'harm'];
  if (highKeywords.some(kw => desc.includes(kw))) return 'High';
  
  if (item.category === 'Corruption' || item.category === 'Service Delay') return 'Medium';
  if (item.category === 'General Complaint') return 'Medium';
  return 'Low';
};

const getServiceCharterDuration = (item: Grievance) => {
  const p = item.priority || getUrgency(item);
  let hours = 14 * 24; // Low / Default
  if (p === 'Urgent') hours = 24;
  else if (p === 'High') hours = 48;
  else if (p === 'Medium') hours = 7 * 24;
  return hours * 60 * 60 * 1000;
};

const getServiceCharterStatus = (item: Grievance) => {
  const duration = getServiceCharterDuration(item);
  const dueTime = new Date(item.dateSubmitted).getTime() + duration;
  const now = Date.now();
  const diff = dueTime - now;
  
  const isPending = ['Logged', 'Acknowledged & Sorted', 'Under Investigation'].includes(item.status);
  if (!isPending) return { label: 'Resolved / Closed', color: 'text-emerald-600', isOverdue: false, isUrgent: false };
  
  if (diff < 0) {
    const overdueHours = Math.abs(Math.floor(diff / (1000 * 60 * 60)));
    return { label: `Overdue by ${overdueHours}h`, color: 'text-rose-600 font-bold', bg: 'bg-rose-100', isOverdue: true, isUrgent: true };
  } else {
    const remainingHours = Math.floor(diff / (1000 * 60 * 60));
    if (remainingHours < 24) {
      return { label: `${remainingHours}h remaining`, color: 'text-amber-600 font-bold', bg: 'bg-amber-100', isOverdue: false, isUrgent: true };
    }
    const remainingDays = Math.floor(remainingHours / 24);
    return { label: `${remainingDays}d remaining`, color: 'text-slate-500 font-medium', bg: 'bg-slate-100', isOverdue: false, isUrgent: false };
  }
};

export interface AdminPanelProps {
  isAuthenticated?: boolean;
  setIsAuthenticated?: (auth: boolean) => void;
  currentUser?: { username: string; email: string; name: string } | null;
  setCurrentUser?: (user: { username: string; email: string; name: string } | null) => void;
}

export function AdminPanel({
  isAuthenticated: propIsAuthenticated,
  setIsAuthenticated: propSetIsAuthenticated,
  currentUser: propCurrentUser,
  setCurrentUser: propSetCurrentUser,
}: AdminPanelProps = {}) {
  const [localIsAuthenticated, setLocalIsAuthenticated] = useState(false);
  const [localCurrentUser, setLocalCurrentUser] = useState<{ username: string; email: string; name: string } | null>(null);

  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : localIsAuthenticated;
  const setIsAuthenticated = propSetIsAuthenticated !== undefined ? propSetIsAuthenticated : setLocalIsAuthenticated;
  const currentUser = propCurrentUser !== undefined ? propCurrentUser : localCurrentUser;
  const setCurrentUser = propSetCurrentUser !== undefined ? propSetCurrentUser : setLocalCurrentUser;

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [grievances, setGrievances] = useState<Grievance[]>([]);
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Escalated' | 'Resolved' | 'High Priority' | 'Priority: Low' | 'Priority: Medium' | 'Priority: High' | 'Priority: Urgent'>('All');
  const [selectedItem, setSelectedItem] = useState<Grievance | null>(null);
  const [adminView, setAdminView] = useState<'overview' | 'database' | 'accessibility' | 'knowledge-base' | 'session-log' | 'user-management' | 'whatsapp'>('overview');
  const [detailTab, setDetailTab] = useState<'details' | 'log' | 'handover' | 'notes'>('details');

  useEffect(() => {
    setGrievances(getGrievances());
    const handleSync = () => {
      setGrievances(getGrievances());
    };
    window.addEventListener('grievances_synced', handleSync);
    return () => {
      window.removeEventListener('grievances_synced', handleSync);
    };
  }, []);

  const refresh = () => setGrievances(getGrievances());

  // Analytics
  const stats = {
    total: grievances.length,
    pending: grievances.filter(g => ['Logged', 'Acknowledged & Sorted', 'Under Investigation'].includes(g.status)).length,
    resolved: grievances.filter(g => ['Immediate Resolution', 'Action & Resolution', 'Appeal Resolution'].includes(g.status)).length,
    escalated: grievances.filter(g => g.status === 'Appeal to County GRM').length,
  };

  const filteredData = filter === 'All' 
    ? grievances 
    : filter === 'Pending' 
      ? grievances.filter(g => ['Logged', 'Acknowledged & Sorted', 'Under Investigation'].includes(g.status))
      : filter === 'Escalated'
        ? grievances.filter(g => g.status === 'Appeal to County GRM')
        : filter === 'Resolved'
          ? grievances.filter(g => ['Immediate Resolution', 'Action & Resolution', 'Appeal Resolution', 'Case Closed'].includes(g.status))
          : filter === 'High Priority'
            ? grievances.filter(g => (g.priority || getUrgency(g)) === 'High' || g.priority === 'Urgent')
            : filter.startsWith('Priority: ')
              ? grievances.filter(g => g.priority === filter.split(': ')[1])
              : grievances;

  const chartData = useMemo(() => {
    const data: Record<string, any> = {};
    grievances.forEach(g => {
      if (!data[g.category]) {
        data[g.category] = { name: g.category, Pending: 0, Resolved: 0, Escalated: 0 };
      }
      if (['Logged', 'Acknowledged & Sorted', 'Under Investigation'].includes(g.status)) {
        data[g.category].Pending += 1;
      } else if (['Immediate Resolution', 'Action & Resolution', 'Appeal Resolution', 'Case Closed'].includes(g.status)) {
        data[g.category].Resolved += 1;
      } else if (g.status === 'Appeal to County GRM') {
        data[g.category].Escalated += 1;
      } else {
        data[g.category].Pending += 1;
      }
    });
    return Object.values(data);
  }, [grievances]);

  const trendData = useMemo(() => {
    const data: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize last 12 months
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${months[d.getMonth()]} '${d.getFullYear().toString().substring(2)}`;
      data[key] = 0;
    }

    grievances.forEach(g => {
      const date = new Date(g.dateSubmitted);
      const key = `${months[date.getMonth()]} '${date.getFullYear().toString().substring(2)}`;
      if (data[key] !== undefined) {
        data[key] += 1;
      }
    });

    return Object.keys(data).map(key => ({
      name: key,
      Submissions: data[key]
    }));
  }, [grievances]);

  const escalatedServiceCharter = useMemo(() => {
    return grievances.filter(g => {
      const status = getServiceCharterStatus(g);
      return status.isOverdue;
    });
  }, [grievances]);

  const handleUpdate = (id: string, updates: Partial<Grievance>, resolutionNote?: string) => {
    const isAppeal = updates.status === 'Appeal Resolution';
    const payload: Partial<Grievance> = { ...updates };
    if (resolutionNote) {
      if (isAppeal) {
        payload.appealResolutionSummary = resolutionNote;
      } else {
        payload.resolutionSummary = resolutionNote;
        payload.resolutionDate = new Date().toISOString();
      }
    }
    updateGrievance(id, payload);
    const updatedData = getGrievances();
    setGrievances(updatedData);
    const updatedItem = updatedData.find(g => g.id === id);
    if (updatedItem) setSelectedItem(updatedItem);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setIsAuthenticated(true);
        setCurrentUser(data.user);
        logAccess({
          user: data.user.name || data.user.email,
          action: 'VIEW',
          details: 'Admin dashboard authenticated via remote Frappe instance',
          resourceId: 'SYSTEM'
        });
      } else {
        setLoginError(data.error || 'Authentication failed. Please check your credentials.');
      }
    } catch (err: any) {
      console.error('Error logging in:', err);
      setLoginError('Could not contact the authenticating server. Verify your server is running.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-slate-50 min-h-[500px] rounded-xl border border-slate-200 p-4">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 max-w-sm w-full">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mb-6 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 text-center mb-2">Staff Portal Access</h2>
          <p className="text-sm text-slate-500 text-center mb-8">
            Authenticate using your credentials registered on the remote Frappe instance.
          </p>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Username / Email</label>
              <input 
                type="text" 
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 ring-emerald-500 outline-none text-slate-850"
                placeholder="Username or email"
                disabled={isLoading}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Password</label>
              <input 
                type="password" 
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 ring-emerald-500 outline-none text-slate-850"
                placeholder="••••••••"
                disabled={isLoading}
                required
              />
            </div>
            
            {loginError && <p className="text-rose-600 text-xs font-medium bg-rose-50 p-2.5 rounded border border-rose-100">{loginError}</p>}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-200 border-t-slate-800 rounded-full animate-spin"></span>
                  Authenticating...
                </>
              ) : 'Verify & Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-xl overflow-hidden shadow-sm border border-slate-200">
      
      {/* Admin Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            Central Grievance Database (TT-GRM-03)
          </h2>
          <p className="text-sm text-slate-400 mt-1">Authorized access for County GRM Focal Persons and Departmental Points.</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 flex-shrink-0 max-w-full">
          <div className="flex bg-slate-800 p-1 rounded-lg w-fit flex-shrink-0 overflow-x-auto max-w-full scrollbar-none">
             <button 
               onClick={() => setAdminView('overview')} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${adminView === 'overview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
               <BarChart3 className="w-4 h-4" />
               Dashboard
             </button>
             <button 
               onClick={() => setAdminView('database')} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${adminView === 'database' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
               <Database className="w-4 h-4" />
               Database
             </button>
             <button 
               onClick={() => setAdminView('knowledge-base')} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${adminView === 'knowledge-base' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
               <BookOpen className="w-4 h-4" />
               Knowledge Base
             </button>
             <button 
               onClick={() => setAdminView('session-log')} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${adminView === 'session-log' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
               <Activity className="w-4 h-4" />
               Audit logs
             </button>
             <button 
               onClick={() => setAdminView('user-management')} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${adminView === 'user-management' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
               <Users className="w-4 h-4" />
               User Management
             </button>
             <button 
               onClick={() => setAdminView('accessibility')} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${adminView === 'accessibility' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
               <Accessibility className="w-4 h-4" />
               Accessibility Detail
             </button>
             <button 
               onClick={() => setAdminView('whatsapp')} 
               className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${adminView === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
             >
               <MessageSquare className="w-4 h-4" />
               WhatsApp
             </button>
          </div>

          {isAuthenticated && (
            <div className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-lg p-2 px-3 shadow-md">
              <div className="text-left text-xs">
                <span className="block font-bold text-slate-100">{currentUser?.name || 'Staff User'}</span>
                <span className="block text-slate-400 text-[10px]">{currentUser?.email || loginEmail || 'grm@taitataveta.go.ke'}</span>
              </div>
              <button 
                onClick={() => {
                  setIsAuthenticated(false);
                  setCurrentUser(null);
                  setLoginEmail('');
                  setLoginPassword('');
                  setLoginError('');
                }}
                className="ml-2 px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-650/30 text-rose-200 hover:text-rose-100 font-semibold text-xs rounded transition-colors border border-rose-500/20 cursor-pointer"
                title="Logout"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {adminView === 'overview' ? (
        <div className="flex-1 overflow-y-auto bg-slate-50">
          
          {escalatedServiceCharter.length > 0 && (
            <div className="bg-amber-50 border-b border-amber-200 p-4">
              <div className="max-w-7xl mx-auto flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-amber-800">Service Charter Escalation Triggered</h4>
                  <p className="text-sm text-amber-700 mt-1">
                    {escalatedServiceCharter.length} grievance(s) have breached their priority resolution timelines. Notifications have been automatically dispatched to the respective department heads for immediate action.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {escalatedServiceCharter.map(g => (
                      <span key={g.id} className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-1 rounded text-xs font-medium border border-amber-200">
                        {g.id} ({g.assignedDepartment})
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-200 border-b border-slate-200 flex-shrink-0">
        <div className="bg-white p-6">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" /> Total Logged
          </p>
          <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-6">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Pending Action
          </p>
          <p className="text-3xl font-bold text-amber-600">{stats.pending}</p>
        </div>
        <div className="bg-white p-6">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Resolved
          </p>
          <p className="text-3xl font-bold text-emerald-600">{stats.resolved}</p>
        </div>
        <div className="bg-white p-6">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-500" /> Escalated Appeals
          </p>
          <p className="text-3xl font-bold text-rose-600">{stats.escalated}</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-slate-50 border-b border-slate-200 flex-shrink-0 grid grid-cols-1 xl:grid-cols-2 gap-px bg-slate-200">
        <div className="bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Grievances by Category & Status</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} 
                  cursor={{ fill: '#f1f5f9' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="Pending" stackId="a" fill="#f59e0b" />
                <Bar dataKey="Resolved" stackId="a" fill="#10b981" />
                <Bar dataKey="Escalated" stackId="a" fill="#f43f5e" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="bg-white p-6">
          <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">Monthly Grievance Trend (Last 12 Months)</h3>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }} 
                />
                <Line type="monotone" dataKey="Submissions" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 border-b border-slate-200">
        <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-2">Department Resolution Performance (Heatmap)</h3>
        <p className="text-xs text-slate-500 mb-6">Average resolution time in days across different grievance categories. Darker colors indicate slower resolution.</p>
        <DepartmentHeatmap grievances={grievances} />
      </div>
      </div>
      ) : adminView === 'database' ? (
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
        
        {/* Table List */}
        <div className="flex-1 overflow-y-auto border-r border-slate-200 bg-white">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur z-10">
            <div className="flex items-center gap-2 text-sm">
              <Filter className="w-4 h-4 text-slate-400" />
              <select 
                className="bg-transparent border-none text-slate-700 font-medium outline-none cursor-pointer"
                value={filter}
                onChange={e => setFilter(e.target.value as any)}
              >
                <option value="All">All Grievances</option>
                <option value="High Priority">High Priority (Urgent)</option>
                <option value="Priority: Urgent">Priority: Urgent</option>
                <option value="Priority: High">Priority: High</option>
                <option value="Priority: Medium">Priority: Medium</option>
                <option value="Priority: Low">Priority: Low</option>
                <option value="Pending">Active / Pending</option>
                <option value="Resolved">Resolved / Closed</option>
                <option value="Escalated">Main Committee Appeals</option>
              </select>
            </div>
            <div className="text-xs text-slate-400 font-medium">Auto-sync active</div>
          </div>

          <div className="divide-y divide-slate-100">
            {filteredData.map(item => {
              const urgency = getUrgency(item);
              return (
              <div 
                key={item.id} 
                onClick={() => {
                  setSelectedItem(item);
                  setDetailTab('details');
                  if (['GBV', 'Corruption'].includes(item.category)) {
                    logAccess({
                      user: currentUser?.name || currentUser?.email || 'Admin Staff',
                      action: 'VIEW',
                      resourceId: item.id,
                      details: `Accessed sensitive grievance data (Category: ${item.category})`
                    });
                  }
                }}
                className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${selectedItem?.id === item.id ? 'bg-emerald-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-mono text-sm font-semibold text-slate-800 flex items-center gap-2">
                    {item.id}
                    {urgency === 'High' && <Flame className="w-4 h-4 text-rose-500" />}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {['High', 'Urgent'].includes((item.priority || urgency)) ? (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 animate-pulse">
                        {item.priority || urgency}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {item.priority || urgency}
                      </span>
                    )}
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full 
                      ${item.status === 'Resolved' || item.status === 'Closed' ? 'bg-emerald-100 text-emerald-700' : 
                        item.status === 'Escalated' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {item.status}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600 mb-2">
                  <Users className="w-4 h-4" />
                  {item.isAnonymous ? 'Anonymous Citizen' : item.name} 
                  <span className="text-slate-300">•</span>
                  <span className="text-xs">{item.ward || 'County-wide'}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-medium text-slate-700 truncate">{item.category}</p>
                  {(() => {
                    const sc = getServiceCharterStatus(item);
                    return (
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${sc.bg} ${sc.color}`}>
                        {sc.label}
                      </span>
                    );
                  })()}
                </div>
              </div>
            )})}
            {filteredData.length === 0 && (
              <div className="p-8 text-center text-slate-400 text-sm">No records found matching criteria.</div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedItem ? (
          <div className="flex-1 bg-slate-50 p-6 overflow-y-auto w-full md:w-[450px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 font-mono">{selectedItem.id}</h3>
              <span className="text-sm text-slate-500">{new Date(selectedItem.dateSubmitted).toLocaleString()}</span>
            </div>
            
            <div className="flex gap-4 mb-6 border-b border-slate-200">
              <button 
                onClick={() => setDetailTab('details')}
                className={`pb-2 text-sm font-medium ${detailTab === 'details' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Grievance Details
              </button>
              <button 
                onClick={() => setDetailTab('log')}
                className={`pb-2 text-sm font-medium flex items-center gap-1.5 ${detailTab === 'log' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <History className="w-4 h-4" /> Activity Log
              </button>
              <button 
                onClick={() => setDetailTab('handover')}
                className={`pb-2 text-sm font-medium flex items-center gap-1.5 ${detailTab === 'handover' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <Users className="w-4 h-4" /> Handover
              </button>
              <button 
                onClick={() => setDetailTab('notes')}
                className={`pb-2 text-sm font-medium flex items-center gap-1.5 ${detailTab === 'notes' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <FileText className="w-4 h-4" /> Notes & Reports
              </button>
            </div>

            {detailTab === 'details' ? (
            <div className="space-y-6">
              {(() => {
                const sc = getServiceCharterStatus(selectedItem);
                if (sc.isUrgent && ['Logged', 'Acknowledged & Sorted', 'Under Investigation'].includes(selectedItem.status)) {
                  return (
                    <div className={`${sc.bg} p-4 rounded-lg border ${sc.isOverdue ? 'border-rose-200' : 'border-amber-200'} flex items-start gap-4`}>
                      <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${sc.isOverdue ? 'text-rose-600' : 'text-amber-600'}`} />
                      <div>
                        <h4 className={`${sc.isOverdue ? 'text-rose-800' : 'text-amber-800'} font-bold mb-1`}>SERVICE CHARTER ALARM: {sc.label}</h4>
                        <p className={`${sc.isOverdue ? 'text-rose-700' : 'text-amber-700'} text-sm`}>
                          This grievance has {sc.isOverdue ? 'breached' : 'approached'} its official service charter deadline. Notifications have been dispatched to the {selectedItem.assignedDepartment || 'respective'} Department Head to prioritize expedited action.
                        </p>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {['High', 'Urgent'].includes(selectedItem.priority || getUrgency(selectedItem)) && (
                <div className="bg-rose-50 p-4 rounded-lg border border-rose-200 flex items-start gap-4">
                  <Flame className="w-6 h-6 text-rose-600 flex-shrink-0 animate-pulse" />
                  <div>
                    <h4 className="text-rose-800 font-bold mb-1">HIGH PRIORITY ACTION REQUIRED</h4>
                    <p className="text-rose-700 text-sm">Automated analysis has flagged this grievance as urgent based on category and description keywords. Please immediately review and route to the appropriate department.</p>
                  </div>
                </div>
              )}
              
              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-slate-100 pb-2">Complainant Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="block text-slate-500 text-xs">Name</span>
                    <span className="font-medium">{selectedItem.isAnonymous ? 'Anonymous' : selectedItem.name}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs">Phone</span>
                    <span className="font-medium">{selectedItem.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs">Ward</span>
                    <span className="font-medium">{selectedItem.ward || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs">Intake Channel</span>
                    <span className="font-medium">{selectedItem.channel}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-slate-100 pb-2">Grievance Definition</h4>
                <div className="space-y-4 text-sm">
                  <div className="flex gap-4">
                    <div>
                      <span className="block text-slate-500 text-xs mb-1">Category</span>
                      <span className="inline-flex px-3 py-1 bg-slate-100 text-slate-800 rounded font-medium">{selectedItem.category}</span>
                    </div>
                    <div>
                      <span className="block text-slate-500 text-xs mb-1">Priority</span>
                      <span className={`inline-flex px-3 py-1 rounded font-bold uppercase text-[10px] ${['High', 'Urgent'].includes(selectedItem.priority || getUrgency(selectedItem)) ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>{selectedItem.priority || getUrgency(selectedItem)}</span>
                    </div>
                  </div>
                  <div>
                    <span className="block text-slate-500 text-xs mb-1">Incident Description</span>
                    <p className="text-slate-700 leading-relaxed bg-slate-50 p-3 rounded">{selectedItem.description}</p>
                  </div>
                  {(selectedItem.assignedDepartment || selectedItem.assignedStaff) && (
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      {selectedItem.assignedDepartment && (
                        <div>
                          <span className="block text-slate-500 text-xs mb-1">Department</span>
                          <span className="font-medium text-emerald-700">{selectedItem.assignedDepartment}</span>
                        </div>
                      )}
                      {selectedItem.assignedStaff && (
                        <div>
                          <span className="block text-slate-500 text-xs mb-1">Assigned Staff</span>
                          <span className="font-medium text-indigo-700">{selectedItem.assignedStaff}</span>
                        </div>
                      )}
                    </div>
                  )}
                  {selectedItem.attachments && selectedItem.attachments.length > 0 && (
                    <div className="pt-4 border-t border-slate-100 mt-4">
                      <span className="block text-slate-500 text-xs mb-2">Attached Evidence</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedItem.attachments.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 p-2 rounded max-w-full">
                            {file.type.startsWith('image/') ? (
                                <img src={file.url} alt={file.name} className="w-8 h-8 object-cover rounded" />
                            ) : (
                                <Paperclip className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            )}
                            <span className="text-xs text-slate-600 truncate max-w-[150px]" title={file.name}>{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Area */}
              <div className="bg-emerald-50 p-5 rounded-lg border border-emerald-100">
                <h4 className="text-xs font-bold uppercase text-emerald-800 tracking-wider mb-4 border-b border-emerald-100 pb-2">Departmental Action</h4>
                
                {['Case Closed', 'External Referral'].includes(selectedItem.status) ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-emerald-800">Case final status: {selectedItem.status}</p>
                    <p className="text-sm font-medium mt-2">Final Citizen Feedback: <span className={selectedItem.citizenSatisfaction === 'Satisfied' || selectedItem.appealSatisfaction === 'Satisfied' ? 'text-emerald-600' : 'text-rose-600'}>
                      {selectedItem.appealSatisfaction || selectedItem.citizenSatisfaction}
                    </span></p>
                  </div>
                ) : (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const status = (form.elements.namedItem('status') as RadioNodeList).value as Status;
                    const assignedDepartment = (form.elements.namedItem('assignedDepartment') as HTMLSelectElement).value;
                    const assignedStaff = (form.elements.namedItem('assignedStaff') as HTMLSelectElement).value;
                    const resElement = form.elements.namedItem('resolution') as HTMLTextAreaElement | null;
                    const text = resElement?.value || '';
                    handleUpdate(selectedItem.id, { status, assignedDepartment, assignedStaff }, text);
                  }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-emerald-800 mb-2">Assigned Department</label>
                        <select name="assignedDepartment" defaultValue={selectedItem.assignedDepartment || ''} className="w-full px-3 py-2 text-sm rounded border-emerald-200 outline-none focus:ring-2 ring-emerald-500 bg-white">
                          <option value="">Select Department...</option>
                          <option value="Roads, Public Works, and Infrastructure">Roads, Public Works, and Infrastructure</option>
                          <option value="Lands, Housing, and Urban Development">Lands, Housing, and Urban Development</option>
                          <option value="Water, Environment, and Natural Resources">Water, Environment, and Natural Resources</option>
                          <option value="Health Services">Health Services</option>
                          <option value="Education, Library, and ICT">Education, Library, and ICT</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-emerald-800 mb-2">Assigned Staff</label>
                        <select 
                          name="assignedStaff" 
                          defaultValue={selectedItem.assignedStaff || ''} 
                          className="w-full px-3 py-2 text-sm rounded border-emerald-200 outline-none focus:ring-2 ring-emerald-500 bg-white"
                        >
                          <option value="">Select Staff...</option>
                          {getStaffMembers().map(staff => (
                            <option key={staff.id} value={staff.name}>{staff.name} ({staff.department})</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-emerald-800 mb-2">Update Stage based on Flowchart</label>
                        <select name="status" defaultValue={selectedItem.status} className="w-full p-2.5 rounded border-emerald-200 outline-none focus:ring-2 ring-emerald-500 bg-white">
                          <option value="Logged">Logged / Registered</option>
                          <option value="Acknowledged & Sorted">Acknowledge receipt & Sorting</option>
                          <option value="Under Investigation">Under Investigation / Field Visit</option>
                          <option value="Immediate Resolution">Immediate Resolution (Direct issues)</option>
                          <option value="Action & Resolution">Action & Resolution</option>
                          <option value="Appeal Resolution">Provide Appeal Resolution (If Escalated)</option>
                          <option value="External Referral">Forward to External Referral</option>
                          <option value="Case Closed">Force Close (Manual Override)</option>
                        </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-emerald-800 mb-2">Resolution Summary Notes (If applicable)</label>
                      <textarea 
                        name="resolution" 
                        rows={3} 
                        className="w-full p-3 rounded border-emerald-200 outline-none focus:ring-2 ring-emerald-500 resize-y" 
                        placeholder="Detail the actions taken to resolve the issue, or results of the investigation..."
                      />
                    </div>
                    <button type="submit" className="w-full bg-emerald-700 text-white py-2.5 rounded font-medium hover:bg-emerald-800 transition-colors shadow-sm">
                      Record Action into Immutable Log
                    </button>
                  </form>
                )}
              </div>

            </div>
            ) : detailTab === 'log' ? (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-slate-100 pb-2">Immutable Activity Log</h4>
                {selectedItem.history && selectedItem.history.length > 0 ? (
                  <div className="space-y-6">
                    {selectedItem.history.map((event, idx) => (
                      <div key={idx} className="relative pl-6 border-l-2 border-slate-200 last:border-transparent">
                        <div className="absolute w-3 h-3 bg-emerald-500 rounded-full -left-[7px] top-1.5 ring-4 ring-white" />
                        <div className="mb-1">
                          <span className="text-xs font-bold text-slate-500">{new Date(event.date).toLocaleString()}</span>
                        </div>
                        <div className="mb-2 w-max">
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded">
                            {event.status}
                          </span>
                        </div>
                        {event.actor && (
                          <div className="text-xs font-medium text-slate-600 mb-1">By: {event.actor}</div>
                        )}
                        {event.note && (
                          <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">{event.note}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">No activity logged.</p>
                )}
              </div>
            </div>
            ) : detailTab === 'handover' ? (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold uppercase text-indigo-800 tracking-wider mb-4 border-b border-slate-100 pb-2">Initiate Official Handover</h4>
                <p className="text-sm text-slate-600 mb-6">Use this if the grievance falls outside your department's jurisdiction and needs to be officially reassigned to another department. A reason is required.</p>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const newDept = (form.elements.namedItem('targetDepartment') as HTMLSelectElement).value;
                  const reason = (form.elements.namedItem('handoverReason') as HTMLTextAreaElement).value;
                  if (!newDept || newDept === selectedItem.assignedDepartment || !reason) return;
                  
                  handleUpdate(selectedItem.id, {
                    assignedDepartment: newDept,
                    status: 'Acknowledged & Sorted',
                    assignedStaff: '' // Reset staff
                  }, `Handover initiated from '${selectedItem.assignedDepartment}' to '${newDept}'. Reason: ${reason}`);
                  
                  setDetailTab('details');
                  form.reset();
                }} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Target Department</label>
                    <select name="targetDepartment" className="w-full px-3 py-2 text-sm rounded border border-slate-200 outline-none focus:ring-2 ring-indigo-500 bg-white" required>
                      <option value="">Select Department...</option>
                      {["Roads, Public Works, and Infrastructure", "Lands, Housing, and Urban Development", "Water, Environment, and Natural Resources", "Health Services", "Education, Library, and ICT"]
                         .filter(d => d !== selectedItem.assignedDepartment)
                         .map(d => <option key={d} value={d}>{d}</option>)
                      }
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Reason for Handover</label>
                    <textarea 
                      name="handoverReason" 
                      rows={4} 
                      required
                      className="w-full p-3 rounded border border-slate-200 outline-none focus:ring-2 ring-indigo-500 resize-y text-sm" 
                      placeholder="Why does this issue fall outside your current jurisdiction?"
                    />
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white py-2.5 rounded font-medium hover:bg-indigo-700 transition-colors shadow-sm text-sm">
                    Execute Handover
                  </button>
                </form>
              </div>
            </div>
            ) : (
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-slate-200">
                <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-4 border-b border-slate-100 pb-2">Internal Notes & Reports</h4>
                
                <div className="mb-8 space-y-4">
                  {selectedItem.internalNotes && selectedItem.internalNotes.length > 0 ? (
                    selectedItem.internalNotes.map(note => (
                      <div key={note.id} className="bg-slate-50 p-4 rounded border border-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs font-bold rounded ${note.type === 'Report' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'}`}>
                              {note.type}
                            </span>
                            <span className="text-xs font-medium text-slate-600">{note.author}</span>
                          </div>
                          <span className="text-xs text-slate-400">{new Date(note.date).toLocaleString()}</span>
                        </div>
                        <p className="text-sm text-slate-700 whitespace-pre-wrap">{note.content}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 italic">No internal notes or reports added yet.</p>
                  )}
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const type = (form.elements.namedItem('noteType') as HTMLSelectElement).value as 'Note' | 'Report';
                  const content = (form.elements.namedItem('noteContent') as HTMLTextAreaElement).value;
                  if (!content) return;
                  
                  addInternalNote(selectedItem.id, content, 'Admin Staff', type);
                  const updatedData = getGrievances();
                  setGrievances(updatedData);
                  const updatedItem = updatedData.find(g => g.id === selectedItem.id);
                  if (updatedItem) setSelectedItem(updatedItem);
                  form.reset();
                }} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <label className="block text-xs font-medium text-slate-700 mb-2">Type</label>
                      <select name="noteType" className="w-full px-3 py-2 text-sm rounded border border-slate-200 outline-none focus:ring-2 ring-emerald-500 bg-white">
                        <option value="Note">Private Note</option>
                        <option value="Report">Internal Report</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-2">Content</label>
                    <textarea 
                      name="noteContent" 
                      rows={4} 
                      className="w-full p-3 rounded border border-slate-200 outline-none focus:ring-2 ring-emerald-500 resize-y text-sm" 
                      placeholder="Add an internal note or file a report..."
                      required
                    />
                  </div>
                  <button type="submit" className="w-full bg-slate-800 text-white py-2.5 rounded font-medium hover:bg-slate-900 transition-colors shadow-sm text-sm flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" /> Save Note
                  </button>
                </form>
              </div>
            </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-slate-50 text-slate-400 p-8 text-center">
            <p>Select a grievance from the centralized log to view details and execute departmental actions.</p>
          </div>
        )}
      </div>
      ) : adminView === 'knowledge-base' ? (
        <KnowledgeBase />
      ) : adminView === 'session-log' ? (
        <UserSessionLog />
      ) : adminView === 'user-management' ? (
        <UserManagement />
      ) : adminView === 'whatsapp' ? (
        <WhatsAppIntegration />
      ) : (
        <AccessibilityDashboard />
      )}
    </div>
  );
}
