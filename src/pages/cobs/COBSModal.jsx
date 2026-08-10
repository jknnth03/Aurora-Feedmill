import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AssessmentIcon from "@mui/icons-material/Assessment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditIcon from "@mui/icons-material/Edit";
import MergeIcon from "@mui/icons-material/MergeType";
import TimelineIcon from "@mui/icons-material/Timeline";
import AddAPhotoIcon from "@mui/icons-material/AddAPhoto";
import {
  getChipBg,
  getChipTextColor,
  useChipColors,
} from "../../components/accountmenu/Chipcolorpickerutils";
import COBSStartCheckingDialog from "./COBSStartCheckingDialog";
import COBSShowReportDialog from "./COBSShowReportDialog";
import COBSAcknowledgementTimelineDialog from "./COBSAcknowledgementTimelineDialog";
import ConfirmDialog from "../../reusable-components/comfirm-dialog/ConfirmDialog";
import "./COBSModal.scss";
import { useMergeCobsMutation } from "../../features/api/cobs/cobsApi";
import { getMonthWeekLabels } from "./cobsWeekUtils";

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
  "on progress": "chip-draft",
  "saved as draft": "chip-draft",
};

const getWeekStatus = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return "Pending";
  const latest = entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
  const raw = latest.status?.toLowerCase() ?? "";

  if (raw === "on going") return "On Going";

  if (latest.is_completed === 1 || latest.is_completed === true) {
    if (!latest.is_evaluated) return "For Signature";
    if (!latest.is_approved) return "For Acknowledgement";
    if (!latest.is_assessed) return "For Acknowledgement";
    if (latest.score == null) return "Merged";
    return "Done";
  }

  if (latest.is_completed === 0 || latest.is_completed === false)
    return "Saved as Draft";

  return "Pending";
};

const isWeekDone = (entries) => {
  const status = getWeekStatus(entries)?.toLowerCase();
  return status === "done" || status === "merged";
};

const getLatestEntry = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  return entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
};

const isDraftEntry = (entry) => {
  if (!entry) return false;
  return entry.is_completed === 0 || entry.is_completed === false;
};

const hasAcknowledgeableTimeline = (entries) => {
  const hasEntries = Array.isArray(entries) && entries.length > 0;
  if (!hasEntries) return false;
  const statusLower = getWeekStatus(entries)?.toLowerCase();
  return statusLower !== "pending" && statusLower !== "saved as draft";
};

const TimelineCell = ({ entries, week, onOpenTimeline }) => {
  const latest = getLatestEntry(entries);
  const canOpen = hasAcknowledgeableTimeline(entries);

  if (!canOpen) return <span className="cobs-cm__dash">—</span>;

  return (
    <Tooltip title="View acknowledgement timeline" placement="top">
      <IconButton
        size="small"
        className="cobs-cm__icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          onOpenTimeline?.({ week, batchEntry: latest });
        }}>
        <TimelineIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Tooltip>
  );
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

const getRemarks = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return "—";
  const latest = getLatestEntry(entries);
  const remarks = latest?.remarks ?? latest?.merge_remarks ?? null;
  if (!remarks || !String(remarks).trim()) return "—";
  return remarks;
};

