import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AssessmentIcon from "@mui/icons-material/Assessment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditIcon from "@mui/icons-material/Edit";
import MergeIcon from "@mui/icons-material/MergeType";
import {
  getChipBg,
  getChipTextColor,
  useChipColors,
} from "../../components/accountmenu/Chipcolorpickerutils";
import COBSStartCheckingDialog from "./COBSStartCheckingDialog";
import COBSShowReportDialog from "./COBSShowReportDialog";
import ConfirmDialog from "../../reusable-components/comfirm-dialog/ConfirmDialog";
import "./COBSModal.scss";
import { useMergeCobsMutation } from "../../features/api/cobs/cobsApi";

const WEEK_LABELS = ["Week 1", "Week 2", "Week 3", "Week 4"];

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

const STATUS_CHIP_MAP = {
  done: "chip-done",
  "for acknowledgement": "chip-for-approval",
  "on going": "chip-on-going",
  pending: "chip-pending",
  rejected: "chip-rejected",
  "on progress": "chip-draft",
  "saved as draft": "chip-draft",
};

const getWeekStatus = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return "Pending";
  const latest = entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
  const raw = latest.status?.toLowerCase() ?? "pending";

  if (raw === "approved" || raw === "done" || raw === "completed")
    return "Done";
  if (raw === "for approval" || raw === "for acknowledgement")
    return "For Acknowledgement";
  if (raw === "on going") return "On Going";
  if (raw === "rejected") return "Rejected";
  if (raw === "on progress") {
    if (latest.is_completed === 0 || latest.is_completed === false)
      return "Saved as Draft";
    return "For Acknowledgement";
  }
  if (latest.is_completed === 0 || latest.is_completed === false)
    return "Saved as Draft";
  return "Pending";
};

const isWeekDone = (entries) => {
  const status = getWeekStatus(entries)?.toLowerCase();
  return status === "done" || status === "for acknowledgement";
};

const getLatestEntry = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  return entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
};

const isDraftEntry = (entry) => {
  if (!entry) return false;
  return entry.is_completed === 0 || entry.is_completed === false;
};

const getTotalScore = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return "—";
  const latest = getLatestEntry(entries);
  if (latest?.score == null) return "—";
  return `${latest.score}%`;
};

const getDoneOn = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return "—";
  const latest = getLatestEntry(entries);
  if (!latest?.end_at) return "—";
  const date = new Date(latest.end_at);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const StatusChip = ({ status }) => {
  useChipColors();
  const chipId = STATUS_CHIP_MAP[status?.toLowerCase()] ?? null;
  if (!chipId) return <span className="cobs-cm__dash">{status ?? "—"}</span>;
  return (
    <span
      className="cobs-cm__chip"
      style={{
        background: getChipBg(chipId),
        color: getChipTextColor(chipId),
      }}>
      {status}
    </span>
  );
};

