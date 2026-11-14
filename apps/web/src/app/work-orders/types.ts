import {
  Asset,
  WorkOrder,
  WorkOrderPriority,
  WorkOrderStatus,
} from '@docteurflotte/contracts';

export type WorkOrderSourceFilter = 'ALL' | 'DVIR' | 'PREDICTIVE';

export interface CreateWorkOrderFormData {
  assetId: string;
  title: string;
  description: string;
  priority: WorkOrderPriority;
  estimatedLaborHours: number;
  assignedTo: string;
}

export interface EditWorkOrderFormData {
  title: string;
  description: string;
  priority: WorkOrderPriority;
  estimatedLaborHours: number;
  assignedTo: string;
}

export interface CompleteWorkOrderFormData {
  actualLaborHours: number;
  partsCost: number;
  downtimeHours: number;
  completionNotes: string;
}

export interface WorkOrdersKpiSummary {
  totalCount: number;
  scheduledCount: number;
  inProgressCount: number;
  completedCount: number;
  criticalCount: number;
  totalSpentDzd: number;
}

