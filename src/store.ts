import { Grievance, Status, Category, StaffMember } from './types';

const STORAGE_KEY = 'taita_taveta_grm_data';
const STAFF_KEY = 'taita_taveta_staff_v2';

const MOCK_STAFF: StaffMember[] = [
  { id: 'staff-1', name: 'Gilbert Kichoi', email: 'gkichoi@taitataveta.go.ke', department: 'Roads, Public Works, and Infrastructure', role: 'GRM Officer' },
  { id: 'staff-2', name: 'Patterson Roge', email: 'proge@taitataveta.go.ke', department: 'Health Services', role: 'GRM Officer' },
  { id: 'staff-3', name: 'Austin Mlekenyi', email: 'amlekenyi@taitataveta.go.ke', department: 'Water, Environment, and Natural Resources', role: 'GRM Officer' },
  { id: 'staff-4', name: 'Kamwana', email: 'kamwana@taitataveta.go.ke', department: 'Lands, Housing, and Urban Development', role: 'GRM Officer' },
  { id: 'staff-5', name: 'Maureen Kirigha', email: 'mkirigha@taitataveta.go.ke', department: 'Education, Library, and ICT', role: 'GRM Officer' },
];

export function getStaffMembers(): StaffMember[] {
  try {
    const data = localStorage.getItem(STAFF_KEY);
    if (!data) return MOCK_STAFF;
    return JSON.parse(data);
  } catch {
    return MOCK_STAFF;
  }
}

export function saveStaffMembers(staff: StaffMember[]) {
  localStorage.setItem(STAFF_KEY, JSON.stringify(staff));
}

export function addStaffMember(staff: Omit<StaffMember, 'id' | 'role'>) {
  const currentStaff = getStaffMembers();
  const nextId = currentStaff.length > 0 ? Math.max(...currentStaff.map(s => parseInt(s.id.split('-')[1]) || 0)) + 1 : 1;
  const newStaff: StaffMember = {
    ...staff,
    id: `staff-${nextId}`,
    role: 'GRM Officer'
  };
  saveStaffMembers([...currentStaff, newStaff]);
  return newStaff;
}

export function removeStaffMember(id: string) {
  const currentStaff = getStaffMembers();
  saveStaffMembers(currentStaff.filter(s => s.id !== id));
}

const DUMMY_DATA: Grievance[] = [
  {
    id: 'TT-GRM-2026-0001',
    dateSubmitted: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days ago
    channel: 'Walk-in',
    isAnonymous: false,
    name: 'John Doe',
    gender: 'Male',
    idNumber: '12345678',
    ward: 'Mwatate',
    phone: '0712345678',
    category: 'Service Delay',
    description: 'The road construction at Mwatate town has stalled for 2 months, causing heavy dust and blocking access to local shops.',
    status: 'Case Closed',
    assignedDepartment: 'Roads, Public Works, and Infrastructure',
    resolutionSummary: 'Contractor has been mobilized back to site and water truck deployed to manage dust.',
    resolutionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    citizenSatisfaction: 'Satisfied',
    history: [
      { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(), status: 'Logged', note: 'Grievance submitted via walk-in' },
      { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), status: 'Acknowledged & Sorted', note: 'Assigned to Roads department' },
      { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), status: 'Under Investigation', note: 'Site visit scheduled' },
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'Action & Resolution', note: 'Contractor mobilized' },
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'Case Closed', note: 'Citizen confirmed satisfaction' }
    ]
  },
  {
    id: 'TT-GRM-2026-0002',
    dateSubmitted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    channel: 'Portal',
    isAnonymous: true,
    category: 'Corruption',
    description: 'An official at the lands office is demanding a facilitation fee to process my title deed application.',
    status: 'Appeal to County GRM',
    assignedDepartment: 'Lands, Housing, and Urban Development',
    resolutionSummary: 'Initial investigation found insufficient evidence.',
    citizenSatisfaction: 'Not Satisfied',
    history: [
      { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), status: 'Logged', note: 'Grievance submitted via portal' },
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'Acknowledged & Sorted', note: 'Assigned to Lands department' },
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'Action & Resolution', note: 'Insufficient evidence found' },
      { date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), status: 'Appeal to County GRM', note: 'Complainant appealed the decision' }
    ]
  },
  {
    id: 'TT-GRM-2026-0003',
    dateSubmitted: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    channel: 'WhatsApp',
    isAnonymous: false,
    name: 'Jane Smith',
    ward: 'Chala',
    category: 'General Complaint',
    description: 'No water supply in Chala ward for the past 3 weeks despite reporting to Tavevo.',
    status: 'Under Investigation',
    assignedDepartment: 'Water, Environment, and Natural Resources',
    history: [
      { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), status: 'Logged', note: 'Grievance submitted via WhatsApp' },
      { date: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), status: 'Acknowledged & Sorted', note: 'Forwarded to Water department' },
      { date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), status: 'Under Investigation', note: 'Checking with Tavevo team' }
    ]
  },
  {
    id: 'TT-GRM-2026-0004',
    dateSubmitted: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    channel: 'Walk-in',
    isAnonymous: false,
    name: 'Samuel M.',
    ward: 'Wundanyi',
    category: 'Service Delay',
    description: 'The health center has been out of essential drugs for a week.',
    status: 'Logged',
    assignedDepartment: 'Health Services',
    history: [
      { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), status: 'Logged', note: 'Grievance submitted via walk-in' }
    ]
  }
];

