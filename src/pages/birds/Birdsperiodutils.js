export const getMonthPeriods = (month, year) => {
  let y = parseInt(year, 10);
  let m = parseInt(month, 10) - 1;

  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth();
  }

  const lastDay = new Date(y, m + 1, 0).getDate();

  const periods = [];
  let start = 1;
  let periodNum = 1;

  while (start <= lastDay) {
    const end = Math.min(start + 6, lastDay);
    periods.push({ label: `Period ${periodNum}`, start, end });
    start = end + 1;
    periodNum += 1;
  }

  return periods;
};

export const getMonthPeriodLabels = (month, year) =>
  getMonthPeriods(month, year).map((p) => p.label);

export const getPeriodDateRange = (period, month, year) => {
  let y = parseInt(year, 10);
  let m = parseInt(month, 10) - 1;

  if (!Number.isFinite(y) || !Number.isFinite(m)) {
    const now = new Date();
    y = now.getFullYear();
    m = now.getMonth();
  }

  const periods = getMonthPeriods(month, year);
  const match = periods.find((p) => p.label === period) ?? periods[0];

  const pad = (n) => String(n).padStart(2, "0");
  const monthStr = pad(m + 1);

  return {
    min: `${y}-${monthStr}-${pad(match.start)}`,
    max: `${y}-${monthStr}-${pad(match.end)}`,
  };
};

// ---------------------------------------------------------------------------
// Period status helpers (shared source of truth between BirdsPage.jsx /
// table summary and BirdsModal.jsx / per-row display, so they never
// diverge).
// ---------------------------------------------------------------------------

/**
 * Returns the batch with the highest batch_no from a period's entries array
 * (i.e. the "current" / most recent state of that period), or null if empty.
 */
export const getLatestEntry = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  return entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
};

/**
 * Derives a human-readable status for a period based on its latest batch
 * entry. Mirrors the backend's `$status = match (true) { ... }` logic,
 * with one override: for the "birds" section, acknowledgement no longer
 * gates on signatory_1 — status is derived from signatory_2 / signatory_3
 * only, since the Acknowledge (signatory_1) step happens independently.
 *
 *   $section === 'pests' => is_null($signatory1) ? 'For Acknowledgement' : 'Done',
 *   ! is_null($firstResponse?->parent_response_id) => 'Done',
 *   $section === 'birds' => (is_null($signatory2) || is_null($signatory3)) ? 'For Approval' : 'Done',
 *   is_null($signatory1) => 'For Acknowledgement',
 *   is_null($signatory2), is_null($signatory3) => 'For Approval',
 *   default => 'Done',
 *
 * `section` should be one of "birds", "pests", "cobs", etc. — pass it in
 * from the caller (each module knows its own section).
 *
 * Possible return values:
 *   "Pending" | "Saved as Draft" | "For Acknowledgement" |
 *   "For Approval" | "Done"
 */
export const getWeekStatus = (entries, section) => {
  const latest = getLatestEntry(entries);
  if (!latest) return "Pending";

  // Not yet submitted (draft) — keep this ahead of the signatory logic,
  // since a draft entry won't have signatories yet either way.
  if (latest.is_completed === 0 || latest.is_completed === false) {
    return "Saved as Draft";
  }

  const signatory1 = latest.signatory_1 ?? latest.signatory1 ?? null;
  const signatory2 = latest.signatory_2 ?? latest.signatory2 ?? null;
  const signatory3 = latest.signatory_3 ?? latest.signatory3 ?? null;
  const firstResponse = latest.responses?.[0];
  const parentResponseId =
    firstResponse?.parent_response_id ??
    firstResponse?.response?.parent_response_id ??
    null;

  if (section === "pests") {
    return signatory1 == null ? "For Acknowledgement" : "Done";
  }

  if (parentResponseId != null) return "Done";

  if (section === "birds") {
    return signatory2 == null || signatory3 == null ? "For Approval" : "Done";
  }

  if (signatory1 == null) return "For Acknowledgement";
  if (signatory2 == null || signatory3 == null) return "For Approval";

  return "Done";
};

/**
 * A period counts as "completed" for progress/summary purposes (e.g. the
 * "3/5" counter, or the overall table status) when it's fully Done.
 */
export const isWeekDone = (entries, section) => {
  const status = getWeekStatus(entries, section)?.toLowerCase();
  return status === "done";
};
