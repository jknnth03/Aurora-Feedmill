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