export function getGrievances(): Grievance[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return DUMMY_DATA;
    return JSON.parse(data);
  } catch {
    return DUMMY_DATA;
  }
}

export function saveGrievances(grievances: Grievance[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(grievances));
}

export function addGrievance(grievance: Omit<Grievance, 'id' | 'dateSubmitted' | 'status'>): Grievance {
  const grievances = getGrievances();
  const nextId = grievances.length + 1;
  const trackingNo = `TT-GRM-${new Date().getFullYear()}-${nextId.toString().padStart(4, '0')}`;
  const now = new Date().toISOString();

  const newGrievance: Grievance = {
    ...grievance,
    id: trackingNo,
    dateSubmitted: now,
    status: 'Logged',
    history: [{ date: now, status: 'Logged', note: 'Grievance submitted' }]
  };

  saveGrievances([newGrievance, ...grievances]);

  // Sync to backend Server (fire & forget)
  fetch("/api/grievances", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newGrievance)
  })
  .then(res => res.json())
  .then(data => {
    if (data && data.success && data.grievance) {
      console.log("[Store Sync] New grievance synced successfully to server:", data.grievance.id);
      // Ensure local storage list is correct in case server changed ID or properties
      const refreshedList = getGrievances();
      const matchIdx = refreshedList.findIndex(g => g.id === trackingNo);
      if (matchIdx !== -1) {
        refreshedList[matchIdx] = data.grievance;
        saveGrievances(refreshedList);
        window.dispatchEvent(new CustomEvent('grievances_synced'));
      }
    }
  })
  .catch(err => console.error("[Store Sync Error] Failed to sync new grievance to server-side:", err));

  return newGrievance;
}

