import { useState } from "react";
import SettingsIcon from "@mui/icons-material/Settings";
import AddIcon from "@mui/icons-material/Add";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  TableSearchField,
  ArchivedButton,
} from "../../../reusable-components/table-search/TableSearch";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import {
  useGetAcknowledgementSettingsQuery,
  useChangeAcknowledgementSettingStatusMutation,
} from "../../../features/api/masterlist/acknowledgementSettingsApi";
import AcknowledgementSettingsModal from "./AcknowledgementSettingsModal";
import "./AcknowledgementSettings.scss";

const COLUMNS = [
  { key: "id", label: "ID", sortable: true },
  { key: "name", label: "Name", sortable: true },
  { key: "evaluator", label: "Evaluator", sortable: false },
  {
    key: "first_to_acknowledge",
    label: "First to Acknowledge",
    sortable: false,
  },
  { key: "last_to_acknowledge", label: "Last to Acknowledge", sortable: false },
];

const AcknowledgementSettings = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [queryParams, setQueryParams, , resetAfterArchive, resetAfterRestore] =
    useRememberQueryParams();
  const showArchived = queryParams.status === "inactive";
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toArchive, setToArchive] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [toRestore, setToRestore] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const currentStatus = showArchived ? "inactive" : "active";

  const { data, isFetching, error } = useGetAcknowledgementSettingsQuery(
    {
      status: currentStatus,
      search: debouncedSearch,
      page,
      per_page: rowsPerPage,
    },
    { refetchOnMountOrArgChange: true },
  );

  const [changeStatus, { isLoading: isChangingStatus }] =
    useChangeAcknowledgementSettingStatusMutation();

  const is404 = error?.status === 404;
  const tableData = data?.data ?? [];
  const total = data?.total ?? 0;

  const handleSort = (key, order) => {
    setSortBy(key);
    setSortOrder(order);
    setPage(1);
  };

  const handleRowsPerPage = (val) => {
    setRowsPerPage(val);
    setPage(1);
  };

  const handleSearch = (val) => {
    setQueryParams({ search: val || null }, { retain: true });
    setPage(1);
  };

  const handleRowClick = (row) => {
    setSelectedSetting(row);
    setModalOpen(true);
  };

  const handleAddNew = () => {
    setSelectedSetting(null);
    setModalOpen(true);
  };

  const handleSuccess = (message) => {
    setSnackbar({ open: true, message, severity: "success" });
    setModalOpen(false);
    setSelectedSetting(null);
  };

  const handleArchiveClick = (row) => {
    setToArchive(row);
    setConfirmOpen(true);
  };

  const handleConfirmArchive = async () => {
    try {
      await changeStatus(toArchive.id).unwrap();
      setConfirmOpen(false);
      setToArchive(null);
      resetAfterArchive();
      setSnackbar({
        open: true,
        message: `"${toArchive.name}" archived successfully.`,
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to archive. Please try again.",
        severity: "error",
      });
    }
  };

  const handleRestoreClick = (row) => {
    setToRestore(row);
    setRestoreConfirmOpen(true);
  };

  const handleConfirmRestore = async () => {
    try {
      await changeStatus(toRestore.id).unwrap();
      setRestoreConfirmOpen(false);
      setToRestore(null);
      resetAfterRestore();
      setSnackbar({
        open: true,
        message: `"${toRestore.name}" restored successfully.`,
        severity: "success",
      });
    } catch {
      setSnackbar({
        open: true,
        message: "Failed to restore. Please try again.",
        severity: "error",
      });
    }
  };

  const enrichedData = tableData.map((row) => {
    const hierarchy = Array.isArray(row.hierarchy) ? row.hierarchy : [];
    const isPests = row.sections?.name?.toUpperCase() === "PESTS";

    if (isPests) {
      return {
        ...row,
        evaluator: "—",
        first_to_acknowledge: row.user?.name ?? "—",
        last_to_acknowledge: "—",
      };
    }

    const first = hierarchy[0];
    const last = hierarchy[hierarchy.length - 1];
    const isSame = hierarchy.length <= 1;

    return {
      ...row,
      evaluator: row.user?.name ?? "—",
      first_to_acknowledge: first?.name ?? "—",
      last_to_acknowledge: isSame ? "—" : (last?.name ?? "—"),
    };
  });

  return (
    <>
      <PageContainer
        title="Acknowledgement Settings"
        titleIcon={<SettingsIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add Setting"
            tooltip="Click this button to add a new acknowledgement setting"
            icon={<AddIcon />}
            onClick={handleAddNew}
          />
        }
        actions={
          <>
            <ArchivedButton
              active={showArchived}
              onClick={() => {
                setQueryParams(
                  { status: showArchived ? "active" : "inactive" },
                  { retain: true },
                );
                setPage(1);
              }}
            />
            <TableSearchField
              value={search}
              onChange={handleSearch}
              placeholder="Search settings..."
            />
          </>
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
          columns={COLUMNS}
          data={enrichedData}
          isLoading={isFetching}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onRowClick={handleRowClick}
          actions={(row) => (
            <RowMenu
              isArchived={showArchived}
              onArchive={() => handleArchiveClick(row)}
              onRestore={() => handleRestoreClick(row)}
            />
          )}
        />
      </PageContainer>

      <AcknowledgementSettingsModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedSetting(null);
        }}
        setting={selectedSetting}
        onSuccess={handleSuccess}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={isChangingStatus}
        title="Archive Setting"
        message={`Are you sure you want to archive "${toArchive?.name}"? This action will set the setting as inactive.`}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        isLoading={isChangingStatus}
        title="Restore Setting"
        message={`Are you sure you want to restore "${toRestore?.name}"? This will set it back to active.`}
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

export default AcknowledgementSettings;
