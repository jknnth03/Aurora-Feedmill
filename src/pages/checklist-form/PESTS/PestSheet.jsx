import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import BugReportIcon from "@mui/icons-material/BugReport";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { IconButton } from "@mui/material";
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
import PestInspectionAreasModal from "./PestInspectionAreasModal";
import "./PestSheet.scss";

const getGroupItems = (items, groupName) => {
  const group = items?.find((g) => g.name === groupName);
  if (!group || !group.items || group.items.length === 0) return null;
  return group.items;
};

const renderBulletList = (items, groupName) => {
  const groupItems = getGroupItems(items, groupName);
  if (!groupItems) return "—";
  return (
    <div className="pest-sheet__stack">
      {groupItems.map((i, idx) => (
        <span key={idx} className="pest-sheet__stack-item">
          {i.name}
        </span>
      ))}
    </div>
  );
};

const buildColumns = (onViewInspectionAreas) => [
  { key: "id", label: "ID", sortable: true },
  { key: "checklist_name", label: "Checklist Name", sortable: true },
  {
    key: "inspection_areas",
    label: "Inspection Areas",
    sortable: false,
    render: (_, row) => {
      const groupItems = getGroupItems(row.items, "Inspection Areas");
      if (!groupItems) return "—";
      return (
        <div className="pest-sheet__eye-cell">
          <IconButton
            size="small"
            className="pest-sheet__eye-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewInspectionAreas(row, groupItems);
            }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </div>
      );
    },
  },
  {
    key: "pest_type",
    label: "Pest Type",
    sortable: false,
    render: (_, row) => renderBulletList(row.items, "Pest"),
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
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectionAreas, setInspectionAreas] = useState([]);

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
  const handleViewInspectionAreas = (row, groupItems) => {
    setInspectionAreas(groupItems);
    setInspectionModalOpen(true);
  };
  const handleCloseInspectionAreas = () => {
    setInspectionModalOpen(false);
    setInspectionAreas([]);
  };
  const columns = buildColumns(handleViewInspectionAreas);
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
          columns={columns}
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

      <PestSheetModal
        open={modalOpen}
        onClose={handleClose}
        selectedId={selectedId}
      />

      <PestInspectionAreasModal
        open={inspectionModalOpen}
        onClose={handleCloseInspectionAreas}
        areas={inspectionAreas}
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
