import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Builds a pivot structure:
 * {
 *   [year]: {
 *     [unitName]: {
 *       [monthIndex 0-11]: number[]
 *     }
 *   }
 * }
 */
const buildPivot = (apiData) => {
  const pivot = {};

  if (!apiData) return pivot;

  Object.entries(apiData).forEach(([unitKey, unitData]) => {
    const unitName = unitKey.replace(/^Unit:\s*/i, "").trim();
    const weekMap = unitData?.weeks ?? {};

    Object.values(weekMap).forEach((batches) => {
      if (!Array.isArray(batches) || batches.length === 0) return;

      const latest = batches.reduce((a, b) =>
        b.batch_no > a.batch_no ? b : a,
      );

      const score = latest?.score;
      const startAt = latest?.start_at;

      if (score == null || !startAt) return;

      const d = dayjs(startAt);
      if (!d.isValid()) return;

      const year = d.year();
      const monthIdx = d.month();

      if (!pivot[year]) pivot[year] = {};
      if (!pivot[year][unitName]) pivot[year][unitName] = {};
      if (!pivot[year][unitName][monthIdx])
        pivot[year][unitName][monthIdx] = [];

      pivot[year][unitName][monthIdx].push(Number(score));
    });
  });

  return pivot;
};

const avg = (arr) => {
  if (!arr || arr.length === 0) return null;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
};

export const exportCobsToExcel = async (apiData, startDate, endDate) => {
  const pivot = buildPivot(apiData);
  const years = Object.keys(pivot).map(Number).sort();

  const wb = new ExcelJS.Workbook();
  wb.creator = "COBS Monitoring System";
  wb.created = new Date();

  const ws = wb.addWorksheet("COBS DB");

  ws.getColumn(1).width = 30;
  MONTHS.forEach((_, i) => {
    ws.getColumn(i + 2).width = 10;
  });

  const thinBorder = {
    top: { style: "thin", color: { argb: "FFD0D0D0" } },
    left: { style: "thin", color: { argb: "FFD0D0D0" } },
    bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
    right: { style: "thin", color: { argb: "FFD0D0D0" } },
  };

  const WHITE_BG = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFFFF" },
  };
  const GRAY_BG = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFF2F2F2" },
  };

  // ── Row 1: Title ──────────────────────────────────────────────────────────
  ws.mergeCells(1, 1, 1, 14);
  const titleCell = ws.getCell("A1");
  titleCell.value = "Average of Rating     Column Labels  \u25BC";
  titleCell.font = {
    name: "Calibri",
    bold: false,
    size: 11,
    color: { argb: "FF000000" },
  };
  titleCell.fill = WHITE_BG;
  titleCell.alignment = { horizontal: "left", vertical: "middle" };
  ws.getRow(1).height = 18;

  // ── Row 2: Column headers ─────────────────────────────────────────────────
  const headerRow = ws.addRow(["Row Labels  \u25BC", ...MONTHS]);
  headerRow.height = 18;
  headerRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
    cell.font = { name: "Calibri", bold: true, size: 11 };
    cell.fill = WHITE_BG;
    cell.border = thinBorder;
    cell.alignment =
      colNum === 1
        ? { horizontal: "left", vertical: "middle" }
        : { horizontal: "right", vertical: "middle" };
  });

  // ── Grand total accumulators ───────────────────────────────────────────────
  const grandTotals = Array(12)
    .fill(null)
    .map(() => []);

  // ── Data rows per year ────────────────────────────────────────────────────
  years.forEach((year) => {
    // Year group row — light gray, bold, with collapse indicator
    const yearRow = ws.addRow([`\u229F${year}`]);
    yearRow.height = 16;
    for (let c = 1; c <= 13; c++) {
      const cell = yearRow.getCell(c);
      cell.fill = GRAY_BG;
      cell.border = thinBorder;
      if (c === 1) {
        cell.font = { name: "Calibri", bold: true, size: 11 };
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    }

    const unitNames = Object.keys(pivot[year]).sort();
    const yearTotals = Array(12)
      .fill(null)
      .map(() => []);

    unitNames.forEach((unitName) => {
      const monthScores = pivot[year][unitName];
      const rowValues = [unitName];

      MONTHS.forEach((_, mIdx) => {
        const scores = monthScores[mIdx];
        const value = avg(scores);
        rowValues.push(value);
        if (value != null) {
          yearTotals[mIdx].push(value);
          grandTotals[mIdx].push(value);
        }
      });

      const dataRow = ws.addRow(rowValues);
      dataRow.height = 15;
      dataRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        cell.font = { name: "Calibri", size: 11 };
        cell.fill = WHITE_BG;
        cell.border = thinBorder;
        if (colNum === 1) {
          cell.alignment = {
            horizontal: "left",
            vertical: "middle",
            indent: 2,
          };
        } else {
          cell.alignment = { horizontal: "right", vertical: "middle" };
          if (typeof cell.value === "number") {
            cell.numFmt = "0.00";
          }
        }
      });
    });
  });

  // ── Grand Total row ───────────────────────────────────────────────────────
  const grandTotalValues = [
    "Grand Total",
    ...grandTotals.map((arr) => avg(arr)),
  ];
  const grandTotalRow = ws.addRow(grandTotalValues);
  grandTotalRow.height = 17;
  grandTotalRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
    cell.font = { name: "Calibri", bold: true, size: 11 };
    cell.fill = GRAY_BG;
    cell.border = thinBorder;
    if (colNum === 1) {
      cell.alignment = { horizontal: "left", vertical: "middle" };
    } else {
      cell.alignment = { horizontal: "right", vertical: "middle" };
      if (typeof cell.value === "number") {
        cell.numFmt = "0.00";
      }
    }
  });

  ws.views = [{ state: "frozen", ySplit: 2 }];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const from = dayjs(startDate).format("MMDDYYYY");
  const to = dayjs(endDate).format("MMDDYYYY");
  saveAs(blob, `cobs_monitoring_${from}_${to}.xlsx`);
};
