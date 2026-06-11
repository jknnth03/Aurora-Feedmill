import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import BugReportIcon from "@mui/icons-material/BugReport";
import AddIcon from "@mui/icons-material/Add";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  TableSearchField,
  ArchivedButton,
} from "../../../reusable-components/table-search/TableSearch";
import {
  useGetChecklistsQuery,
  useArchiveChecklistMutation,
} from "../../../features/api/questionnaires/pestQuestionnairesApi";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import PestSheetModal from "./PestSheetModal";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import "./PestSheet.scss";

const renderStackedList = (items) => {
  if (!items || items.length === 0) return "—";
  const visible = items.slice(0, 5);
  const remaining = items.slice(5);
  return (
    <div className="pest-sheet__stack">
      {visible.map((item, idx) => (
        <span key={idx} className="pest-sheet__stack-item">
          {item.name}
        </span>
      ))}
      {remaining.length > 0 && (
        <span
          className="pest-sheet__stack-more"
          title={remaining.map((i) => i.name).join(", ")}>
          +{remaining.length} more
        </span>
      )}
    </div>
  );
};

const ChecklistItemsDialog = ({ open, onClose, row }) => {
  if (!row) return null;

  const inspectionAreasGroup = row.items?.find(
    (i) => i.name === "Inspection Areas",
  );
  const pestGroup = row.items?.find((i) => i.name === "Pest");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "pest-sheet__dialog-paper" }}>
      <div className="pest-sheet__dialog-header">
        <div className="pest-sheet__dialog-title">
          <RemoveRedEyeIcon className="pest-sheet__dialog-icon" />
          <span>{row.checklist_name}</span>
        </div>
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>
      <DialogContent className="pest-sheet__dialog-content">
        <div className="pest-sheet__dialog-group">
          <p className="pest-sheet__dialog-group-label">Inspection Areas</p>
          {inspectionAreasGroup?.items?.length > 0 ? (
            renderStackedList(inspectionAreasGroup.items)
          ) : (
            <p className="pest-sheet__dialog-empty">No inspection areas.</p>
          )}
        </div>
        <div className="pest-sheet__dialog-group">
          <p className="pest-sheet__dialog-group-label">Pests</p>
          {pestGroup?.items?.length > 0 ? (
            renderStackedList(pestGroup.items)
          ) : (
            <p className="pest-sheet__dialog-empty">No pests.</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

const COLUMNS = [
  { key: "id", label: "ID", sortable: true },
  {
    key: "checklist_name",
    label: "Checklist Name",
    sortable: true,
  },
  {
    key: "items",
    label: "Inspection Areas & Pests Type",
    sortable: false,
  },
];

const PestSheet = () => {
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
  const [selectedId, setSelectedId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toArchive, setToArchive] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [toRestore, setToRestore] = useState(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [viewDialogRow, setViewDialogRow] = useState(null);

  const currentStatus = showArchived ? 0 : 1;

  const { data, isFetching, error } = useGetChecklistsQuery(
    {
      status: currentStatus,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    },
  );

  const [archiveChecklist, { isLoading: isArchiving }] =
    useArchiveChecklistMutation();

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

  const handleViewClick = (row) => {
    setViewDialogRow(row);
    setViewDialogOpen(true);
  };

  const handleRestoreClick = (row) => {
    setToRestore(row);
    setRestoreConfirmOpen(true);
  };
  const handleConfirmRestore = async () => {
    try {
      await archiveChecklist(toRestore.id).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "Pest questionnaire restored successfully.",
        { variant: "success" },
      );
      setRestoreConfirmOpen(false);
      setToRestore(null);
      resetAfterRestore();
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  const handleAdd = () => {
    setSelectedId(null);
    setModalOpen(true);
  };
  const handleRowClick = (row) => {
    setSelectedId(row.id);
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setSelectedId(null);
  };
  const handleArchiveClick = (row) => {
    setToArchive(row);
    setConfirmOpen(true);
  };
  const handleConfirmArchive = async () => {
    try {
      await archiveChecklist(toArchive.id).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "Pest questionnaire archived successfully.",
        { variant: "success" },
      );
      setConfirmOpen(false);
      setToArchive(null);
      resetAfterArchive();
    } catch (err) {
      console.error("Archive failed:", err);
    }
  };

  const columnsWithHandler = COLUMNS.map((col) => {
    if (col.key === "items") {
      return {
        ...col,
        render: (value, row) => (
          <div className="pest-sheet__eye-cell">
            <IconButton
              size="small"
              className="pest-sheet__eye-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleViewClick(row);
              }}>
              <RemoveRedEyeIcon fontSize="small" />
            </IconButton>
          </div>
        ),
      };
    }
    return col;
  });

  return (
    <>
      <PageContainer
        title="Pest Questionnaires"
        titleIcon={<BugReportIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add Pest Questionnaire"
            tooltip="Click this button to add a new pest questionnaire"
            icon={<AddIcon />}
            onClick={handleAdd}
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
              placeholder="Search pest questionnaires..."
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
          columns={columnsWithHandler}
          data={tableData}
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

      <ChecklistItemsDialog
        open={viewDialogOpen}
        onClose={() => {
          setViewDialogOpen(false);
          setViewDialogRow(null);
        }}
        row={viewDialogRow}
      />

      <PestSheetModal
        open={modalOpen}
        onClose={handleClose}
        selectedId={selectedId}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        title="Archive Pest Questionnaire"
        message={`Are you sure you want to archive Pest Questionnaire #${toArchive?.id}? This action will set it as inactive.`}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        isLoading={isArchiving}
        title="Restore Pest Questionnaire"
        message={`Are you sure you want to restore Pest Questionnaire #${toRestore?.id}? This will set it back to active.`}
      />
    </>
  );
};

export default PestSheet;
