// Weeks are derived from the real calendar instead of being hardcoded to 4.
// A month is split into consecutive 7-day chunks starting at day 1:
//   Week 1: 1-7, Week 2: 8-14, Week 3: 15-21, Week 4: 22-28, Week 5: 29-end
// Months with 29-31 days (i.e. every month except a non-leap February)
// naturally get a short Week 5 covering whatever days remain.

/**
 * Returns the list of weeks for a given month/year based on the real
 * calendar, e.g. [{ label: "Week 1", start: 1, end: 7 }, ...].
 * Falls back to the current month/year if either input is missing or
 * invalid, so callers never get back an empty array.
 */
export const getMonthWeeks = (month, year) => {
  let y = parseInt(year, 10);
  let m = parseInt(month, 10) - 1;

  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth();
  }

  const lastDay = new Date(y, m + 1, 0).getDate();

  const weeks = [];
  let start = 1;
  let weekNum = 1;

  while (start <= lastDay) {
    const end = Math.min(start + 6, lastDay);
    weeks.push({ label: `Week ${weekNum}`, start, end });
    start = end + 1;
    weekNum += 1;
  }

  return weeks;
};

/** Convenience helper: just the week label strings, e.g. ["Week 1", ...]. */
export const getMonthWeekLabels = (month, year) =>
  getMonthWeeks(month, year).map((w) => w.label);

/**
 * Returns the min/max ISO date strings (YYYY-MM-DD) for a given week label
 * within a month/year, based on the real calendar split above. Safe to call
 * with missing/invalid month, year, or week — always returns a valid range.
 */
export const getWeekDateRange = (week, month, year) => {
  let y = parseInt(year, 10);
  let m = parseInt(month, 10) - 1;

  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth();
  }

  const weeks = getMonthWeeks(month, year);
  const match = weeks.find((w) => w.label === week) ?? weeks[0];

  const pad = (n) => String(n).padStart(2, "0");
  const monthStr = pad(m + 1);

  return {
    min: `${y}-${monthStr}-${pad(match.start)}`,
    max: `${y}-${monthStr}-${pad(match.end)}`,
  };
};

// ---------------------------------------------------------------------------
// Week status helpers (shared source of truth between COBS.jsx / table
// summary and COBSModal.jsx / per-row display, so they never diverge).
// ---------------------------------------------------------------------------

/**
 * Returns the batch with the highest batch_no from a week's entries array
 * (i.e. the "current" / most recent state of that week), or null if empty.
 */
export const getLatestEntry = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  return entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
};

/**
 * Derives a human-readable status for a week based on its latest batch entry.
 * Note: this intentionally does NOT rely on the raw `batch.status` field
 * (which is often just "On Progress" from the API regardless of actual
 * completion state) — it derives status from the is_completed / is_evaluated /
 * is_approved / is_assessed flags and score instead.
 *
 * Possible return values:
 *   "Pending" | "Saved as Draft" | "On Going" | "For Signature" |
 *   "For Acknowledgement" | "Merged" | "Done"
 */
export const getWeekStatus = (entries) => {
  const latest = getLatestEntry(entries);
  if (!latest) return "Pending";
  const raw = latest.status?.toLowerCase() ?? "";

  if (raw === "on going") return "On Going";

  if (latest.is_completed === 1 || latest.is_completed === true) {
    if (!latest.is_evaluated) return "For Signature";
    if (!latest.is_approved) return "For Acknowledgement";
    if (!latest.is_assessed) return "For Acknowledgement";
    if (latest.score == null) return "Merged";
    return "Done";
  }

  if (latest.is_completed === 0 || latest.is_completed === false)
    return "Saved as Draft";

  return "Pending";
};

/**
 * A week counts as "completed" for progress/summary purposes (e.g. the
 * "4/5" counter, or the overall table status) when it's either fully
 * Done or Merged into another week.
 */
export const isWeekDone = (entries) => {
  const status = getWeekStatus(entries)?.toLowerCase();
  return status === "done" || status === "merged";
};
