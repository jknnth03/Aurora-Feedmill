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
import { useGetPestResponsesQuery } from "../../features/api/pests/pestApi";
import {
  getChipBg,
  getChipTextColor,
  getChipName,
  useChipColors,
} from "../../components/accountmenu/Chipcolorpickerutils";
import PestModal from "./PestModal";
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
  pending: "chip-pending",
  rejected: "chip-rejected",
};

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

const getDerivedPestTableStatus = (periodMap) => {
  const completedPeriods = getCompletedPeriodsCount(periodMap);
  if (completedPeriods === 0 && !hasAnyInProgressPeriod(periodMap))
    return "Pending";
  if (completedPeriods === 2 && !hasAnyInProgressPeriod(periodMap))
    return "Completed";
  return "On Going";
};

const flattenPestData = (rawData) => {
  if (!rawData) return [];
  const rows = [];
  Object.entries(rawData).forEach(([checklistKey, checklistData]) => {
    const periodMap = checklistData?.periods ?? {};
    const completedPeriods = getCompletedPeriodsCount(periodMap);
    const derivedStatus = getDerivedPestTableStatus(periodMap);
    const allBatches = Object.values(periodMap).flat();
    const latestBatch =
      allBatches.length > 0
        ? allBatches.reduce((a, b) => (b.batch_no > a.batch_no ? b : a))
        : null;
    rows.push({
      checklist_name: checklistData?.checklist_name ?? "—",
      week: `${completedPeriods}/2`,
      status: derivedStatus,
      _raw: latestBatch,
      _unitKey: checklistKey,
      _unitData: checklistData,
    });
  });
  return rows;
};

const StatusChip = ({ value }) => {
  useChipColors();
  if (!value || value === "—") return <span className="pest__dash">—</span>;
  const chipId = STATUS_CHIP_MAP[value.toLowerCase()] ?? null;
  if (!chipId) return <span className="pest__dash">{value}</span>;
  return (
    <span
      className="pest__chip"
      style={{
        background: getChipBg(chipId),
        color: getChipTextColor(chipId),
      }}>
      {getChipName(chipId)}
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
  const tableData = flattenPestData(data);
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
              <div className="pest__filters-right" />
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
