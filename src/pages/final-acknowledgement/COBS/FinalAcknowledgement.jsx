import { useState } from "react";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import FinalAcknowledgementModal from "./FinalAcknowledgementModal";
import "./FinalAcknowledgement.scss";
import { useGetAcknowledgementsQuery } from "../../../features/api/final-acknowledgement/cobsAcknowledgementApi";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const COLUMNS = [
  { key: "batch_no", label: "Batch No.", sortable: true },
  { key: "unit", label: "Unit", sortable: true },
  { key: "checklist_name", label: "Checklist", sortable: true },
  { key: "month_display", label: "Month", sortable: false },
  { key: "week_display", label: "Week", sortable: false },
  { key: "user", label: "Submitted By", sortable: true },
];

const flattenAcknowledgementsData = (rawData = {}) => {
  const rows = [];

  Object.entries(rawData).forEach(([unitKey, unitData]) => {
    const weeks = unitData.weeks ?? {};
    const fallbackUnit = unitKey.replace("Unit: ", "");
    const fallbackChecklist = unitData.checklists?.[0]?.checklist_name ?? "—";

    Object.entries(weeks).forEach(([weekKey, weekEntries]) => {
      if (!Array.isArray(weekEntries) || weekEntries.length === 0) return;

      weekEntries.forEach((entry) => {
        const startDate = entry.start_at ? new Date(entry.start_at) : null;
        const monthIndex = startDate ? startDate.getMonth() : null;

        rows.push({
          ...entry,
          unit: entry.unit ?? fallbackUnit,
          checklist_name: entry.checklist_name ?? fallbackChecklist,
          month_display: monthIndex !== null ? MONTHS[monthIndex] : "—",
          week_display: entry.week ? `Week ${entry.week}` : weekKey,
        });
      });
    });
  });

  return rows;
};

const FinalAcknowledgement = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const { data, isFetching, error } = useGetAcknowledgementsQuery(
    { status: "pending" },
    { refetchOnMountOrArgChange: true },
  );

  const is404 = error?.status === 404;
  const rawData = data ?? {};
  const tableData = flattenAcknowledgementsData(rawData);

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleRowsPerPage = (val) => {
    setRowsPerPage(val);
    setPage(1);
  };

  const handleRowClick = (row) => {
    setSelectedBatch(row);
    setModalOpen(true);
  };

  const handleAssess = (row) => {
    setSnackbar({
      open: true,
      message: `Batch #${row.batch_no} assessed successfully.`,
      severity: "success",
    });
    setModalOpen(false);
    setSelectedBatch(null);
  };

  return (
    <>
      <PageContainer
        title="Final Acknowledgements"
        titleIcon={<FactCheckIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        pagination={
          <TablePagination
            total={tableData.length}
            page={page}
            rowsPerPage={rowsPerPage}
            onPageChange={setPage}
            onRowsPerPageChange={handleRowsPerPage}
          />
        }>
        <UniversalTable
          columns={COLUMNS}
          data={tableData.slice((page - 1) * rowsPerPage, page * rowsPerPage)}
          isLoading={isFetching}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={handleRowClick}
        />
      </PageContainer>

      <FinalAcknowledgementModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBatch(null);
        }}
        batchEntry={selectedBatch}
        onAssess={handleAssess}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        <Alert
          severity={snackbar.severity}
          variant="filled"
          sx={{ fontFamily: "Poppins, sans-serif", fontSize: "0.82rem" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default FinalAcknowledgement;
