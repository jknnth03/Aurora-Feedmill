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
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditIcon from "@mui/icons-material/Edit";
import AssessmentIcon from "@mui/icons-material/Assessment";
import TimelineIcon from "@mui/icons-material/Timeline";
import {
  getChipBg,
  getChipTextColor,
  useChipColors,
} from "../../components/accountmenu/Chipcolorpickerutils";
import BirdsStartCheckingDialog from "./BirdsStartCheckingDialog";
import BirdsShowReportDialog from "./BirdsShowReportDialog";
import BirdsAcknowledgementTimelineDialog from "./BirdsAcknowledgementTimelineDialog";
import {
  getMonthPeriodLabels,
  getWeekStatus,
  getLatestEntry,
  isWeekDone,
} from "./birdsPeriodUtils";
import "./BirdsModal.scss";

const SECTION = "birds";

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

// "For Approval" intentionally reuses the same chip id as "For
// Acknowledgement" — visually they're treated the same in this table.
const STATUS_CHIP_MAP = {
  done: "chip-done",
  "for acknowledgement": "chip-for-approval",
  "for approval": "chip-for-approval",
  "on going": "chip-on-going",
  pending: "chip-pending",
  rejected: "chip-rejected",
  "on progress": "chip-draft",
  "saved as draft": "chip-draft",
};

const isDraftEntry = (entry) => {
  if (!entry) return false;
  return entry.is_completed === 0 || entry.is_completed === false;
};

const hasAcknowledgeableTimeline = (entries) => {
  const hasEntries = Array.isArray(entries) && entries.length > 0;
  if (!hasEntries) return false;
  const statusLower = getWeekStatus(entries, SECTION)?.toLowerCase();
  return statusLower !== "pending" && statusLower !== "saved as draft";
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
  if (!chipId) return <span className="birds-cm__dash">{status ?? "—"}</span>;
  return (
    <span
      className="birds-cm__chip"
      style={{
        background: getChipBg(chipId),
        color: getChipTextColor(chipId),
      }}>
      {status}
    </span>
  );
};

const TimelineCell = ({ entries, period, onOpenTimeline }) => {
  const latest = getLatestEntry(entries);
  const canOpen = hasAcknowledgeableTimeline(entries);

  if (!canOpen) return <span className="birds-cm__dash">—</span>;

  return (
    <Tooltip title="View acknowledgement timeline" placement="top">
      <IconButton
        size="small"
        className="birds-cm__icon-btn birds-cm__icon-btn--timeline"
        onClick={(e) => {
          e.stopPropagation();
          onOpenTimeline?.({ period, batchEntry: latest });
        }}>
        <TimelineIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Tooltip>
  );
};

const RowActionMenu = ({
  period,
  unitName,
  entries,
  checklistId,
  unitDataId,
  fallbackEvaluatorId,
  fallbackApproverId,
  isPreviousPeriodDone,
  onStartChecking,
  onContinueChecking,
  onShowChecklist,
  onShowReport,
}) => {
  const [anchor, setAnchor] = useState(null);
  const latest = getLatestEntry(entries);
  const status = getWeekStatus(entries, SECTION);
  const statusLower = status?.toLowerCase();
  const isForAcknowledgement =
    statusLower === "for acknowledgement" ||
    statusLower === "for approval" ||
    statusLower === "done";
  const isDraft = latest ? isDraftEntry(latest) : false;
  const hasEntries = Array.isArray(entries) && entries.length > 0;
  const canAct = hasEntries || isPreviousPeriodDone;

  if (!canAct) return <span className="birds-cm__dash">—</span>;

  const close = () => setAnchor(null);
  const resolvedUnitId = latest?.unit_id ?? unitDataId;
  const resolvedEvaluatorId = latest?.evaluator_id ?? fallbackEvaluatorId;
  const resolvedApproverId = latest?.approver_id ?? fallbackApproverId;
  const resolvedChecklistId = latest?.checklist_id ?? checklistId;

  return (
    <div className="birds-cm__actions-cell">
      <IconButton
        size="small"
        className="birds-cm__icon-btn"
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
        PaperProps={{ className: "birds-cm__menu-paper" }}>
        {isForAcknowledgement
          ? [
              <MenuItem
                key="checklist"
                className="birds-cm__menu-item"
                onClick={() => {
                  close();
                  onShowChecklist?.({
                    period,
                    unitName,
                    unitId: resolvedUnitId,
                    checklistId: resolvedChecklistId,
                    batchEntry: latest,
                  });
                }}>
                <VisibilityIcon className="birds-cm__menu-icon" />
                Show Checklist
              </MenuItem>,
              <MenuItem
                key="report"
                className="birds-cm__menu-item"
                onClick={() => {
                  close();
                  onShowReport?.(latest);
                }}>
                <AssessmentIcon className="birds-cm__menu-icon" />
                Show Report
              </MenuItem>,
            ]
          : isDraft
            ? [
                <MenuItem
                  key="continue"
                  className="birds-cm__menu-item"
                  onClick={() => {
                    close();
                    onContinueChecking?.({
                      period,
                      unitName,
                      unitId: resolvedUnitId,
                      evaluatorId: resolvedEvaluatorId,
                      approverId: resolvedApproverId,
                      checklistId: resolvedChecklistId,
                      batchEntry: latest,
                    });
                  }}>
                  <EditIcon className="birds-cm__menu-icon" />
                  Continue Checking
                </MenuItem>,
              ]
            : [
                <MenuItem
                  key="start"
                  className="birds-cm__menu-item"
                  onClick={() => {
                    close();
                    onStartChecking?.({
                      period,
                      unitName,
                      unitId: resolvedUnitId,
                      evaluatorId: resolvedEvaluatorId,
                      approverId: resolvedApproverId,
                      checklistId: resolvedChecklistId,
                    });
                  }}>
                  <PlayArrowIcon className="birds-cm__menu-icon" />
                  Start Checking
                </MenuItem>,
              ]}
      </Menu>
    </div>
  );
};

