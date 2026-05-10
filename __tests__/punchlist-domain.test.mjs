import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateCompletionPercent,
  deriveProjectStatusFromCounts,
  isForwardTransition,
  normalizeAssignedTo,
} from "../src/lib/punchlist-domain.mjs";

test("forward-only transitions are enforced", () => {
  assert.equal(isForwardTransition("open", "in_progress"), true);
  assert.equal(isForwardTransition("in_progress", "complete"), true);
  assert.equal(isForwardTransition("open", "complete"), false);
  assert.equal(isForwardTransition("complete", "open"), false);
  assert.equal(isForwardTransition("in_progress", "open"), false);
});

test("project status is derived from item counts", () => {
  assert.equal(
    deriveProjectStatusFromCounts({
      open: 0,
      in_progress: 0,
      complete: 0,
      total: 0,
    }),
    "open",
  );
  assert.equal(
    deriveProjectStatusFromCounts({
      open: 3,
      in_progress: 0,
      complete: 0,
      total: 3,
    }),
    "open",
  );
  assert.equal(
    deriveProjectStatusFromCounts({
      open: 1,
      in_progress: 1,
      complete: 0,
      total: 2,
    }),
    "in_progress",
  );
  assert.equal(
    deriveProjectStatusFromCounts({
      open: 0,
      in_progress: 0,
      complete: 4,
      total: 4,
    }),
    "complete",
  );
});

test("assignment text is normalized", () => {
  assert.equal(normalizeAssignedTo("  Alex  "), "Alex");
  assert.equal(normalizeAssignedTo(""), null);
  assert.equal(normalizeAssignedTo("   "), null);
  assert.equal(normalizeAssignedTo(null), null);
});

test("completion percent handles empty projects", () => {
  assert.equal(calculateCompletionPercent(0, 0), 0);
  assert.equal(calculateCompletionPercent(3, 4), 75);
});
