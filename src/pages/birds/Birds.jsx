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
import { useGetBirdsQuery } from "../../features/api/birds/birdsApi";
import {
  getChipBg,
  getChipTextColor,
  useChipColors,
} from "../../components/accountmenu/Chipcolorpickerutils";
import BirdsModal from "./BirdsModal";
import "./Birds.scss";

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
  "previous month incomplete": "chip-rejected",
};

const TOTAL_PERIODS = 4;

const getCompletedPeriodsCount = (periodMap) => {
  let count = 0;
  Object.values(periodMap).forEach((entries) => {
    if (!Array.isArray(entries) || entries.length === 0) return;
    const latest = entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
    const status = latest?.status?.toLowerCase() ?? "";
    if (status === "completed" || status === "done" || status === "approved")
      count += 1;
  });
  return count;
};

const hasAnyInProgressPeriod = (periodMap) => {
  return Object.values(periodMap).some((entries) => {
    if (!Array.isArray(entries) || entries.length === 0) return false;
    const latest = entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
    const status = latest?.status?.toLowerCase() ?? "";
    return (
      status === "for acknowledgement" ||
      status === "for approval" ||
      status === "on progress"
    );
  });
};

const getDerivedBirdsTableStatus = (periodMap) => {
  const completedPeriods = getCompletedPeriodsCount(periodMap);
  if (completedPeriods === 0 && !hasAnyInProgressPeriod(periodMap))
    return "Pending";
  if (completedPeriods === TOTAL_PERIODS && !hasAnyInProgressPeriod(periodMap))
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

const checklistExistedLastMonth = (checklistData, currentMonth) => {
  const createdAt = checklistData?.created_at;
  if (!createdAt) return false;
  const createdMonth = dayjs(createdAt).startOf("month");
  const previousMonth = currentMonth.subtract(1, "month").startOf("month");
  return !createdMonth.isAfter(previousMonth);
};

const getPreviousMonthCompleted = (checklistData) => {
  if (checklistData?.previous_month_completed === undefined) return true;
  return Boolean(checklistData.previous_month_completed);
};

const flattenBirdsData = (rawData, currentMonth) => {
  if (!rawData) return [];
  const rows = [];
  Object.entries(rawData).forEach(([checklistKey, checklistData]) => {
    const periodMap = checklistData?.periods ?? {};
    const completedPeriods = getCompletedPeriodsCount(periodMap);
    const allBatches = Object.values(periodMap).flat();
    const latestBatch =
      allBatches.length > 0
        ? allBatches.reduce((a, b) => (b.batch_no > a.batch_no ? b : a))
        : null;

    const notYetCreated = isChecklistNotYetCreated(checklistData, currentMonth);
    const existedLastMonth = checklistExistedLastMonth(
      checklistData,
      currentMonth,
    );
    const previousMonthCompleted = getPreviousMonthCompleted(checklistData);

    let derivedStatus = getDerivedBirdsTableStatus(periodMap);
    let isLocked = false;

    if (notYetCreated) {
      derivedStatus = "Checklist Not Yet Created";
      isLocked = true;
    } else if (existedLastMonth && !previousMonthCompleted) {
      derivedStatus = "Previous Month Incomplete";
      isLocked = true;
    }

    rows.push({
      checklist_name: checklistData?.checklist_name ?? "—",
      week: `${completedPeriods}/${TOTAL_PERIODS}`,
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
  if (!value || value === "—") return <span className="birds__dash">—</span>;
  const chipId = STATUS_CHIP_MAP[value.toLowerCase()] ?? null;
  if (!chipId) return <span className="birds__dash">{value}</span>;
  return (
    <span
      className="birds__chip"
      style={{
        background: getChipBg(chipId),
        color: getChipTextColor(chipId),
      }}>
      {value}
    </span>
  );
};

const BirdsPage = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [selectedUnitKey, setSelectedUnitKey] = useState(null);
  const [queryParams] = useRememberQueryParams();
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);

  const { data, isFetching, error, refetch } = useGetBirdsQuery(
    {
      month: currentMonth.format("MM"),
      year: currentMonth.format("YYYY"),
      search: debouncedSearch,
      section: "birds",
    },
    { refetchOnMountOrArgChange: true },
  );

  const is404 = error?.status === 404;
  const tableData = flattenBirdsData(data, currentMonth);
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
          <div className="birds__actions">
            <div className="birds__filters">
              <div className="birds__filters-left" />
              <div className="birds__month-nav">
                <IconButton
                  className="birds__month-arrow"
                  size="small"
                  onClick={handlePrevMonth}>
                  <ChevronLeftIcon />
                </IconButton>
                <span className="birds__month-label">
                  BIRDS Dashboard: {currentMonth.format("MMMM YYYY")}
                </span>
                <IconButton
                  className="birds__month-arrow"
                  size="small"
                  onClick={handleNextMonth}>
                  <ChevronRightIcon />
                </IconButton>
              </div>
              <div className="birds__filters-right" />
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

      <BirdsModal
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

export default BirdsPage;
