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
import PESTSMonitoringStartCheckingDialog from "./PESTSMonitoringStartCheckingDialog";
import PestShowReportDialog from "../../pest/PestShowReportDialog";
import PestAcknowledgementTimelineDialog from "../../pest/PestAcknowledgementTimelineDialog";
import "../../pest/PestModal.scss"; // reuse PestModal.scss class names (pest-cm__*) — adjust path as needed

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
  if (raw === "rejected") return "Rejected";
  if (raw === "on going") return "On Going";
  if (latest.is_completed === 1 || latest.is_completed === true) {
    if (!latest.is_approved) return "For Acknowledgement";
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

const hasAcknowledgeableTimeline = (entries) => {
  const hasEntries = Array.isArray(entries) && entries.length > 0;
  if (!hasEntries) return false;
  const statusLower = getWeekStatus(entries)?.toLowerCase();
  return statusLower !== "pending" && statusLower !== "saved as draft";
};

const StatusChip = ({ status }) => {
  useChipColors();
  const chipId = STATUS_CHIP_MAP[status?.toLowerCase()] ?? null;
  if (!chipId) return <span className="pest-cm__dash">{status ?? "—"}</span>;
  return (
    <span
      className="pest-cm__chip"
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

  if (!canOpen) return <span className="pest-cm__dash">—</span>;

  return (
    <Tooltip title="View acknowledgement timeline" placement="top">
      <IconButton
        size="small"
        className="pest-cm__icon-btn"
        onClick={(e) => {
          e.stopPropagation();
          onOpenTimeline?.({ period, batchEntry: latest });
        }}>
        <TimelineIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Tooltip>
  );
};

// View-only actions cell: Show Report (only once there's a done/acknowledged
// submission) and Show Checklist (view responses, available for anything
// already saved — including drafts and rejected). No Start/Continue Checking.
const RowActionMenu = ({
  period,
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
    statusLower === "for acknowledgement" || statusLower === "done";
  const canShowChecklist = hasEntries && statusLower !== "pending";

  if (!canShowChecklist) return <span className="pest-cm__dash">—</span>;

  const close = () => setAnchor(null);
  const resolvedUnitId = latest?.unit_id ?? unitDataId;
  const resolvedChecklistId = latest?.checklist_id ?? checklistId;

  const handleShowChecklist = () =>
    onShowChecklist?.({
      period,
      unitName,
      unitId: resolvedUnitId,
      checklistId: resolvedChecklistId,
      batchEntry: latest,
    });

  const handleShowReport = () =>
    onShowReport?.({
      period,
      unitName,
      unitId: resolvedUnitId,
      checklistId: resolvedChecklistId,
      batchEntry: latest,
    });

  // Only one action available (e.g. drafts/on going/rejected) — skip the dropdown.
  if (!canShowReport) {
    return (
      <Tooltip title="Show Checklist" placement="top">
        <IconButton
          size="small"
          className="pest-cm__icon-btn"
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
    <div className="pest-cm__actions-cell">
      <IconButton
        size="small"
        className="pest-cm__icon-btn"
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
        PaperProps={{ className: "pest-cm__menu-paper" }}>
        <MenuItem
          className="pest-cm__menu-item"
          onClick={() => {
            close();
            handleShowReport();
          }}>
          <AssessmentIcon className="pest-cm__menu-icon" />
          Show Report
        </MenuItem>
        <MenuItem
          className="pest-cm__menu-item"
          onClick={() => {
            close();
            handleShowChecklist();
          }}>
          <VisibilityIcon className="pest-cm__menu-icon" />
          Show Checklist
        </MenuItem>
      </Menu>
    </div>
  );
};

const PESTSMonitoringModal = ({
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
  const periodMap = unitData?.periods ?? {};
  const checklistId = unitData?.id ?? null;
  const unitDataId = null;

  const rows = Object.keys(periodMap).map((label) => ({
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
        className="pest-cm"
        PaperProps={{ className: "pest-cm__paper", sx: { maxWidth: 700 } }}>
        <DialogTitle className="pest-cm__title">
          Checklist for the Month of {monthLabel} {year}
        </DialogTitle>

        <DialogContent className="pest-cm__content">
          <table className="pest-cm__table">
            <thead>
              <tr className="pest-cm__thead-row">
                <th className="pest-cm__th pest-cm__th--unit">Checklist</th>
                <th className="pest-cm__th pest-cm__th--week">Period</th>
                <th className="pest-cm__th pest-cm__th--doneon">Done On</th>
                <th className="pest-cm__th pest-cm__th--timeline">Timeline</th>
                <th className="pest-cm__th pest-cm__th--status">Status</th>
                <th className="pest-cm__th pest-cm__th--actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching
                ? Array.from({ length: 2 }).map((_, idx) => (
                    <tr key={idx} className="pest-cm__tr">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <td key={i} className="pest-cm__td">
                          <Skeleton variant="text" width="70%" height={20} />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map(({ period, entries }) => (
                    <tr key={period} className="pest-cm__tr">
                      <td className="pest-cm__td">{unitName}</td>
                      <td className="pest-cm__td">{period}</td>
                      <td className="pest-cm__td pest-cm__td--doneon">
                        {getDoneOn(entries)}
                      </td>
                      <td className="pest-cm__td pest-cm__td--timeline">
                        <TimelineCell
                          entries={entries}
                          period={period}
                          onOpenTimeline={setTimelineData}
                        />
                      </td>
                      <td className="pest-cm__td">
                        <StatusChip status={getWeekStatus(entries)} />
                      </td>
                      <td className="pest-cm__td pest-cm__td--actions">
                        <RowActionMenu
                          period={period}
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

        <DialogActions className="pest-cm__footer">
          <Button
            variant="outlined"
            onClick={onClose}
            className="pest-cm__btn-close">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <PESTSMonitoringStartCheckingDialog
        open={Boolean(showChecklistData)}
        onClose={() => setShowChecklistData(null)}
        unitName={showChecklistData?.unitName}
        period={showChecklistData?.period}
        checklistId={showChecklistData?.checklistId}
        month={month}
        year={year}
        batchEntry={showChecklistData?.batchEntry}
      />

      <PestShowReportDialog
        open={Boolean(showReportData)}
        onClose={() => setShowReportData(null)}
        reportData={showReportData?.batchEntry}
      />

      <PestAcknowledgementTimelineDialog
        open={Boolean(timelineData)}
        onClose={() => setTimelineData(null)}
        batchEntry={timelineData?.batchEntry}
        period={timelineData?.period}
      />
    </>
  );
};

export default PESTSMonitoringModal;