const StatusChip = ({ status }) => {
  useChipColors();

  if (status?.toLowerCase() === "for signature") {
    return (
      <span
        className="cobs-cm__chip"
        style={{
          background: "#ede9fe",
          color: "#6d28d9",
        }}>
        {status}
      </span>
    );
  }

  if (status?.toLowerCase() === "merged") {
    return (
      <span
        className="cobs-cm__chip"
        style={{
          background: "#dbeafe",
          color: "#1d4ed8",
        }}>
        {status}
      </span>
    );
  }

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

const RemarksCell = ({ entries }) => {
  const text = getRemarks(entries);
  if (text === "—") return <span className="cobs-cm__dash">—</span>;
  return (
    <Tooltip title={text} placement="top">
      <span className="cobs-cm__remarks-text">{text}</span>
    </Tooltip>
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
  canMergeRow,
  mergeTargetLabel,
  mergeSourceBatchNo,
  onStartChecking,
  onContinueChecking,
  onShowReport,
  onShowChecklist,
  onUpdateChecklist,
  onMerge,
}) => {
  const [anchor, setAnchor] = useState(null);
  const latest = getLatestEntry(entries);
  const status = getWeekStatus(entries);
  const statusLower = status?.toLowerCase();

  const isMerged = statusLower === "merged";
  const isForAcknowledgement =
    statusLower === "for acknowledgement" ||
    statusLower === "for signature" ||
    statusLower === "done";
  const canUpdateAttachment = statusLower === "done";
  const isDraft = latest ? isDraftEntry(latest) : false;

  const hasEntries = Array.isArray(entries) && entries.length > 0;
  const canAct = (hasEntries || isPreviousWeekDone) && !isMerged;
  const canMerge = canMergeRow && Boolean(mergeTargetLabel);

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
              canUpdateAttachment && (
                <MenuItem
                  key="update"
                  className="cobs-cm__menu-item"
                  onClick={() => {
                    close();
                    onUpdateChecklist?.({
                      week,
                      unitName,
                      unitId: resolvedUnitId,
                      approverId: resolvedApproverId,
                      checklistId: resolvedChecklistId,
                      batchEntry: latest,
                    });
                  }}>
                  <AddAPhotoIcon className="cobs-cm__menu-icon" />
                  Add Photos
                </MenuItem>
              ),
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
                canMerge && (
                  <MenuItem
                    key="merge"
                    className="cobs-cm__menu-item"
                    onClick={() => {
                      close();
                      onMerge?.(mergeSourceBatchNo);
                    }}>
                    <MergeIcon className="cobs-cm__menu-icon" />
                    Merge with {mergeTargetLabel}
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
                canMerge && (
                  <MenuItem
                    key="merge"
                    className="cobs-cm__menu-item"
                    onClick={() => {
                      close();
                      onMerge?.(mergeSourceBatchNo);
                    }}>
                    <MergeIcon className="cobs-cm__menu-icon" />
                    Merge with {mergeTargetLabel}
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
  onRefetch,
}) => {
  const [startCheckingData, setStartCheckingData] = useState(null);
  const [continueCheckingData, setContinueCheckingData] = useState(null);
  const [showReportData, setShowReportData] = useState(null);
  const [showChecklistData, setShowChecklistData] = useState(null);
  const [updateChecklistData, setUpdateChecklistData] = useState(null);
  const [mergeData, setMergeData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);

  const [mergeCobs, { isLoading: isMerging }] = useMergeCobsMutation();

  const monthLabel = MONTHS[(month ?? 1) - 1];

  const weekLabels = getMonthWeekLabels(month, year);

  const weekMap = unitData?.weeks ?? {};
  const checklists = unitData?.checklists ?? [];
  const unitDataId = unitData?.unit_id ?? null;
  const checklistId = checklists[0]?.id ?? null;

  const allBatches = Object.values(weekMap).flat();
  const fallbackApproverId =
    allBatches.find((b) => b?.approver_id != null)?.approver_id ?? null;

  const rows = weekLabels.map((label) => ({
    week: label,
    entries: weekMap[label] ?? [],
  }));

  const handleMergeConfirm = async (remarks) => {
    if (!mergeData) return;
    try {
      await mergeCobs({
        batch_no: mergeData.batchNo,
        duplicate_reason: remarks,
      }).unwrap();
      setMergeData(null);
    } catch (err) {
      console.error("Merge failed:", err);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        className="cobs-cm"
        PaperProps={{
          className: "cobs-cm__paper",
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
                <th className="cobs-cm__th cobs-cm__th--timeline">Timeline</th>
                <th className="cobs-cm__th cobs-cm__th--status">Status</th>
                <th className="cobs-cm__th cobs-cm__th--remarks">Remarks</th>
                <th className="cobs-cm__th cobs-cm__th--actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching
                ? weekLabels.map((lbl) => (
                    <tr key={lbl} className="cobs-cm__tr">
                      {Array.from({ length: 8 }).map((_, i) => (
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
                    const prevWeekLabel =
                      index > 0 ? weekLabels[index - 1] : null;
                    const mergeSourceBatchNo = previousEntries
                      ? getLatestEntry(previousEntries)?.batch_no
                      : null;
                    return (
                      <tr key={week} className="cobs-cm__tr">
                        <td className="cobs-cm__td cobs-cm__td--unit">
                          {unitName}
                        </td>
                        <td className="cobs-cm__td">{week}</td>
                        <td className="cobs-cm__td cobs-cm__td--score">
                          {getTotalScore(entries)}
                        </td>
                        <td className="cobs-cm__td cobs-cm__td--doneon">
                          {getDoneOn(entries)}
                        </td>
                        <td className="cobs-cm__td cobs-cm__td--timeline">
                          <TimelineCell
                            entries={entries}
                            week={week}
                            onOpenTimeline={setTimelineData}
                          />
                        </td>
                        <td className="cobs-cm__td">
                          <StatusChip status={getWeekStatus(entries)} />
                        </td>
                        <td className="cobs-cm__td cobs-cm__td--remarks">
                          <RemarksCell entries={entries} />
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
                            canMergeRow={Boolean(prevWeekLabel)}
                            mergeTargetLabel={prevWeekLabel}
                            mergeSourceBatchNo={mergeSourceBatchNo}
                            onStartChecking={setStartCheckingData}
                            onContinueChecking={setContinueCheckingData}
                            onShowReport={setShowReportData}
                            onShowChecklist={setShowChecklistData}
                            onUpdateChecklist={setUpdateChecklistData}
                            onMerge={(batchNo) =>
                              setMergeData({
                                week,
                                targetWeek: prevWeekLabel,
                                batchNo,
                              })
                            }
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

      <COBSStartCheckingDialog
        open={Boolean(updateChecklistData)}
        onClose={() => setUpdateChecklistData(null)}
        onSuccess={() => {
          setUpdateChecklistData(null);
          onRefetch?.();
        }}
        unitName={updateChecklistData?.unitName}
        week={updateChecklistData?.week}
        unitId={updateChecklistData?.unitId}
        approverId={updateChecklistData?.approverId}
        checklistId={updateChecklistData?.checklistId}
        month={month}
        year={year}
        updateMode
        batchEntry={updateChecklistData?.batchEntry}
      />

      <COBSShowReportDialog
        open={Boolean(showReportData)}
        onClose={() => setShowReportData(null)}
        reportData={showReportData?.batchEntry}
        unitName={showReportData?.unitName}
        week={showReportData?.week}
        month={month}
        year={year}
        onRefetch={onRefetch}
      />

      <COBSAcknowledgementTimelineDialog
        open={Boolean(timelineData)}
        onClose={() => setTimelineData(null)}
        batchEntry={timelineData?.batchEntry}
        week={timelineData?.week}
      />

      <ConfirmDialog
        open={Boolean(mergeData)}
        onClose={() => setMergeData(null)}
        onConfirm={handleMergeConfirm}
        title={`Merge with ${mergeData?.targetWeek}?`}
        message={`This will merge ${mergeData?.week} data with ${mergeData?.targetWeek}. This action cannot be undone.`}
        confirmLabel="Merge"
        cancelLabel="Cancel"
        isLoading={isMerging}
        confirmVariant="success"
        showRemarksField
        remarksLabel="Merge Remarks"
        remarksPlaceholder="Enter reason for merging (optional)"
      />
    </>
  );
};

export default COBSModal;