const BirdsModal = ({
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
  const [showChecklistData, setShowChecklistData] = useState(null);
  const [showReportData, setShowReportData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);

  const monthLabel = MONTHS[(month ?? 1) - 1];
  const periodMap = unitData?.periods ?? {};
  const checklistId = unitData?.id ?? null;
  const unitDataId = null;

  const periodLabels = getMonthPeriodLabels(month, year);

  const allBatches = Object.values(periodMap).flat();
  const fallbackEvaluatorId =
    allBatches.find((b) => b?.evaluator_id != null)?.evaluator_id ?? null;
  const fallbackApproverId =
    allBatches.find((b) => b?.approver_id != null)?.approver_id ?? null;

  const rows = periodLabels.map((label) => ({
    period: label,
    entries: periodMap[label] ?? [],
  }));

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        className="birds-cm"
        PaperProps={{ className: "birds-cm__paper", sx: { maxWidth: 700 } }}>
        <DialogTitle className="birds-cm__title">
          Checklist for the Month of {monthLabel} {year}
        </DialogTitle>

        <DialogContent className="birds-cm__content">
          <table className="birds-cm__table">
            <thead>
              <tr className="birds-cm__thead-row">
                <th className="birds-cm__th birds-cm__th--unit">Checklist</th>
                <th className="birds-cm__th birds-cm__th--week">Period</th>
                <th className="birds-cm__th birds-cm__th--doneon">Done On</th>
                <th className="birds-cm__th birds-cm__th--timeline">
                  Timeline
                </th>
                <th className="birds-cm__th birds-cm__th--status">Status</th>
                <th className="birds-cm__th birds-cm__th--actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching
                ? periodLabels.map((lbl) => (
                    <tr key={lbl} className="birds-cm__tr">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <td key={i} className="birds-cm__td">
                          <Skeleton variant="text" width="70%" height={20} />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map(({ period, entries }, index) => {
                    const previousEntries =
                      index === 0 ? null : rows[index - 1].entries;
                    const isPreviousPeriodDone =
                      index === 0 || isWeekDone(previousEntries, SECTION);
                    return (
                      <tr key={period} className="birds-cm__tr">
                        <td className="birds-cm__td">{unitName}</td>
                        <td className="birds-cm__td">{period}</td>
                        <td className="birds-cm__td birds-cm__td--doneon">
                          {getDoneOn(entries)}
                        </td>
                        <td className="birds-cm__td birds-cm__td--timeline">
                          <TimelineCell
                            entries={entries}
                            period={period}
                            onOpenTimeline={setTimelineData}
                          />
                        </td>
                        <td className="birds-cm__td">
                          <StatusChip
                            status={getWeekStatus(entries, SECTION)}
                          />
                        </td>
                        <td className="birds-cm__td birds-cm__td--actions">
                          <RowActionMenu
                            period={period}
                            unitName={unitName}
                            entries={entries}
                            checklistId={checklistId}
                            unitDataId={unitDataId}
                            fallbackEvaluatorId={fallbackEvaluatorId}
                            fallbackApproverId={fallbackApproverId}
                            isPreviousPeriodDone={isPreviousPeriodDone}
                            onStartChecking={setStartCheckingData}
                            onContinueChecking={setContinueCheckingData}
                            onShowChecklist={setShowChecklistData}
                            onShowReport={setShowReportData}
                          />
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </DialogContent>

        <DialogActions className="birds-cm__footer">
          <Button
            variant="outlined"
            onClick={onClose}
            className="birds-cm__btn-close">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <BirdsStartCheckingDialog
        open={Boolean(startCheckingData)}
        onClose={() => setStartCheckingData(null)}
        onSuccess={() => {
          setStartCheckingData(null);
          onRefetch?.();
        }}
        unitName={startCheckingData?.unitName}
        period={startCheckingData?.period}
        unitId={startCheckingData?.unitId}
        evaluatorId={startCheckingData?.evaluatorId}
        approverId={startCheckingData?.approverId}
        checklistId={startCheckingData?.checklistId}
        month={month}
        year={year}
      />

      <BirdsStartCheckingDialog
        open={Boolean(continueCheckingData)}
        onClose={() => setContinueCheckingData(null)}
        onSuccess={() => {
          setContinueCheckingData(null);
          onRefetch?.();
        }}
        unitName={continueCheckingData?.unitName}
        period={continueCheckingData?.period}
        unitId={continueCheckingData?.unitId}
        evaluatorId={continueCheckingData?.evaluatorId}
        approverId={continueCheckingData?.approverId}
        checklistId={continueCheckingData?.checklistId}
        month={month}
        year={year}
        continueMode
        batchEntry={continueCheckingData?.batchEntry}
      />

      <BirdsStartCheckingDialog
        open={Boolean(showChecklistData)}
        onClose={() => setShowChecklistData(null)}
        unitName={showChecklistData?.unitName}
        period={showChecklistData?.period}
        checklistId={showChecklistData?.checklistId}
        month={month}
        year={year}
        viewMode
        batchEntry={showChecklistData?.batchEntry}
      />

      <BirdsShowReportDialog
        open={Boolean(showReportData)}
        onClose={() => setShowReportData(null)}
        reportData={showReportData}
        onRefetch={onRefetch}
      />

      <BirdsAcknowledgementTimelineDialog
        open={Boolean(timelineData)}
        onClose={() => setTimelineData(null)}
        batchEntry={timelineData?.batchEntry}
        period={timelineData?.period}
      />
    </>
  );
};

export default BirdsModal;
