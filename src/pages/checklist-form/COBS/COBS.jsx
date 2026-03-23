import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import SanitizerIcon from "@mui/icons-material/Sanitizer";
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
  useGetCobsQuery,
  useArchiveCobsMutation,
} from "../../../features/api/checklist-form/cobsApi";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import COBSModal from "./COBSModal";
import "./COBS.scss";

const COLUMNS = [
  { key: "checklist_id", label: "Checklist ID", sortable: true },
  { key: "name", label: "Area / Section", sortable: true },
  {
    key: "item",
    label: "Checklist Items",
    sortable: false,
    render: (items) =>
      Array.isArray(items) ? items.map((i) => i.name).join(", ") : "—",
  },
  {
    key: "type",
    label: "Type",
    sortable: false,
    render: (_, row) =>
      Array.isArray(row.item) && row.item.length > 0 ? row.item[0].type : "—",
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

const groupByChecklistId = (rawData = []) => {
  const map = {};
  rawData.forEach((entry) => {
    map[entry.checklist_id] = entry.forms ?? [];
  });
  return map;
};

const COBS = () => {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortBy, setSortBy] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [queryParams, setQueryParams, , resetAfterArchive, resetAfterRestore] =
    useRememberQueryParams();
  const showArchived = queryParams.status === "0";
  const search = queryParams.search ?? "";
  const debouncedSearch = useDebounce(search, 500);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toArchive, setToArchive] = useState(null);
  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false);
  const [toRestore, setToRestore] = useState(null);

  const { data, isFetching, error } = useGetCobsQuery({
    status: showArchived ? 0 : 1,
    search: debouncedSearch,
    page,
    per_page: rowsPerPage,
  });
  const [archiveCobs, { isLoading: isArchiving }] = useArchiveCobsMutation();

  const is404 = error?.status === 404;
  const rawData = data?.data?.data ?? [];
  const tableData = flattenCobsData(rawData);
  const checklistMap = groupByChecklistId(rawData);
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
      window.__snackbar__?.enqueueSnackbar("COBS form restored successfully.", {
        variant: "success",
      });
      setRestoreConfirmOpen(false);
      setToRestore(null);
      resetAfterRestore();
    } catch (err) {
      console.error("Restore failed:", err);
    }
  };

  const handleAdd = () => {
    setSelectedRow(null);
    setModalOpen(true);
  };
  const handleRowClick = (row) => {
    const allForms = checklistMap[row.checklist_id] ?? [];
    setSelectedRow({ ...row, allForms });
    setModalOpen(true);
  };
  const handleClose = () => {
    setModalOpen(false);
    setSelectedRow(null);
  };
  const handleArchiveClick = (row) => {
    setToArchive(row);
    setConfirmOpen(true);
  };
  const handleConfirmArchive = async () => {
    try {
      await archiveCobs(toArchive.checklist_id).unwrap();
      window.__snackbar__?.enqueueSnackbar("COBS form archived successfully.", {
        variant: "success",
      });
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
        title="COBS Forms"
        titleIcon={<SanitizerIcon />}
        isEmpty={!isFetching && (tableData.length === 0 || is404)}
        titleAction={
          <UniversalButton
            label="Add COBS Form"
            tooltip="Click this button to add a new COBS form"
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
                  { status: showArchived ? "1" : "0" },
                  { retain: true },
                );
                setPage(1);
              }}
            />
            <TableSearchField
              value={search}
              onChange={handleSearch}
              placeholder="Search COBS forms..."
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

      <COBSModal
        open={modalOpen}
        onClose={handleClose}
        selectedRow={selectedRow}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setToArchive(null);
        }}
        onConfirm={handleConfirmArchive}
        isLoading={isArchiving}
        title="Archive COBS Form"
        message={`Are you sure you want to archive "${toArchive?.name}"? This action will set the form as inactive.`}
      />

      <ConfirmDialog
        open={restoreConfirmOpen}
        onClose={() => {
          setRestoreConfirmOpen(false);
          setToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        isLoading={isArchiving}
        title="Restore COBS Form"
        message={`Are you sure you want to restore "${toRestore?.name}"? This will set it back to active.`}
      />
    </>
  );
};

export default COBS;
