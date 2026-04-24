import axios from 'axios';

const API = axios.create({
  baseURL: process.env.REACT_APP_API_URL || (
    process.env.NODE_ENV === 'production' ? '/api' : 'http://localhost:5001/api'
  )
});

export const clientsAPI = {
  getAll: () => API.get('/clients'),
  get: (id: string) => API.get(`/clients/${id}`),
  create: (data: any) => API.post('/clients', data),
  update: (id: string, data: any) => API.put(`/clients/${id}`, data),
  delete: (id: string) => API.delete(`/clients/${id}`)
};

export const projectsAPI = {
  getAll: (clientId?: string) => API.get('/projects', { params: clientId ? { clientId } : {} }),
  get: (id: string) => API.get(`/projects/${id}`),
  create: (data: any) => API.post('/projects', data),
  update: (id: string, data: any) => API.put(`/projects/${id}`, data),
  delete: (id: string) => API.delete(`/projects/${id}`)
};

export const invoicesAPI = {
  getAll: () => API.get('/invoices'),
  create: (data: any) => API.post('/invoices', data),
  update: (id: string, data: any) => API.put(`/invoices/${id}`, data),
  delete: (id: string) => API.delete(`/invoices/${id}`)
};

export const quotationsAPI = {
  getAll: () => API.get('/quotations'),
  create: (data: any) => API.post('/quotations', data),
  update: (id: string, data: any) => API.put(`/quotations/${id}`, data),
  delete: (id: string) => API.delete(`/quotations/${id}`),
  convert: (id: string) => API.post(`/quotations/${id}/convert`)
};

export const proposalsAPI = {
  getAll: () => API.get('/proposals'),
  create: (data: any) => API.post('/proposals', data),
  update: (id: string, data: any) => API.put(`/proposals/${id}`, data),
  delete: (id: string) => API.delete(`/proposals/${id}`)
};

export const milestonesAPI = {
  getAll: (projectId?: string) => API.get('/milestones', { params: projectId ? { projectId } : {} }),
  create: (data: any) => API.post('/milestones', data),
  update: (id: string, data: any) => API.put(`/milestones/${id}`, data),
  delete: (id: string) => API.delete(`/milestones/${id}`)
};

export const supportAPI = {
  getAll: () => API.get('/support'),
  create: (data: any) => API.post('/support', data),
  update: (id: string, data: any) => API.put(`/support/${id}`, data),
  delete: (id: string) => API.delete(`/support/${id}`)
};

export const dashboardAPI = {
  get: () => API.get('/dashboard')
};

export const pdfAPI = {
  generateInvoice: (id: string) => API.post(`/pdf/invoice/${id}`),
  generateQuotation: (id: string) => API.post(`/pdf/quotation/${id}`),
  generateProposal: (id: string) => API.post(`/pdf/proposal/${id}`)
};

export default API;
