import { useState, useEffect } from 'react';
import { configAPI } from '../services/api';

const DEFAULT_CONFIG: Record<string, string[]> = {
  clientStatuses: ['New', 'Active', 'In Progress', 'On Hold', 'Completed'],
  services: ['Web Development', 'Mobile App', 'UI/UX Design', 'Software Development', 'E-Commerce', 'Maintenance', 'Consulting'],
  projectStatuses: ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'],
  projectTypes: ['Web Development', 'Mobile App', 'UI/UX Design', 'Software Development', 'E-Commerce', 'Maintenance'],
  invoiceStatuses: ['Draft', 'Sent', 'Paid', 'Overdue', 'Cancelled'],
  quotationStatuses: ['Draft', 'Sent', 'Accepted', 'Rejected', 'Converted'],
  proposalStatuses: ['Draft', 'Sent', 'Under Review', 'Accepted', 'Rejected'],
  supportStatuses: ['Open', 'In Progress', 'Resolved', 'Closed'],
  supportPriorities: ['Low', 'Medium', 'High', 'Critical'],
  supportTypes: ['Bug Fix', 'Feature Request', 'Maintenance', 'Performance', 'Design Change', 'Content Update', 'AMC', 'Other'],
  milestoneStatuses: ['Not Started', 'In Progress', 'Completed', 'Blocked'],
  paymentTerms: ['50% Advance, 50% on Delivery', '100% Advance', 'Monthly Billing', 'Milestone Based', '30 Days Net', 'Custom'],
};

let cachedConfig: Record<string, string[]> | null = null;
const listeners: Array<() => void> = [];

export const invalidateConfig = () => { cachedConfig = null; listeners.forEach(fn => fn()); };

export function useConfig() {
  const [config, setConfig] = useState<Record<string, string[]>>(cachedConfig || DEFAULT_CONFIG);
  const [loading, setLoading] = useState(!cachedConfig);

  useEffect(() => {
    const refresh = () => setConfig(cachedConfig || DEFAULT_CONFIG);
    listeners.push(refresh);
    if (!cachedConfig) {
      configAPI.getAll().then(r => {
        cachedConfig = { ...DEFAULT_CONFIG, ...r.data };
        setConfig(cachedConfig!);
      }).catch(() => {
        cachedConfig = DEFAULT_CONFIG;
        setConfig(DEFAULT_CONFIG);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
    return () => { const i = listeners.indexOf(refresh); if (i > -1) listeners.splice(i, 1); };
  }, []);

  return { config, loading };
}
