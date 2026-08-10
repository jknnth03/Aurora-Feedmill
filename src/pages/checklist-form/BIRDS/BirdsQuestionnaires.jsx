import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import FlutterDashIcon from "@mui/icons-material/FlutterDash";
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { IconButton } from "@mui/material";
import Tooltip from "@mui/material/Tooltip";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  TableSearchField,
  ArchivedButton,
} from "../../../reusable-components/table-search/TableSearch";
import {
  useGetBirdsChecklistsQuery,
  useArchiveBirdChecklistMutation,
} from "../../../features/api/questionnaires/birdsQuestionnairesApi";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import BirdsModal from "./BirdsQuestionnairesModal";
import BirdsInspectionAreasModal from "./BirdsInspectionAreasModal";
import BirdsViewChecklistDialog from "./BirdsViewChecklistDialog";
import "./BirdsQuestionnaires.scss";

const getGroupItems = (items, groupName) => {
  const group = items?.find((g) => g.name === groupName);
  if (!group || !group.items || group.items.length === 0) return null;
  return group.items;
};

const renderChips = (items, groupName) => {
  const groupItems = getGroupItems(items, groupName);
  if (!groupItems) return "—";
  return (
    <div className="birds__stack">
      {groupItems.map((i, idx) => (
        <span key={idx} className="birds__stack-item">
          {i.name}
        </span>
      ))}
    </div>
  );
};

const buildColumns = (onViewInspectionAreas, onViewChecklist) => [
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
        <div className="birds__view-cell">
          <IconButton
            size="small"
            className="birds__view-btn"
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
    key: "infestation_level",
    label: "Infestation Level",
    sortable: false,
    render: (_, row) => renderChips(row.items, "Infestation Level"),
  },
  {
    key: "feed_wastage",
    label: "Presence of Feed/RM Wastage",
    sortable: false,
    render: (_, row) => renderChips(row.items, "Presence of Feed/RM Wastage"),
  },
  {
    key: "view_checklist",
    label: "View Checklist",
    sortable: false,
    render: (_, row) => (
      <div className="birds__view-cell birds__view-cell--center">
        <Tooltip title="View Checklist" placement="top">
          <IconButton
            size="small"
            className="birds__view-btn"
            onClick={(e) => {
              e.stopPropagation();
              onViewChecklist(row);
            }}>
            <VisibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </div>
    ),
  },
];

const BirdsQuestionnaires = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [queryParams, setQueryParams, , resetAfterArchive, resetAfterRestore] =
    useRememberQueryParams();
  const showArchived = queryParams.status === "inactive";
  const search = queryParams.search ?? "birds";
  const debouncedSearch = useDebounce(search, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toArchive, setToArchive] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [toRestore, setToRestore] = useState(null);
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectionAreas, setInspectionAreas] = useState([]);
  const [inspectionChecklistName, setInspectionChecklistName] = useState("");
  const [viewChecklistOpen, setViewChecklistOpen] = useState(false);
  const [viewChecklistData, setViewChecklistData] = useState(null);

  const currentStatus = showArchived ? "inactive" : "active";

  const { data, isFetching, error } = useGetBirdsChecklistsQuery(
    {
      status: currentStatus,
      search: debouncedSearch,
      page,
      per_page: rowsPerPage,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    },
  );
  const [archiveBird, { isLoading: isArchiving }] =
    useArchiveBirdChecklistMutation();

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
      await archiveBird(toRestore.id).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "Bird Questionnaire restored successfully.",
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
    setInspectionChecklistName(row.checklist_name);
    setInspectionAreas(groupItems);
    setInspectionModalOpen(true);
  };
  const handleCloseInspectionAreas = () => {
    setInspectionModalOpen(false);
    setInspectionAreas([]);
    setInspectionChecklistName("");
  };
  const handleViewChecklist = (row) => {
    setViewChecklistData(row);
    setViewChecklistOpen(true);
  };
  const handleCloseViewChecklist = () => {
    setViewChecklistOpen(false);
    setViewChecklistData(null);
  };
  const columns = buildColumns(handleViewInspectionAreas, handleViewChecklist);
  const handleConfirmArchive = async () => {
    try {
      await archiveBird(toArchive.id).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "Bird Questionnaire archived successfully.",
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
        title="Bird Questionnaires"
        titleIcon={<FlutterDashIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add Bird Questionnaire"
            tooltip="Click this button to add a new bird questionnaire"
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
              placeholder="Search bird questionnaires..."
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

      <BirdsModal
        open={modalOpen}
        onClose={handleClose}
        selectedId={selectedId}
      />

      <BirdsInspectionAreasModal
        open={inspectionModalOpen}
        onClose={handleCloseInspectionAreas}
        checklistName={inspectionChecklistName}
        areas={inspectionAreas}
      />

      <BirdsViewChecklistDialog
        open={viewChecklistOpen}
        onClose={handleCloseViewChecklist}
        checklistData={viewChecklistData}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        title="Archive Bird Questionnaire"
        message={`Are you sure you want to archive Bird Questionnaire #${toArchive?.id}? This action will set it as inactive.`}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        isLoading={isArchiving}
        title="Restore Bird Questionnaire"
        message={`Are you sure you want to restore Bird Questionnaire #${toRestore?.id}? This will set it back to active.`}
      />
    </>
  );
};

export default BirdsQuestionnaires;
