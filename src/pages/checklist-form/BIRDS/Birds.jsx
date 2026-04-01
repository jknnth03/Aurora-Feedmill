import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import FlutterDashIcon from "@mui/icons-material/FlutterDash";
import AddIcon from "@mui/icons-material/Add";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  TableSearchField,
  ArchivedButton,
} from "../../../reusable-components/table-search/TableSearch";
import {
  useGetBirdsQuery,
  useArchiveBirdMutation,
} from "../../../features/api/checklist-form/birdsApi";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import BirdsModal from "./BirdsModal";
import "./Birds.scss";

const renderStackedList = (items) => {
  if (!items || items.length === 0) return "—";
  const visible = items.slice(0, 5);
  const remaining = items.slice(5);
  return (
    <div className="birds__stack">
      {visible.map((item, idx) => (
        <span key={idx} className="birds__stack-item">
          {item.name}
        </span>
      ))}
      {remaining.length > 0 && (
        <span
          className="birds__stack-more"
          title={remaining.map((i) => i.name).join(", ")}>
          +{remaining.length} more
        </span>
      )}
    </div>
  );
};

const COLUMNS = [
  { key: "id", label: "ID", sortable: true },
  {
    key: "inspection_areas",
    label: "Inspection Areas",
    sortable: false,
    render: (value) => renderStackedList(value),
  },
  {
    key: "infestation_levels",
    label: "Infestation Levels",
    sortable: false,
    render: (value) => renderStackedList(value),
  },
];

const Birds = () => {
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

  const currentStatus = showArchived ? "inactive" : "active";

  const { data, isFetching, error } = useGetBirdsQuery({
    status: currentStatus,
    search: debouncedSearch,
    page,
    per_page: rowsPerPage,
  });
  const [archiveBird, { isLoading: isArchiving }] = useArchiveBirdMutation();

  const is404 = error?.status === 404;
  const tableData = data?.data?.data ?? [];
  const total = data?.data?.total ?? 0;

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
          columns={COLUMNS}
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

export default Birds;