export function updateGrievance(id: string, updates: Partial<Grievance>) {
  const grievances = getGrievances();
  const index = grievances.findIndex(g => g.id === id);
  if (index !== -1) {
    const existing = grievances[index];
    const newHistory = existing.history ? [...existing.history] : [];
    
    const now = new Date().toISOString();

    // Check if status is changing
    if (updates.status && updates.status !== existing.status) {
      newHistory.push({
        date: now,
        status: updates.status,
        note: updates.appealResolutionSummary || updates.resolutionSummary || 'Status updated automatically',
        actor: 'Admin Staff'
      });
    } else if (
      (updates.assignedDepartment && updates.assignedDepartment !== existing.assignedDepartment) ||
      (updates.assignedStaff && updates.assignedStaff !== existing.assignedStaff) ||
      (updates.resolutionSummary && updates.resolutionSummary !== existing.resolutionSummary) ||
      (updates.appealResolutionSummary && updates.appealResolutionSummary !== existing.appealResolutionSummary)
    ) {
      // Record non-status updates
      let notes = [];
      if (updates.assignedDepartment !== existing.assignedDepartment) notes.push(`Department assigned: ${updates.assignedDepartment}`);
      if (updates.assignedStaff !== existing.assignedStaff) notes.push(`Staff assigned: ${updates.assignedStaff}`);
      if (updates.resolutionSummary && updates.resolutionSummary !== existing.resolutionSummary) notes.push(`Action note added/modified: ${updates.resolutionSummary}`);
      
      newHistory.push({
        date: now,
        status: updates.status || existing.status,
        note: notes.join(' | '),
        actor: 'Admin Staff'
      });
    }

    const updatedGrievance = { ...existing, ...updates, history: newHistory };
    grievances[index] = updatedGrievance;
    saveGrievances(grievances);

    // Sync to backend Server (fire & forget)
    fetch(`/api/grievances/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates)
    })
    .then(res => res.json())
    .then(data => {
      if (data && data.success && data.grievance) {
        console.log("[Store Sync] Updated grievance synced cleanly to server:", id);
        const refreshedList = getGrievances();
        const mIdx = refreshedList.findIndex(g => g.id === id);
        if (mIdx !== -1) {
          refreshedList[mIdx] = data.grievance;
          saveGrievances(refreshedList);
          window.dispatchEvent(new CustomEvent('grievances_synced'));
        }
      }
    })
    .catch(err => console.error("[Store Sync Error] Failed to sync grievance update to server-side:", err));
  }
}

export function addInternalNote(id: string, noteContent: string, author: string, noteType: 'Note' | 'Report') {
  const grievances = getGrievances();
  const index = grievances.findIndex(g => g.id === id);
  if (index !== -1) {
    if (!grievances[index].internalNotes) {
      grievances[index].internalNotes = [];
    }
    grievances[index].internalNotes!.push({
      id: `note-${Date.now()}`,
      date: new Date().toISOString(),
      author,
      type: noteType,
      content: noteContent
    });
    saveGrievances(grievances);
  }
}

export interface AccessLog {
  id: string;
  timestamp: string;
  user: string;
  resourceId: string;
  action: 'VIEW' | 'UPDATE';
  details: string;
}

const AUDIT_LOGS_KEY = 'taita_taveta_audit_logs';

const MOCK_AUDIT_LOGS: AccessLog[] = [
  {
    id: `log-1`,
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    user: 'System Admin',
    resourceId: 'TT-GRM-2026-0002',
    action: 'VIEW',
    details: 'Viewed sensitive grievance data (category: Corruption)'
  }
];

export function getAccessLogs(): AccessLog[] {
  try {
    const data = localStorage.getItem(AUDIT_LOGS_KEY);
    if (!data) return MOCK_AUDIT_LOGS;
    return JSON.parse(data);
  } catch {
    return MOCK_AUDIT_LOGS;
  }
}

export function saveAccessLogs(logs: AccessLog[]) {
  localStorage.setItem(AUDIT_LOGS_KEY, JSON.stringify(logs));
}

export function logAccess(log: Omit<AccessLog, 'id' | 'timestamp'>) {
  const logs = getAccessLogs();
  const newLog: AccessLog = {
    ...log,
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
  saveAccessLogs([newLog, ...logs]);
}

export function initStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    saveGrievances(DUMMY_DATA);
  }
  if (!localStorage.getItem(AUDIT_LOGS_KEY)) {
    saveAccessLogs(MOCK_AUDIT_LOGS);
  }
  if (!localStorage.getItem(STAFF_KEY)) {
    saveStaffMembers(MOCK_STAFF);
  }

  // Sync grievances from server-side JSON database
  fetch("/api/grievances")
    .then(r => r.json())
    .then(data => {
      if (data && data.success && Array.isArray(data.grievances)) {
        saveGrievances(data.grievances);
        console.log("[Store Sync] Grievances synced on init from server. Dispatching event...");
        window.dispatchEvent(new CustomEvent('grievances_synced'));
      }
    })
    .catch(err => {
      console.warn("[Store Sync Error] Could not connect to local server to load grievances:", err.message || err);
    });
}

