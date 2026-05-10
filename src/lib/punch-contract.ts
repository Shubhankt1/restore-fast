export type PunchItemStatus = "open" | "in_progress" | "complete";

export type PunchItemPriority = "low" | "normal" | "high";

export type Project = {
  id: string;
  name: string;
  address: string;
  status: string;
  createdAt: string;
  itemCount?: number;
  completionPercent?: number;
};

export type PunchItem = {
  id: string;
  projectId: string;
  location: string;
  description: string;
  status: PunchItemStatus;
  priority: PunchItemPriority;
  assignedTo: string;
  photo: string | null;
  createdAt: string;
};

export type BreakdownEntry = {
  label: string;
  count: number;
  completeCount: number;
  inProgressCount: number;
  openCount: number;
  completionPercent: number;
};

export type DashboardMetrics = {
  completionPercent: number;
  byLocation: BreakdownEntry[];
  byPriority: BreakdownEntry[];
  byAssignee: BreakdownEntry[];
  countsByStatus: Record<PunchItemStatus, number>;
};

export type MutationState = {
  ok: boolean;
  formError?: string;
  fieldErrors?: Record<string, string>;
};
