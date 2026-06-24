import { useState } from "react";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useGetPestsApprovalsQuery } from "../../../features/api/approval/pestsApproval";
import PestsApprovalModal from "./PestsApprovalModal";
import "./PestsApproval.scss";

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
  { key: "checklist_name", label: "Checklist", sortable: true },
  { key: "month_display", label: "Month", sortable: false },
  { key: "period_display", label: "Period", sortable: false },
  { key: "user", label: "Submitted By", sortable: true },
];

const flattenApprovalsData = (rawData = {}) => {
  const rows = [];
  Object.values(rawData).forEach((checklistData) => {
    const periods = checklistData.periods ?? {};
    Object.entries(periods).forEach(([periodKey, periodEntries]) => {
      if (!Array.isArray(periodEntries)) return;
      periodEntries.forEach((entry) => {
        const startDate = entry.start_at ? new Date(entry.start_at) : null;
        const monthIndex = startDate ? startDate.getMonth() : null;
        rows.push({
          ...entry,
          month_display: monthIndex !== null ? MONTHS[monthIndex] : "—",
          period_display: periodKey,
        });
      });
    });
  });
  return rows;
};

const PestsApproval = () => {
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

  const { data, isFetching, error } = useGetPestsApprovalsQuery(
    { status: "pending" },
    { refetchOnMountOrArgChange: true },
  );

  const is404 = error?.status === 404;
  const rawData = data ?? {};
  const tableData = flattenApprovalsData(rawData);

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

  const handleApprove = (row) => {
    setSnackbar({
      open: true,
      message: `Batch #${row.batch_no} acknowledged successfully.`,
      severity: "success",
    });
    setModalOpen(false);
    setSelectedBatch(null);
  };

  return (
    <>
      <PageContainer
        title="Pest Acknowledgements"
        titleIcon={<GppMaybeIcon />}
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

      <PestsApprovalModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedBatch(null);
        }}
        batchEntry={selectedBatch}
        onApprove={handleApprove}
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

export default PestsApproval;