const RowActionMenu = ({
  week,
  unitName,
  entries,
  checklistId,
  unitDataId,
  fallbackApproverId,
  isPreviousWeekDone,
  onStartChecking,
  onContinueChecking,
  onShowReport,
  onShowChecklist,
  onMerge,
}) => {
  const [anchor, setAnchor] = useState(null);
  const latest = getLatestEntry(entries);
  const status = getWeekStatus(entries);
  const statusLower = status?.toLowerCase();
  const isForAcknowledgement =
    statusLower === "for acknowledgement" || statusLower === "done";
  const isDraft = latest ? isDraftEntry(latest) : false;

  const hasEntries = Array.isArray(entries) && entries.length > 0;
  const canAct = hasEntries || isPreviousWeekDone;
  const isWeek4 = week === "Week 4";

  if (!canAct) return <span className="cobs-cm__dash">—</span>;

  const close = () => setAnchor(null);

  const resolvedUnitId = latest?.unit_id ?? unitDataId;
  const resolvedApproverId = latest?.approver_id ?? fallbackApproverId;
  const resolvedChecklistId = latest?.checklist_id ?? checklistId;

  return (
    <div className="cobs-cm__actions-cell">
      <IconButton
        size="small"
        className="cobs-cm__icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          setAnchor(e.currentTarget);
        }}>
        <MoreHorizIcon sx={{ fontSize: 18 }} />
      </IconButton>

      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ className: "cobs-cm__menu-paper" }}>
        {isForAcknowledgement
          ? [
              <MenuItem
                key="report"
                className="cobs-cm__menu-item"
                onClick={() => {
                  close();
                  onShowReport?.({
                    week,
                    unitName,
                    unitId: resolvedUnitId,
                    checklistId: resolvedChecklistId,
                    batchEntry: latest,
                  });
                }}>
                <AssessmentIcon className="cobs-cm__menu-icon" />
                Show Report
              </MenuItem>,
              <MenuItem
                key="checklist"
                className="cobs-cm__menu-item"
                onClick={() => {
                  close();
                  onShowChecklist?.({
                    week,
                    unitName,
                    unitId: resolvedUnitId,
                    checklistId: resolvedChecklistId,
                    batchEntry: latest,
                  });
                }}>
                <VisibilityIcon className="cobs-cm__menu-icon" />
                Show Checklist
              </MenuItem>,
            ]
          : isDraft
            ? [
                <MenuItem
                  key="continue"
                  className="cobs-cm__menu-item"
                  onClick={() => {
                    close();
                    onContinueChecking?.({
                      week,
                      unitName,
                      unitId: resolvedUnitId,
                      approverId: resolvedApproverId,
                      checklistId: resolvedChecklistId,
                      batchEntry: latest,
                    });
                  }}>
                  <EditIcon className="cobs-cm__menu-icon" />
                  Continue Checking
                </MenuItem>,
                isWeek4 && (
                  <MenuItem
                    key="merge"
                    className="cobs-cm__menu-item"
                    onClick={() => {
                      close();
                      onMerge?.();
                    }}>
                    <MergeIcon className="cobs-cm__menu-icon" />
                    Merge with Week 3
                  </MenuItem>
                ),
              ]
            : [
                <MenuItem
                  key="start"
                  className="cobs-cm__menu-item"
                  onClick={() => {
                    close();
                    onStartChecking?.({
                      week,
                      unitName,
                      unitId: resolvedUnitId,
                      approverId: resolvedApproverId,
                      checklistId: resolvedChecklistId,
                    });
                  }}>
                  <PlayArrowIcon className="cobs-cm__menu-icon" />
                  Start Checking
                </MenuItem>,
                isWeek4 && (
                  <MenuItem
                    key="merge"
                    className="cobs-cm__menu-item"
                    onClick={() => {
                      close();
                      onMerge?.();
                    }}>
                    <MergeIcon className="cobs-cm__menu-icon" />
                    Merge with Week 3
                  </MenuItem>
                ),
              ]}
      </Menu>
    </div>
  );
};

