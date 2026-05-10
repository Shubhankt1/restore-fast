export type PunchItemStatus = "open" | "in_progress" | "complete";
export type Priority = "low" | "normal" | "high";

export interface StatusCounts {
  open: number;
  in_progress: number;
  complete: number;
  total: number;
}

export interface BreakdownEntry {
  label: string;
  count: number;
  completeCount: number;
  completionPercent: number;
}

export interface DashboardMetrics {
  completionPercent: number;
  byLocation: BreakdownEntry[];
  byPriority: BreakdownEntry[];
  byAssignee: BreakdownEntry[];
  countsByStatus: Record<PunchItemStatus, number>;
}

export declare const punchItemStatusOrder: readonly PunchItemStatus[];
export declare const priorityOrder: readonly Priority[];

export declare function isForwardTransition(
  current: PunchItemStatus,
  next: PunchItemStatus,
): boolean;

export declare function deriveProjectStatusFromCounts(
  counts: StatusCounts,
): PunchItemStatus;

export declare function normalizeAssignedTo(value: unknown): string | null;

export declare function calculateCompletionPercent(
  completeCount: number,
  totalCount: number,
): number;

export declare function sortBreakdownEntries<
  T extends { label: string; count: number },
>(entries: T[]): T[];
