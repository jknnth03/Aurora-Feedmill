import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import dayjs from "dayjs";

const FIXED_HEADERS = [
  "Checklist",
  "Period",
  "Batch No",
  "Status",
  "Audited By",
  "Date",
  "Inspection Area",
];

const addUnique = (list, value) => {
  if (value && !list.includes(value)) list.push(value);
};

const getColumnWidth = (rows, key) => {
  const longest = rows.reduce((max, row) => {
    const value = row[key];
    const length = value instanceof Date ? 10 : String(value ?? "").length;
    return Math.max(max, length);
  }, key.length);
  return Math.min(40, longest + 2);
};

const toExcelDate = (value) => {
  const parsed = value ? dayjs(value) : null;
  if (!parsed?.isValid()) return "";
  return new Date(Date.UTC(parsed.year(), parsed.month(), parsed.date()));
};

export const exportPestToExcel = async (data, startDate, endDate) => {
  const pestNames = [];
  const observationKeys = [];
  const records = [];

  Object.values(data ?? {}).forEach((checklist) => {
    if (!checklist?.id) return;
    Object.entries(checklist.periods ?? {}).forEach(([periodName, batches]) => {
      (batches ?? []).forEach((batch) => {
        (batch.responses ?? []).forEach((item) => {
          const response = item?.response;
          if (!response) return;
          (response.pests ?? []).forEach((pest) =>
            addUnique(pestNames, pest.name),
          );
          Object.keys(response.other_observations ?? {}).forEach((key) =>
            addUnique(observationKeys, key),
          );
          records.push({ checklist, periodName, batch, response });
        });
      });
    });
  });

  if (records.length === 0) return 0;

  const rows = records.map(({ checklist, periodName, batch, response }) => {
    const row = {
      Checklist: checklist.checklist_name ?? "",
      Period: periodName,
      "Batch No": batch.batch_no ?? "",
      Status: batch.status ?? "",
      "Audited By": batch.user ?? "",
      Date: toExcelDate(batch.start_at),
      "Inspection Area": response.inspection_area ?? "",
    };
    pestNames.forEach((name) => {
      const found = (response.pests ?? []).find((pest) => pest.name === name);
      row[name] = found ? found.score : "";
    });
    observationKeys.forEach((key) => {
      row[key] = response.other_observations?.[key] ?? "";
    });
    return row;
  });

  const headers = [...FIXED_HEADERS, ...pestNames, ...observationKeys];

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Pest Monitoring");
  sheet.columns = headers.map((header) => ({
    header,
    key: header,
    width: getColumnWidth(rows, header),
  }));
  rows.forEach((row) => sheet.addRow(row));

  sheet.getColumn("Date").numFmt = "yyyy-mm-dd";
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(
    new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    `Pest_Monitoring_${startDate}_to_${endDate}.xlsx`,
  );

  return rows.length;
};