const COBSModal = ({
  open,
  unitName,
  unitData,
  month,
  year,
  onClose,
  isFetching,
}) => {
  const [startCheckingData, setStartCheckingData] = useState(null);
  const [continueCheckingData, setContinueCheckingData] = useState(null);
  const [showReportData, setShowReportData] = useState(null);
  const [showChecklistData, setShowChecklistData] = useState(null);
  const [mergeConfirmOpen, setMergeConfirmOpen] = useState(false);

  const [mergeCobs, { isLoading: isMerging }] = useMergeCobsMutation();

  const monthLabel = MONTHS[(month ?? 1) - 1];

  const weekMap = unitData?.weeks ?? {};
  const checklists = unitData?.checklists ?? [];
  const unitDataId = unitData?.unit_id ?? null;
  const checklistId = checklists[0]?.id ?? null;

  const allBatches = Object.values(weekMap).flat();
  const fallbackApproverId =
    allBatches.find((b) => b?.approver_id != null)?.approver_id ?? null;

  const rows = WEEK_LABELS.map((label) => ({
    week: label,
    entries: weekMap[label] ?? [],
  }));

  const handleMergeConfirm = async () => {
    try {
      await mergeCobs({ month, year }).unwrap();
      setMergeConfirmOpen(false);
    } catch (err) {
      console.error("Merge failed:", err);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        className="cobs-cm"
        PaperProps={{
          className: "cobs-cm__paper",
          sx: { maxWidth: 700 },
        }}>
        <DialogTitle className="cobs-cm__title">
          Checklist for the Month of {monthLabel} {year}
        </DialogTitle>

        <DialogContent className="cobs-cm__content">
          <table className="cobs-cm__table">
            <thead>
              <tr className="cobs-cm__thead-row">
                <th className="cobs-cm__th cobs-cm__th--unit cobs-cm__th--sortable">
                  Unit <span className="cobs-cm__sort-arrow">↓</span>
                </th>
                <th className="cobs-cm__th cobs-cm__th--week">Week</th>
                <th className="cobs-cm__th cobs-cm__th--score">Total Score</th>
                <th className="cobs-cm__th cobs-cm__th--doneon">Done On</th>
                <th className="cobs-cm__th cobs-cm__th--status">Status</th>
                <th className="cobs-cm__th cobs-cm__th--actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching
                ? WEEK_LABELS.map((lbl) => (
                    <tr key={lbl} className="cobs-cm__tr">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <td key={i} className="cobs-cm__td">
                          <Skeleton variant="text" width="70%" height={20} />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map(({ week, entries }, index) => {
                    const previousEntries =
                      index === 0 ? null : rows[index - 1].entries;
                    const isPreviousWeekDone =
                      index === 0 || isWeekDone(previousEntries);
                    return (
                      <tr key={week} className="cobs-cm__tr">
                        <td className="cobs-cm__td">{unitName}</td>
                        <td className="cobs-cm__td">{week}</td>
                        <td className="cobs-cm__td cobs-cm__td--score">
                          {getTotalScore(entries)}
                        </td>
                        <td className="cobs-cm__td cobs-cm__td--doneon">
                          {getDoneOn(entries)}
                        </td>
                        <td className="cobs-cm__td">
                          <StatusChip status={getWeekStatus(entries)} />
                        </td>
                        <td className="cobs-cm__td cobs-cm__td--actions">
                          <RowActionMenu
                            week={week}
                            unitName={unitName}
                            entries={entries}
                            checklistId={checklistId}
                            unitDataId={unitDataId}
                            fallbackApproverId={fallbackApproverId}
                            isPreviousWeekDone={isPreviousWeekDone}
                            onStartChecking={setStartCheckingData}
                            onContinueChecking={setContinueCheckingData}
                            onShowReport={setShowReportData}
                            onShowChecklist={setShowChecklistData}
                            onMerge={() => setMergeConfirmOpen(true)}
                          />
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </DialogContent>

        <DialogActions className="cobs-cm__footer">
          <Button
            variant="outlined"
            onClick={onClose}
            className="cobs-cm__btn-close">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <COBSStartCheckingDialog
        open={Boolean(startCheckingData)}
        onClose={() => setStartCheckingData(null)}
        onSuccess={() => setStartCheckingData(null)}
        unitName={startCheckingData?.unitName}
        week={startCheckingData?.week}
        unitId={startCheckingData?.unitId}
        approverId={startCheckingData?.approverId}
        checklistId={startCheckingData?.checklistId}
        month={month}
        year={year}
      />

      <COBSStartCheckingDialog
        open={Boolean(continueCheckingData)}
        onClose={() => setContinueCheckingData(null)}
        onSuccess={() => setContinueCheckingData(null)}
        unitName={continueCheckingData?.unitName}
        week={continueCheckingData?.week}
        unitId={continueCheckingData?.unitId}
        approverId={continueCheckingData?.approverId}
        checklistId={continueCheckingData?.checklistId}
        month={month}
        year={year}
        continueMode
        batchEntry={continueCheckingData?.batchEntry}
      />

      <COBSStartCheckingDialog
        open={Boolean(showChecklistData)}
        onClose={() => setShowChecklistData(null)}
        unitName={showChecklistData?.unitName}
        week={showChecklistData?.week}
        checklistId={showChecklistData?.checklistId}
        month={month}
        year={year}
        viewMode
        batchEntry={showChecklistData?.batchEntry}
      />

      <COBSShowReportDialog
        open={Boolean(showReportData)}
        onClose={() => setShowReportData(null)}
        reportData={showReportData?.batchEntry}
        unitName={showReportData?.unitName}
        week={showReportData?.week}
        month={month}
        year={year}
      />

      <ConfirmDialog
        open={mergeConfirmOpen}
        onClose={() => setMergeConfirmOpen(false)}
        onConfirm={handleMergeConfirm}
        title="Merge with Week 3?"
        message="This will merge Week 4 data with Week 3. This action cannot be undone."
        confirmLabel="Merge"
        cancelLabel="Cancel"
        isLoading={isMerging}
        confirmVariant="success"
      />
    </>
  );
};

export default COBSModal;
