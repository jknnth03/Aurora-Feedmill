import { useState } from "react";
import dayjs from "dayjs";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import IconButton from "@mui/material/IconButton";
import { useRememberQueryParams } from "../../hooks/useRememberQueryParams";
import useDebounce from "../../hooks/useDebounce";
import PageContainer from "../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../reusable-components/table-pagination/TablePagination";
import { useGetCobsQuery } from "../../features/api/cobs/cobsApi";
import {
  getChipBg,
  getChipTextColor,
  getChipName,
  useChipColors,
} from "../../components/accountmenu/Chipcolorpickerutils";
import COBSModal from "./COBSModal";
import "./COBS.scss";

const COLUMNS = [
  { key: "unit", label: "Unit", sortable: false },
  { key: "checklist_name", label: "Checklist Name", sortable: false },
  { key: "week", label: "Week", sortable: false },
  { key: "status", label: "Status", sortable: false },
];

const STATUS_CHIP_MAP = {
  completed: "chip-completed",
  done: "chip-completed",
  approved: "chip-completed",
  "for acknowledgement": "chip-for-approval",
  "for approval": "chip-for-approval",
  "on going": "chip-processing",
  pending: "chip-pending",
  rejected: "chip-rejected",
};

const getCompletedWeeksCount = (weekMap) => {
  let count = 0;
  Object.values(weekMap).forEach((entries) => {
    if (!Array.isArray(entries) || entries.length === 0) return;
    const latest = entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
    const status = latest?.status?.toLowerCase() ?? "";
    if (status === "completed" || status === "done" || status === "approved") {
      count += 1;
    }
  });
  return count;
};

const hasAnyInProgressWeek = (weekMap) => {
  return Object.values(weekMap).some((entries) => {
    if (!Array.isArray(entries) || entries.length === 0) return false;
    const latest = entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
    const status = latest?.status?.toLowerCase() ?? "";
    return status === "for acknowledgement" || status === "for approval";
  });
};

const getDerivedTableStatus = (weekMap) => {
  const totalWeeks = Object.keys(weekMap).length;
  const completedWeeks = getCompletedWeeksCount(weekMap);
  if (completedWeeks === 0 && !hasAnyInProgressWeek(weekMap)) return "Pending";
  if (completedWeeks === totalWeeks && !hasAnyInProgressWeek(weekMap))
    return "Completed";
  return "On Going";
};

const flattenCobsData = (rawData) => {
  if (!rawData) return [];

  const rows = [];

  Object.entries(rawData).forEach(([unitKey, unitData]) => {
    const unitName = unitKey.replace(/^Unit:\s*/i, "").trim();
    const weekMap = unitData?.weeks ?? {};
    const checklists = unitData?.checklists ?? [];
    const totalWeeks = Object.keys(weekMap).length;

    const completedWeeks = getCompletedWeeksCount(weekMap);
    const derivedStatus = getDerivedTableStatus(weekMap);

    const allBatches = Object.values(weekMap).flat();
    const latestBatch =
      allBatches.length > 0
        ? allBatches.reduce((a, b) => (b.batch_no > a.batch_no ? b : a))
        : null;

    const checklistName = checklists[0]?.checklist_name ?? "—";

    rows.push({
      unit: unitName,
      checklist_name: checklistName,
      week: `${completedWeeks}/${totalWeeks}`,
      status: derivedStatus,
      _raw: latestBatch,
      _unitKey: unitKey,
      _unitData: unitData,
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
      {getChipName(chipId)}
    </span>
  );
};

const COBS = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedUnitKey, setSelectedUnitKey] = useState(null);
  const [queryParams] = useRememberQueryParams();
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);

  const { data, isFetching, error, refetch } = useGetCobsQuery(
    {
      month: currentMonth.format("MM"),
      year: currentMonth.format("YYYY"),
      search: debouncedSearch,
    },
    {
      refetchOnMountOrArgChange: true,
    },
  );

  const is404 = error?.status === 404;
  const tableData = flattenCobsData(data);
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
          <div className="cobs__actions">
            <div className="cobs__filters">
              <div className="cobs__filters-left" />
              <div className="cobs__month-nav">
                <IconButton
                  className="cobs__month-arrow"
                  size="small"
                  onClick={handlePrevMonth}>
                  <ChevronLeftIcon />
                </IconButton>
                <span className="cobs__month-label">
                  COBS Dashboard: {currentMonth.format("MMMM YYYY")}
                </span>
                <IconButton
                  className="cobs__month-arrow"
                  size="small"
                  onClick={handleNextMonth}>
                  <ChevronRightIcon />
                </IconButton>
              </div>
              <div className="cobs__filters-right" />
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
          onRowClick={(row) => setSelectedUnitKey(row._unitKey)}
        />
      </PageContainer>

      <COBSModal
        open={Boolean(selectedRow)}
        unitName={selectedRow?.unit}
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

export default COBS;
