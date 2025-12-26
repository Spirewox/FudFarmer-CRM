import { QueryObserverResult, RefetchOptions } from "@tanstack/react-query";
import { IUser } from "./contexts/AuthContext";


export enum CustomerType {
  B2C = 'B2C',
  B2B = 'B2B',
}

export enum Location {
  LAGOS = 'Lagos',
  IFE = 'Ife',
}

export enum LeadStatus {
  NEW = 'New',
  CONTACTED = 'Contacted',
  NEGOTIATION = 'Negotiation',
  CLOSED_WON = 'Closed Won',
  CLOSED_LOST = 'Closed Lost',
}

export enum FeedbackType {
  COMPLAINT = 'Complaint',
  SUGGESTION = 'Suggestion',
  APPRECIATION = 'Appreciation',
}

export enum Sentiment {
  POSITIVE = 'Positive',
  NEUTRAL = 'Neutral',
  NEGATIVE = 'Negative',
}

export enum CompensationCategory {
  PRODUCT = 'Product',
  MERCH = 'Merch',
  VOUCHER = 'Voucher',
  REFUND = 'Refund'
}

export enum TaskPriority {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High',
}

export enum TaskStatus {
  TODO = 'To Do',
  IN_PROGRESS = 'In Progress',
  DONE = 'Done',
}

export const PREDEFINED_SEGMENTS = [
  'B2B - Restaurant',
  'B2C - Home Cook',
  'B2B - Caterer',
  'B2C - Student',
  'Lagos - Retail',
  'Ife - Wholesale'
];

export interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'Admin' | 'Sales Agent';
  location: Location;
  joinedDate: string;
  avatar?: string;
  password?: string; // For login simulation
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToId: string; // Agent ID
  assignedToName: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdBy: string; // Admin who created it
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: CustomerType;
  location: Location;
  companyName?: string; // For B2B
  joinedDate: string;
  segments?: string[];
  totalOrders: number;
  totalSpent: number;
  addedByAgentId?: string; // ID of agent who added them
  addedByAgentName?: string;
}

export interface Lead {
  id: string;
  businessName: string;
  contactPerson: string;
  phone: string;
  location: Location;
  status: LeadStatus;
  potentialValue: number;
  salesAgent: string; // Name (legacy) or ideally ID
  salesAgentId?: string;
  notes: string;
  aiScore?: number;
  aiInsight?: string;
}

export interface Feedback {
  id: string;
  customerId: string;
  customerName: string;
  type: FeedbackType;
  content: string;
  date: string;
  status: 'Open' | 'Resolved';
  sentiment?: Sentiment; // AI Generated
  resolutionNote?: string;
  resolvedDate?: string;
  resolvedByAgentId?: string;
  resolvedByAgentName?: string;
}

export interface Compensation {
  id: string;
  customerId: string;
  customerName: string;
  reason: string;
  amount: number;
  date: string;
  status: 'Pending' | 'Approved' | 'Paid';
  category: CompensationCategory;
  recordedByAgentId?: string;
  recordedByAgentName?: string;
}

export interface Enquiry {
  id: string;
  customerName: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'Open' | 'Closed';
  resolution?: string;
  responseDraft?: string; // AI Generated
  managedByAgentId?: string;
  managedByAgentName?: string;
}

export interface AuthContextType {
  user: IUser | null;
  login: (user: IUser) => void;
  logout: () => void;
  loading: boolean;
  isRefetching : boolean;
  error : boolean,
  refetch : (options?: RefetchOptions) => Promise<QueryObserverResult<IUser, Error>>,
  isAuthenticated: boolean;
}