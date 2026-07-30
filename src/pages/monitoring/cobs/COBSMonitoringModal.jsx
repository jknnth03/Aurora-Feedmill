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
import AssessmentIcon from "@mui/icons-material/Assessment";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import TimelineIcon from "@mui/icons-material/Timeline";
import {
  getChipBg,
  getChipTextColor,
  useChipColors,
} from "../../../components/accountmenu/Chipcolorpickerutils";
import COBSMonitoringStartChecking from "./COBSMonitoringStartChecking";
import COBSShowReportDialog from "../../cobs/COBSShowReportDialog";
import COBSAcknowledgementTimelineDialog from "../../cobs/COBSAcknowledgementTimelineDialog";
import "../../cobs/COBSModal.scss";
import { getMonthWeekLabels } from "../../cobs/cobsWeekUtils";

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
    return "Done";
  }

  if (latest.is_completed === 0 || latest.is_completed === false)
    return "Saved as Draft";

  return "Pending";
};

const getLatestEntry = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  return entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
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

// View-only actions cell: Show Report (only once there's a scored/done
// submission) and Show Checklist (view responses, available as soon as
// there's at least one saved entry — including drafts). No Start/Continue
// Checking, no Merge — this is monitoring, not data entry.
const RowActionMenu = ({
  week,
  unitName,
  entries,
  checklistId,
  unitDataId,
  onShowReport,
  onShowChecklist,
}) => {
  const [anchor, setAnchor] = useState(null);
  const latest = getLatestEntry(entries);
  const status = getWeekStatus(entries);
  const statusLower = status?.toLowerCase();

  const hasEntries = Array.isArray(entries) && entries.length > 0;
  const canShowReport =
    statusLower === "for acknowledgement" ||
    statusLower === "for signature" ||
    statusLower === "done";
  const canShowChecklist = hasEntries && statusLower !== "pending";

  if (!canShowChecklist) return <span className="cobs-cm__dash">—</span>;

  const close = () => setAnchor(null);

  const resolvedUnitId = latest?.unit_id ?? unitDataId;
  const resolvedChecklistId = latest?.checklist_id ?? checklistId;

  const handleShowChecklist = () =>
    onShowChecklist?.({
      week,
      unitName,
      unitId: resolvedUnitId,
      checklistId: resolvedChecklistId,
      batchEntry: latest,
    });

  const handleShowReport = () =>
    onShowReport?.({
      week,
      unitName,
      unitId: resolvedUnitId,
      checklistId: resolvedChecklistId,
      batchEntry: latest,
    });

  // Only one action available (e.g. drafts/on going) — skip the dropdown.
  if (!canShowReport) {
    return (
      <Tooltip title="Show Checklist" placement="top">
        <IconButton
          size="small"
          className="cobs-cm__icon-btn"
          onClick={(e) => {
            e.stopPropagation();
            handleShowChecklist();
          }}>
          <VisibilityIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
    );
  }

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
        <MenuItem
          className="cobs-cm__menu-item"
          onClick={() => {
            close();
            handleShowReport();
          }}>
          <AssessmentIcon className="cobs-cm__menu-icon" />
          Show Report
        </MenuItem>
        <MenuItem
          className="cobs-cm__menu-item"
          onClick={() => {
            close();
            handleShowChecklist();
          }}>
          <VisibilityIcon className="cobs-cm__menu-icon" />
          Show Checklist
        </MenuItem>
      </Menu>
    </div>
  );
};

const COBSMonitoringModal = ({
  open,
  unitName,
  unitData,
  month,
  year,
  onClose,
  isFetching,
}) => {
  const [showReportData, setShowReportData] = useState(null);
  const [showChecklistData, setShowChecklistData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);

  const monthLabel = MONTHS[(month ?? 1) - 1];

  // Weeks are computed from the real calendar for this month/year — a
  // 31-day month like July will produce 5 weeks (the 5th being a short
  // 29-31 stub), while a 28-day February only produces 4.
  const weekLabels = getMonthWeekLabels(month, year);

  const weekMap = unitData?.weeks ?? {};
  const checklists = unitData?.checklists ?? [];
  const unitDataId = unitData?.unit_id ?? null;
  const checklistId = checklists[0]?.id ?? null;

  const rows = weekLabels.map((label) => ({
    week: label,
    entries: weekMap[label] ?? [],
  }));

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
                <th className="cobs-cm__th cobs-cm__th--actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching
                ? weekLabels.map((lbl) => (
                    <tr key={lbl} className="cobs-cm__tr">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <td key={i} className="cobs-cm__td">
                          <Skeleton variant="text" width="70%" height={20} />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map(({ week, entries }) => (
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
                      <td className="cobs-cm__td cobs-cm__td--actions">
                        <RowActionMenu
                          week={week}
                          unitName={unitName}
                          entries={entries}
                          checklistId={checklistId}
                          unitDataId={unitDataId}
                          onShowReport={setShowReportData}
                          onShowChecklist={setShowChecklistData}
                        />
                      </td>
                    </tr>
                  ))}
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

      <COBSMonitoringStartChecking
        open={Boolean(showChecklistData)}
        onClose={() => setShowChecklistData(null)}
        unitName={showChecklistData?.unitName}
        week={showChecklistData?.week}
        checklistId={showChecklistData?.checklistId}
        month={month}
        year={year}
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

      <COBSAcknowledgementTimelineDialog
        open={Boolean(timelineData)}
        onClose={() => setTimelineData(null)}
        batchEntry={timelineData?.batchEntry}
        week={timelineData?.week}
      />
    </>
  );
};

export default COBSMonitoringModal;
