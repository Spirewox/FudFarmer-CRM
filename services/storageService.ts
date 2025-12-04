

import { Customer, Lead, Feedback, Compensation, Enquiry, CustomerType, Location, LeadStatus, FeedbackType, Agent, Task, TaskPriority, TaskStatus } from '../types';

// Mock Data Generators
const generateId = () => Math.random().toString(36).substr(2, 9);

const INITIAL_AGENTS: Agent[] = [
  { id: 'a1', name: 'Admin User', email: 'admin@fudfarmer.com', phone: '08000000001', role: 'Admin', location: Location.LAGOS, joinedDate: '2023-01-01', password: 'password' },
  { id: 'a2', name: 'Chioma Obi', email: 'chioma@fudfarmer.com', phone: '08000000002', role: 'Sales Agent', location: Location.LAGOS, joinedDate: '2023-06-15', password: 'password' },
  { id: 'a3', name: 'Femi Ade', email: 'femi@fudfarmer.com', phone: '08000000003', role: 'Sales Agent', location: Location.IFE, joinedDate: '2023-08-20', password: 'password' },
  { id: 'a4', name: 'Yusuf Ibrahim', email: 'yusuf@fudfarmer.com', phone: '08000000004', role: 'Sales Agent', location: Location.LAGOS, joinedDate: '2024-01-10', password: 'password' },
];

const INITIAL_TASKS: Task[] = [
  { id: 't1', title: 'Follow up with Lagos Island Hotel', description: 'Check if they need a restock of catfish.', assignedToId: 'a2', assignedToName: 'Chioma Obi', dueDate: '2024-05-25', priority: TaskPriority.HIGH, status: TaskStatus.TODO, createdBy: 'Admin User' },
  { id: 't2', title: 'Onboard new wholesalers in Ife', description: 'Visit Modakeke market and distribute flyers.', assignedToId: 'a3', assignedToName: 'Femi Ade', dueDate: '2024-05-30', priority: TaskPriority.MEDIUM, status: TaskStatus.IN_PROGRESS, createdBy: 'Admin User' },
];

const INITIAL_CUSTOMERS: Customer[] = [
  { 
    id: '1', 
    name: 'Mama Nkechi Kitchen', 
    type: CustomerType.B2B, 
    location: Location.LAGOS, 
    companyName: 'Nkechi Foods Ltd', 
    email: 'nkechi@example.com', 
    phone: '08012345678', 
    joinedDate: '2023-10-15',
    segments: ['B2B - Restaurant', 'Lagos - Retail'],
    totalOrders: 15,
    totalSpent: 450000,
    addedByAgentId: 'a2',
    addedByAgentName: 'Chioma Obi'
  },
  { 
    id: '2', 
    name: 'Tunde Bakare', 
    type: CustomerType.B2C, 
    location: Location.IFE, 
    email: 'tunde@example.com', 
    phone: '08087654321', 
    joinedDate: '2023-11-02',
    segments: ['B2C - Student'],
    totalOrders: 1,
    totalSpent: 5000,
    addedByAgentId: 'a3',
    addedByAgentName: 'Femi Ade'
  },
  { 
    id: '3', 
    name: 'Student Union Cafe', 
    type: CustomerType.B2B, 
    location: Location.IFE, 
    companyName: 'OAU SU', 
    email: 'su@oau.edu.ng', 
    phone: '08011122233', 
    joinedDate: '2024-01-20',
    segments: ['B2B - Caterer', 'Ife - Wholesale'],
    totalOrders: 42,
    totalSpent: 1200000,
    addedByAgentId: 'a3',
    addedByAgentName: 'Femi Ade'
  },
  { 
    id: '4', 
    name: 'Mrs. Adebayo', 
    type: CustomerType.B2C, 
    location: Location.LAGOS, 
    email: 'adebayo@gmail.com', 
    phone: '08122223333', 
    joinedDate: '2024-02-10',
    segments: ['B2C - Home Cook'],
    totalOrders: 5,
    totalSpent: 125000,
    addedByAgentId: 'a2',
    addedByAgentName: 'Chioma Obi'
  },
];

const INITIAL_LEADS: Lead[] = [
  { id: '1', businessName: 'Lagos Island Hotel', contactPerson: 'Mr. Okon', phone: '09099988877', location: Location.LAGOS, status: LeadStatus.NEW, potentialValue: 500000, notes: 'Interested in bulk smoked catfish supply weekly.', salesAgent: 'Chioma Obi', salesAgentId: 'a2' },
  { id: '2', businessName: 'Ife Resort', contactPerson: 'Mrs. Adebayo', phone: '08122233344', location: Location.IFE, status: LeadStatus.NEGOTIATION, potentialValue: 250000, notes: 'Negotiating price on frozen chicken cartons.', salesAgent: 'Femi Ade', salesAgentId: 'a3' },
];

