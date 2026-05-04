import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import SanitizerIcon from "@mui/icons-material/Sanitizer";
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
  useGetCobsQuery,
  useArchiveCobsMutation,
} from "../../../features/api/checklist-form/cobsApi";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import COBSModal from "./COBSQuestionnairesModal";
import COBSPreviewDialog from "./COBSQuestionnairesPreviewDialog";
import "./COBSQuestionnaires.scss";

const COLUMNS = [
  { key: "checklist_id", label: "Checklist ID", sortable: true },
  { key: "name", label: "Area / Section", sortable: true },
  {
    key: "item",
    label: "Checklist",
    sortable: false,
    render: (items, row, onViewItems) => (
      <button
        className="cobs__eye-btn"
        onClick={(e) => {
          e.stopPropagation();
          onViewItems?.(row);
        }}
        title="View checklist items">
        <RemoveRedEyeIcon sx={{ fontSize: "1rem" }} />
      </button>
    ),
  },
];

const flattenCobsData = (rawData = []) => {
  const rows = [];
  rawData.forEach((entry) => {
    const { checklist_id, forms } = entry;
    if (Array.isArray(forms)) {
      forms.forEach((form) => {
        rows.push({
          checklist_id,
          name: form.name,
          item: form.item ?? [],
        });
      });
    }
  });
  return rows;
};

const COBSQuestionnaires = () => {
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

  // Preview dialog state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewRow, setPreviewRow] = useState(null);

  const currentStatus = showArchived ? "inactive" : "active";

  const { data, isFetching, error } = useGetCobsQuery({
    status: currentStatus,
    search: debouncedSearch,
    page,
    per_page: rowsPerPage,
  });
  const [archiveCobs, { isLoading: isArchiving }] = useArchiveCobsMutation();

  const is404 = error?.status === 404;
  const rawData = data?.data?.data ?? [];
  const tableData = flattenCobsData(rawData);
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
      await archiveCobs(toRestore.checklist_id).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "COBS questionnaire restored successfully.",
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
    setSelectedId(row.checklist_id);
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
      await archiveCobs(toArchive.checklist_id).unwrap();
      window.__snackbar__?.enqueueSnackbar(
        "COBS questionnaire archived successfully.",
        { variant: "success" },
      );
      setConfirmOpen(false);
      setToArchive(null);
      resetAfterArchive();
    } catch (err) {
      console.error("Archive failed:", err);
    }
  };

  // Columns with eye btn handler injected
  const columnsWithHandler = COLUMNS.map((col) =>
    col.key === "item"
      ? {
          ...col,
          render: (items, row) =>
            COLUMNS.find((c) => c.key === "item").render(items, row, (r) => {
              setPreviewRow(r);
              setPreviewOpen(true);
            }),
        }
      : col,
  );

  return (
    <>
      <PageContainer
        title="COBS Questionnaires"
        titleIcon={<SanitizerIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add COBS Questionnaire"
            tooltip="Click this button to add a new COBS questionnaire"
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
              placeholder="Search COBS questionnaires..."
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

      <COBSModal
        open={modalOpen}
        onClose={handleClose}
        selectedId={selectedId}
      />

      <COBSPreviewDialog
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false);
          setPreviewRow(null);
        }}
        checklist_id={previewRow?.checklist_id}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        title="Archive COBS Questionnaire"
        message={`Are you sure you want to archive "${toArchive?.name}"? This action will set the questionnaire as inactive.`}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        isLoading={isArchiving}
        title="Restore COBS Questionnaire"
        message={`Are you sure you want to restore "${toRestore?.name}"? This will set it back to active.`}
      />
    </>
  );
};

export default COBSQuestionnaires;
