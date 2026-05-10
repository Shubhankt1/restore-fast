export const punchItemStatusOrder = ["open", "in_progress", "complete"];
export const priorityOrder = ["low", "normal", "high"];

export function isForwardTransition(current, next) {
  const currentIndex = punchItemStatusOrder.indexOf(current);
  const nextIndex = punchItemStatusOrder.indexOf(next);

  return currentIndex >= 0 && nextIndex === currentIndex + 1;
}

export function deriveProjectStatusFromCounts(counts) {
  if (counts.total === 0) {
    return "open";
  }

  if (counts.complete === counts.total) {
    return "complete";
  }

  if (counts.in_progress > 0 || counts.complete > 0) {
    return "in_progress";
  }

  return "open";
}

export function normalizeAssignedTo(value) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function calculateCompletionPercent(completeCount, totalCount) {
  if (totalCount <= 0) {
    return 0;
  }

  return Math.round((completeCount / totalCount) * 100);
}

export function sortBreakdownEntries(entries) {
  return [...entries].sort((left, right) => {
    if (right.count !== left.count) {
      return right.count - left.count;
    }

    return String(left.label).localeCompare(String(right.label));
  });
}
