import { useState } from "react";
import { useRememberQueryParams } from "../../../hooks/useRememberQueryParams";
import useDebounce from "../../../hooks/useDebounce";
import SanitizerIcon from "@mui/icons-material/Sanitizer";
import AddIcon from "@mui/icons-material/Add";
import PageContainer from "../../../reusable-components/page-container/PageContainer";
import UniversalTable from "../../../reusable-components/universal-table/UniversalTable";
import TablePagination from "../../../reusable-components/table-pagination/TablePagination";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import { ArchivedButton } from "../../../reusable-components/table-search/TableSearch";
import {
  useGetCobsQuestionnairesQuery,
  useArchiveCobsMutation,
} from "../../../features/api/questionnaires/cobsQuestionnairesApi";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import RowMenu from "../../../reusable-components/row-menu/RowMenu";
import COBSModal from "./COBSQuestionnairesModal";
import "./COBSQuestionnaires.scss";

const COLUMNS = [
  { key: "id", label: "Checklist ID", sortable: true },
  { key: "checklist_name", label: "Checklist Name", sortable: true },
  { key: "units_display", label: "Units", sortable: false },
  { key: "section_name", label: "Section", sortable: true },
];

const UnitsBulletList = ({ units = [] }) => {
  if (!units.length) return <span className="cobs__units-empty">—</span>;
  return (
    <ul className="cobs__units-list">
      {units.map((u) => (
        <li key={u.id} className="cobs__units-item">
          {u.name}
        </li>
      ))}
    </ul>
  );
};

const flattenCobsData = (rawData = []) =>
  rawData.map((entry) => ({
    id: entry.id,
    checklist_name: entry.checklist_name ?? "—",
    units_display: <UnitsBulletList units={entry.units ?? []} />,
    section_name: entry.section?.name ?? "—",
  }));

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

  const currentStatus = showArchived ? "inactive" : "active";

  const { data, isFetching, error } = useGetCobsQuestionnairesQuery(
    {
      status: currentStatus,
      search: debouncedSearch || "COBS",
      page,
      per_page: rowsPerPage,
    },
    {
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true,
    },
  );
  const [archiveCobs, { isLoading: isArchiving }] = useArchiveCobsMutation();

  const is404 = error?.status === 404;
  const rawData = data?.data ?? [];
  const tableData = flattenCobsData(rawData);
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
      await archiveCobs(toRestore.id).unwrap();
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
      await archiveCobs(toArchive.id).unwrap();
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
        title="Archive COBS Questionnaire"
        message={`Are you sure you want to archive checklist #${toArchive?.id}? This action will set the questionnaire as inactive.`}
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
        message={`Are you sure you want to restore checklist #${toRestore?.id}? This will set it back to active.`}
      />
    </>
  );
};

export default COBSQuestionnaires;
