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
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import {
  getChipBg,
  getChipTextColor,
  getChipName,
  useChipColors,
} from "../../components/accountmenu/Chipcolorpickerutils";
import COBSStartCheckingDialog from "./COBSStartCheckingDialog";
import "./COBSModal.scss";

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
  completed: "chip-completed",
  "for approval": "chip-for-approval",
  "on going": "chip-processing",
  pending: "chip-pending",
  rejected: "chip-rejected",
};

const getWeekStatus = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return "Pending";
  const latest = entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
  return latest.status ?? "Pending";
};

const getLatestEntry = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  return entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
};

const formatDateTime = (raw) => {
  if (!raw) return "—";
  const date = new Date(raw);
  if (isNaN(date)) return "—";
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const StatusChip = ({ status }) => {
  useChipColors();

  const chipId = STATUS_CHIP_MAP[status?.toLowerCase()] ?? null;
  if (!chipId) return <span className="cobs-cm__dash">—</span>;

  return (
    <span
      className="cobs-cm__chip"
      style={{
        background: getChipBg(chipId),
        color: getChipTextColor(chipId),
      }}>
      {getChipName(chipId)}
    </span>
  );
};

const RowActionMenu = ({
  week,
  unitName,
  entries,
  checklistId,
  unitDataId,
  onStartChecking,
}) => {
  const [anchor, setAnchor] = useState(null);
  const latest = getLatestEntry(entries);

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
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{ className: "cobs-cm__menu-paper" }}>
        <MenuItem
          className="cobs-cm__menu-item"
          onClick={() => {
            setAnchor(null);
            onStartChecking?.({
              week,
              unitName,
              unitId: latest?.unit_id ?? unitDataId,
              approverId: latest?.approver_id,
              checklistId,
            });
          }}>
          <PlayArrowIcon className="cobs-cm__menu-icon" />
          Start Checking
        </MenuItem>
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
  const monthLabel = MONTHS[(month ?? 1) - 1];

  const weekMap = unitData?.weeks ?? {};
  const checklists = unitData?.checklists ?? [];
  const checklistId = checklists[0]?.id ?? null;
  const unitDataId = unitData?.id ?? null;

  const rows = WEEK_LABELS.map((label) => ({
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
        PaperProps={{ className: "cobs-cm__paper" }}>
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
                <th className="cobs-cm__th cobs-cm__th--date">Start Date</th>
                <th className="cobs-cm__th cobs-cm__th--date">End Date</th>
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
                : rows.map(({ week, entries }) => {
                    const latest = getLatestEntry(entries);
                    return (
                      <tr key={week} className="cobs-cm__tr">
                        <td className="cobs-cm__td">{unitName}</td>
                        <td className="cobs-cm__td">{week}</td>
                        <td className="cobs-cm__td cobs-cm__td--datetime">
                          {formatDateTime(latest?.start_at)}
                        </td>
                        <td className="cobs-cm__td cobs-cm__td--datetime">
                          {formatDateTime(latest?.end_at)}
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
                            onStartChecking={setStartCheckingData}
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
        unitName={startCheckingData?.unitName}
        week={startCheckingData?.week}
        unitId={startCheckingData?.unitId}
        approverId={startCheckingData?.approverId}
        checklistId={startCheckingData?.checklistId}
        month={month}
        year={year}
      />
    </>
  );
};

export default COBSModal;
