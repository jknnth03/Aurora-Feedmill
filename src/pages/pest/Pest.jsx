import { useState } from "react";
import dayjs from "dayjs";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import IconButton from "@mui/material/IconButton";
import { useRememberQueryParams } from "../../hooks/useRememberQueryParams";
import useDebounce from "../../hooks/useDebounce";
import PageContainer from "../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../reusable-components/table-pagination/TablePagination";
import { useGetPestResponsesQuery } from "../../features/api/pests/pestApi";
import {
  getChipBg,
  getChipTextColor,
  useChipColors,
} from "../../components/accountmenu/Chipcolorpickerutils";
import PestModal from "./PestModal";
import { exportPestToExcel } from "./exportPestToExcel";
import "./Pest.scss";

const COLUMNS = [
  { key: "checklist_name", label: "Checklist Name", sortable: false },
  { key: "week", label: "Completed", sortable: false },
  { key: "status", label: "Status", sortable: false },
];

const STATUS_CHIP_MAP = {
  completed: "chip-completed",
  done: "chip-completed",
  approved: "chip-completed",
  "for acknowledgement": "chip-for-approval",
  "for approval": "chip-for-approval",
  "on going": "chip-processing",
  "on progress": "chip-processing",
  pending: "chip-pending",
  rejected: "chip-rejected",
  "checklist not yet created": "chip-pending",
};

const getLatestEntry = (entries) =>
  entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));

const isPeriodDone = (batch) => {
  const status = batch?.status?.toLowerCase() ?? "";
  return (
    Number(batch?.is_completed) === 1 ||
    status === "completed" ||
    status === "done" ||
    status === "approved"
  );
};

const getCompletedPeriodsCount = (periodMap) => {
  let count = 0;
  Object.values(periodMap).forEach((entries) => {
    if (!Array.isArray(entries) || entries.length === 0) return;
    if (isPeriodDone(getLatestEntry(entries))) count += 1;
  });
  return count;
};

const hasAnyInProgressPeriod = (periodMap) => {
  return Object.values(periodMap).some((entries) => {
    if (!Array.isArray(entries) || entries.length === 0) return false;
    const latest = getLatestEntry(entries);
    const status = latest?.status?.toLowerCase() ?? "";
    return (
      status === "for acknowledgement" ||
      status === "for approval" ||
      status === "on progress"
    );
  });
};

const getDerivedPestTableStatus = (periodMap) => {
  const completedPeriods = getCompletedPeriodsCount(periodMap);
  if (completedPeriods === 0 && !hasAnyInProgressPeriod(periodMap))
    return "Pending";
  if (completedPeriods === 2 && !hasAnyInProgressPeriod(periodMap))
    return "Completed";
  return "On Going";
};

const isChecklistNotYetCreated = (checklistData, currentMonth) => {
  const createdAt = checklistData?.created_at;
  if (!createdAt) return false;
  const createdMonth = dayjs(createdAt);
  if (!createdMonth.isValid()) return false;
  return createdMonth.startOf("month").isAfter(currentMonth.startOf("month"));
};

const flattenPestData = (rawData, currentMonth) => {
  if (!rawData) return [];
  const rows = [];
  Object.entries(rawData).forEach(([checklistKey, checklistData]) => {
    if (!checklistData?.id) return;

    const periodMap = checklistData?.periods ?? {};
    const completedPeriods = getCompletedPeriodsCount(periodMap);
    const allBatches = Object.values(periodMap).flat();
    const latestBatch =
      allBatches.length > 0
        ? allBatches.reduce((a, b) => (b.batch_no > a.batch_no ? b : a))
        : null;

    const notYetCreated = isChecklistNotYetCreated(checklistData, currentMonth);

    let derivedStatus = getDerivedPestTableStatus(periodMap);
    let isLocked = false;

    if (notYetCreated) {
      derivedStatus = "Checklist Not Yet Created";
      isLocked = true;
    }

    rows.push({
      checklist_name: checklistData?.checklist_name ?? "—",
      week: `${completedPeriods}/2`,
      status: derivedStatus,
      _raw: latestBatch,
      _unitKey: checklistKey,
      _unitData: checklistData,
      _isLocked: isLocked,
    });
  });
  return rows;
};

