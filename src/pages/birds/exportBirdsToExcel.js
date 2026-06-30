import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

const COLUMNS = [
  { header: "Date Monitor", key: "date_monitor", width: 18 },
  { header: "Month", key: "month", width: 10 },
  { header: "Year", key: "year", width: 8 },
  { header: "MoYr", key: "moyr", width: 10 },
  { header: "Unit", key: "unit", width: 12 },
  { header: "Time Started", key: "time_started", width: 16 },
  { header: "Time Finished", key: "time_finished", width: 16 },
  { header: "Inspected by", key: "inspected_by", width: 32 },
  { header: "Lot", key: "lot", width: 24 },
  { header: "Infestation Level", key: "infestation_level", width: 18 },
  { header: "Treatment/Action Done", key: "treatment", width: 22 },
  { header: "Presence of Feed/RM Wastage", key: "wastage", width: 28 },
  {
    header: "Identify Entry Points/Saan sila pumapasok o dumadaan",
    key: "entry_points",
    width: 55,
  },
];

const parseRows = (apiData) => {
  const rows = [];

  Object.entries(apiData).forEach(([, checklistData]) => {
    const periods = checklistData?.periods ?? {};

    Object.entries(periods).forEach(([, batches]) => {
      if (!Array.isArray(batches) || batches.length === 0) return;

      const latest = batches.reduce((a, b) =>
        b.batch_no > a.batch_no ? b : a,
      );

      const responses = latest?.responses ?? [];
      const user = latest?.user ?? "";
      const startAt = latest?.start_at ?? null;
      const endAt = latest?.end_at ?? null;
      const unit = latest?.unit ?? "";

      const dateMonitor = startAt ? dayjs(startAt) : null;
      const month = dateMonitor?.isValid() ? dateMonitor.format("MMM") : "";
      const year = dateMonitor?.isValid() ? dateMonitor.format("YYYY") : "";
      const moyr = dateMonitor?.isValid() ? dateMonitor.format("MMMYY") : "";
      const timeStarted = startAt ? dayjs(startAt).format("h:mm A") : "";
      const timeFinished = endAt ? dayjs(endAt).format("h:mm A") : "";

      if (responses.length === 0) {
        rows.push({
          date_monitor: dateMonitor?.isValid() ? dateMonitor.toDate() : "",
          month,
          year,
          moyr,
          unit,
          time_started: timeStarted,
          time_finished: timeFinished,
          inspected_by: user,
          lot: "",
          infestation_level: "",
          treatment: latest?.treatment_dose ?? "",
          wastage: "",
          entry_points: "",
        });
        return;
      }

      responses.forEach((res) => {
        const r = res?.response ?? {};
        rows.push({
          date_monitor: dateMonitor?.isValid() ? dateMonitor.toDate() : "",
          month,
          year,
          moyr,
          unit,
          time_started: timeStarted,
          time_finished: timeFinished,
          inspected_by: user,
          lot: r.inspection_area ?? "",
          infestation_level: r.infestation_level ?? "",
          treatment: r.treatment_dose ?? "",
          wastage: Array.isArray(r.wastage)
            ? r.wastage.join(", ")
            : (r.wastage ?? ""),
          entry_points: r.entry_points ?? "",
        });
      });
    });
  });

  return rows;
};

export const exportBirdsToExcel = async (apiData, startDate, endDate) => {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Birds Monitoring System";
  wb.created = new Date();

  const ws = wb.addWorksheet("BM DB");

  // Row 1 — Yellow title
  ws.mergeCells(1, 1, 1, COLUMNS.length);
  const titleCell = ws.getCell("A1");
  titleCell.value = "Birds Monitoring Form";
  titleCell.font = {
    name: "Arial",
    bold: true,
    size: 13,
    color: { argb: "FF000000" },
  };
  titleCell.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFFFFF00" },
  };
  titleCell.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(1).height = 24;

  // Row 2 — Blue column headers (no empty row in between)
  const headerRow = ws.addRow(COLUMNS.map((c) => c.header));
  headerRow.height = 20;
  headerRow.eachCell((cell) => {
    cell.font = {
      name: "Arial",
      bold: true,
      size: 9,
      color: { argb: "FF000000" },
    };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFFFFFFF" },
    };
    cell.alignment = {
      horizontal: "center",
      vertical: "middle",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF000000" } },
      left: { style: "thin", color: { argb: "FF000000" } },
      bottom: { style: "thin", color: { argb: "FF000000" } },
      right: { style: "thin", color: { argb: "FF000000" } },
    };
  });

  COLUMNS.forEach((col, i) => {
    ws.getColumn(i + 1).width = col.width;
  });

  // Data rows — white
  const rows = parseRows(apiData);

  rows.forEach((rowData) => {
    const row = ws.addRow(COLUMNS.map((c) => rowData[c.key] ?? ""));

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.font = { name: "Arial", size: 9 };
      cell.alignment = { vertical: "middle", wrapText: true };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" },
      };
      cell.border = {
        top: { style: "thin", color: { argb: "FF000000" } },
        left: { style: "thin", color: { argb: "FF000000" } },
        bottom: { style: "thin", color: { argb: "FF000000" } },
        right: { style: "thin", color: { argb: "FF000000" } },
      };

      if (colNumber === 1 && rowData.date_monitor instanceof Date) {
        cell.numFmt = "mm/dd/yyyy";
      }
    });

    row.height = 16;
  });

  ws.views = [{ state: "frozen", ySplit: 2 }];

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  const from = dayjs(startDate).format("MMDDYYYY");
  const to = dayjs(endDate).format("MMDDYYYY");
  saveAs(blob, `birds_monitoring_${from}_${to}.xlsx`);
};
