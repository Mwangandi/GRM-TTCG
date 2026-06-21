export type Status = 
  | 'Logged' 
  | 'Acknowledged & Sorted' 
  | 'Under Investigation' 
  | 'Immediate Resolution' 
  | 'Action & Resolution' 
  | 'Appeal to County GRM'
  | 'Appeal Resolution'
  | 'External Referral'
  | 'Case Closed';

export type Category = 'Service Delay' | 'Corruption' | 'GBV' | 'General Complaint' | 'Compliment' | 'Suggestion' | 'Emergency';

export interface TimelineEvent {
  date: string;
  status: Status;
  note?: string;
  actor?: string;
}

export interface StaffMember {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'GRM Officer';
}

export interface Attachment {
  name: string;
  url: string;
  type: string;
  size: number;
}

export interface InternalNote {
  id: string;
  date: string;
  author: string;
  type: 'Note' | 'Report';
  content: string;
}

export interface Grievance {
  id: string; // TT-GRM Tracking ID
  dateSubmitted: string;
  channel: 'Portal' | 'Walk-in' | 'WhatsApp' | 'Phone';

  // Complainant Details (TT-GRM-01)
  isAnonymous: boolean;
  name?: string;
  gender?: 'Male' | 'Female' | 'Other' | '';
  idNumber?: string;
  ward?: string;
  phone?: string;

  category: Category;
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent';
  description: string;
  previousAction?: string;
  attachments?: Attachment[];
  internalNotes?: InternalNote[];

  // Staff handling
  status: Status;
  assignedDepartment?: string;
  assignedStaff?: string;
  resolutionSummary?: string;
  resolutionDate?: string;
  appealResolutionSummary?: string;
  
  history?: TimelineEvent[];

  // Closure (TT-GRM-04)
  citizenSatisfaction?: 'Satisfied' | 'Not Satisfied';
  appealSatisfaction?: 'Satisfied' | 'Not Satisfied';
  citizenComment?: string;
}