const StatusChip = ({ value }) => {
  useChipColors();
  if (!value || value === "—") return <span className="cobs__dash">—</span>;
  const chipId = STATUS_CHIP_MAP[value.toLowerCase()] ?? null;
  if (!chipId) return <span className="cobs__dash">{value}</span>;
  return (
    <span
      className="cobs__chip"
      style={{
        background: getChipBg(chipId),
        color: getChipTextColor(chipId),
      }}>
      {value}
    </span>
  );
};

const PestPage = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedUnitKey, setSelectedUnitKey] = useState(null);
  const [isExporting, setIsExporting] = useState(false);
  const [queryParams] = useRememberQueryParams();
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);

  const { data, isFetching, error, refetch } = useGetPestResponsesQuery(
    {
      month: currentMonth.format("MM"),
      year: currentMonth.format("YYYY"),
      search: debouncedSearch,
      section: "pests",
    },
    { refetchOnMountOrArgChange: true },
  );

  const is404 = error?.status === 404;
  const tableData = flattenPestData(data, currentMonth);
  const total = tableData.length;
  const paginatedData = tableData.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage,
  );
  const selectedRow = selectedUnitKey
    ? (tableData.find((r) => r._unitKey === selectedUnitKey) ?? null)
    : null;

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };
  const handleRowsPerPage = (val) => {
    setRowsPerPage(val);
    setPage(1);
  };
  const handlePrevMonth = () => setCurrentMonth((m) => m.subtract(1, "month"));
  const handleNextMonth = () => setCurrentMonth((m) => m.add(1, "month"));

  const handleRowClick = (row) => {
    if (row._isLocked) return;
    setSelectedUnitKey(row._unitKey);
  };

  const handleExport = async () => {
    if (isExporting || !data) return;
    setIsExporting(true);
    try {
      const exported = await exportPestToExcel(
        data,
        currentMonth.startOf("month").format("YYYY-MM-DD"),
        currentMonth.endOf("month").format("YYYY-MM-DD"),
      );
      if (!exported) {
        window.__snackbar__?.enqueueSnackbar(
          "No inspection records to export for this month.",
          { variant: "warning" },
        );
      }
    } catch (err) {
      console.error("[Pest] export ERROR", err);
      window.__snackbar__?.enqueueSnackbar("Export failed. Please try again.", {
        variant: "error",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const columnsWithRender = COLUMNS.map((col) =>
    col.key === "status"
      ? { ...col, render: (val) => <StatusChip value={val} /> }
      : col,
  );

  return (
    <>
      <PageContainer
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        actions={
          <div className="pest__actions">
            <div className="pest__filters">
              <div className="pest__filters-left" />
              <div className="pest__month-nav">
                <IconButton
                  className="pest__month-arrow"
                  size="small"
                  onClick={handlePrevMonth}>
                  <ChevronLeftIcon />
                </IconButton>
                <span className="pest__month-label">
                  PEST Dashboard: {currentMonth.format("MMMM YYYY")}
                </span>
                <IconButton
                  className="pest__month-arrow"
                  size="small"
                  onClick={handleNextMonth}>
                  <ChevronRightIcon />
                </IconButton>
              </div>
              <div className="pest__filters-right">
                <button
                  className="pest__export-btn"
                  onClick={handleExport}
                  disabled={isExporting || !data}>
                  <FileDownloadIcon className="pest__export-btn-icon" />
                  {isExporting ? "Exporting..." : "Export"}
                </button>
              </div>
            </div>
          </div>
        }
        pagination={
          <TablePagination
            total={total}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={handleRowsPerPage}
          />
        }>
        <UniversalTable
          columns={columnsWithRender}
          data={paginatedData}
          isLoading={isFetching}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={handleRowClick}
        />
      </PageContainer>

      <PestModal
        open={Boolean(selectedRow)}
        unitName={selectedRow?.checklist_name}
        unitData={selectedRow?._unitData}
        month={Number(currentMonth.format("MM"))}
        year={Number(currentMonth.format("YYYY"))}
        onClose={() => setSelectedUnitKey(null)}
        isFetching={isFetching}
        onRefetch={refetch}
      />
    </>
  );
};

export default PestPage;
