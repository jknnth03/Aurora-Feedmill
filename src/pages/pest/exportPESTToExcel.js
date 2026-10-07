import * as XLSX from "xlsx";
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
    const startAt = batch.start_at ? dayjs(batch.start_at) : null;
    const row = {
      Checklist: checklist.checklist_name ?? "",
      Period: periodName,
      "Batch No": batch.batch_no ?? "",
      Status: batch.status ?? "",
      "Audited By": batch.user ?? "",
      Date: startAt?.isValid() ? startAt.toDate() : "",
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
  const worksheet = XLSX.utils.json_to_sheet(rows, {
    header: headers,
    cellDates: true,
    dateNF: "yyyy-mm-dd",
  });
  worksheet["!cols"] = headers.map((header) => ({
    wch: getColumnWidth(rows, header),
  }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Pest Monitoring");
  XLSX.writeFile(workbook, `Pest_Monitoring_${startDate}_to_${endDate}.xlsx`);

  return rows.length;
};