const INITIAL_FEEDBACK: Feedback[] = [
  { id: '1', customerId: '2', customerName: 'Tunde Bakare', type: FeedbackType.COMPLAINT, content: 'The dried fish I bought last week was too salty.', date: '2024-05-10', status: 'Open', sentiment: 'Negative' as any },
  { id: '2', customerId: '1', customerName: 'Mama Nkechi Kitchen', type: FeedbackType.APPRECIATION, content: 'Delivery was very fast today, thank you!', date: '2024-05-12', status: 'Resolved', sentiment: 'Positive' as any, resolutionNote: 'Thanked the customer via whatsapp.', resolvedDate: '2024-05-12', resolvedByAgentId: 'a2', resolvedByAgentName: 'Chioma Obi' },
  { id: '3', customerId: '3', customerName: 'Student Union Cafe', type: FeedbackType.SUGGESTION, content: 'Can you start packaging the egusi in 5kg bags? It helps with storage.', date: '2024-05-18', status: 'Open', sentiment: 'Neutral' as any },
];

const INITIAL_ENQUIRIES: Enquiry[] = [
  { id: '1', customerName: 'Hotel Ibis', email: 'purchasing@ibis.com', subject: 'Bulk Chicken Pricing', message: 'Hello, we are looking for a weekly supply of 50 cartons of frozen chicken. Do you deliver to Ikeja? What is your best price?', date: '2024-05-15', status: 'Open' },
  { id: '2', customerName: 'Chef Tolu', email: 'tolu@gmail.com', subject: 'Palm Oil Quality', message: 'Is your palm oil unadulterated? I need 20 kegs for my restaurant in Ife.', date: '2024-05-16', status: 'Closed', resolution: 'Confirmed quality via video call and sent sample.', managedByAgentId: 'a3', managedByAgentName: 'Femi Ade' },
];

// Local Storage Keys
const KEYS = {
  CUSTOMERS: 'fudfarmer_customers',
  LEADS: 'fudfarmer_leads',
  FEEDBACK: 'fudfarmer_feedback',
  COMPENSATIONS: 'fudfarmer_compensations',
  ENQUIRIES: 'fudfarmer_enquiries',
  AGENTS: 'fudfarmer_agents',
  TASKS: 'fudfarmer_tasks',
};

// Generic Get/Set
const getItems = <T>(key: string, initialData: T[]): T[] => {
  const stored = localStorage.getItem(key);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(key, JSON.stringify(initialData));
  return initialData;
};

const setItems = <T>(key: string, items: T[]) => {
  localStorage.setItem(key, JSON.stringify(items));
};

// Service Exports
export const StorageService = {
  getCustomers: () => getItems<Customer>(KEYS.CUSTOMERS, INITIAL_CUSTOMERS),
  saveCustomers: (items: Customer[]) => setItems(KEYS.CUSTOMERS, items),

  getLeads: () => getItems<Lead>(KEYS.LEADS, INITIAL_LEADS),
  saveLeads: (items: Lead[]) => setItems(KEYS.LEADS, items),

  getFeedback: () => getItems<Feedback>(KEYS.FEEDBACK, INITIAL_FEEDBACK),
  saveFeedback: (items: Feedback[]) => setItems(KEYS.FEEDBACK, items),

  getCompensations: () => getItems<Compensation>(KEYS.COMPENSATIONS, []),
  saveCompensations: (items: Compensation[]) => setItems(KEYS.COMPENSATIONS, items),

  getEnquiries: () => getItems<Enquiry>(KEYS.ENQUIRIES, INITIAL_ENQUIRIES),
  saveEnquiries: (items: Enquiry[]) => setItems(KEYS.ENQUIRIES, items),

  getAgents: () => getItems<Agent>(KEYS.AGENTS, INITIAL_AGENTS),
  saveAgents: (items: Agent[]) => setItems(KEYS.AGENTS, items),

  getTasks: () => getItems<Task>(KEYS.TASKS, INITIAL_TASKS),
  saveTasks: (items: Task[]) => setItems(KEYS.TASKS, items),

  resetData: () => {
    Object.values(KEYS).forEach(key => localStorage.removeItem(key));
    window.location.reload();
  },

  generateId,
};