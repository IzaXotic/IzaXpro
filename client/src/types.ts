// Shared entity types used across pages and API calls.
// These mirror the server-side Mongoose schemas.

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  address?: string;
  status: string;
  services?: string[];
  budget?: number | string;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  client?: string;
  type?: string;
  status: string;
  progress: number;
  startDate?: string;
  deadline?: string;
  estimatedHours?: number | string;
  budget?: number | string;
  description?: string;
}

export interface LineItem {
  description: string;
  serviceType?: string;
  quantity: number;
  unitPrice: number;
}

export interface Invoice {
  id: string;
  number?: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCompany?: string;
  clientAddress?: string;
  projectId?: string;
  projectName?: string;
  items: LineItem[];
  taxRate?: number;
  discount?: number;
  subtotal?: number;
  taxAmount?: number;
  discountAmt?: number;
  total?: number;
  status: string;
  dueDate?: string;
  notes?: string;
  paymentTerms?: string;
}

export interface Quotation extends Omit<Invoice, 'dueDate'> {
  validUntil?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title?: string;
  name?: string;
  description?: string;
  dueDate?: string;
  status: string;
  completion: number;
}

export interface SupportTicket {
  id: string;
  ticketNumber?: string;
  clientId?: string;
  clientName?: string;
  projectId?: string;
  projectName?: string;
  title?: string;
  description?: string;
  type?: string;
  priority: string;
  status: string;
  estimatedHours?: number | string;
  notes?: string;
  createdAt?: string;
}

export interface Proposal {
  id: string;
  number?: string;
  clientId?: string;
  clientName?: string;
  clientEmail?: string;
  clientCompany?: string;
  title?: string;
  status: string;
  validUntil?: string;
  baseAmount?: number;
  discount?: number;
  taxRate?: number;
  investmentAmount?: number;
  paymentSplits?: { label: string; percent: number }[];
}
