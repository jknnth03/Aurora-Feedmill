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
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import EditIcon from "@mui/icons-material/Edit";
import {
  getChipBg,
  getChipTextColor,
  useChipColors,
} from "../../components/accountmenu/Chipcolorpickerutils";
import PestStartCheckingDialog from "./PestStartCheckingDialog";
import "./PestModal.scss";

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

const isWeekDone = (entries) => {
  const status = getWeekStatus(entries)?.toLowerCase();
  return status === "done";
};

const getLatestEntry = (entries) => {
  if (!Array.isArray(entries) || entries.length === 0) return null;
  return entries.reduce((a, b) => (b.batch_no > a.batch_no ? b : a));
};

const isDraftEntry = (entry) => {
  if (!entry) return false;
  return entry.is_completed === 0 || entry.is_completed === false;
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
}) => {
  const [anchor, setAnchor] = useState(null);
  const latest = getLatestEntry(entries);
  const status = getWeekStatus(entries);
  const statusLower = status?.toLowerCase();
  const isForAcknowledgement =
    statusLower === "for acknowledgement" || statusLower === "done";
  const isDraft = latest ? isDraftEntry(latest) : false;
  const hasEntries = Array.isArray(entries) && entries.length > 0;
  const canAct = hasEntries || isPreviousPeriodDone;

  if (!canAct) return <span className="pest-cm__dash">—</span>;

  const close = () => setAnchor(null);
  const resolvedUnitId = latest?.unit_id ?? unitDataId;
  const resolvedEvaluatorId = latest?.evaluator_id ?? fallbackEvaluatorId;
  const resolvedApproverId = latest?.approver_id ?? fallbackApproverId;
  const resolvedChecklistId = latest?.checklist_id ?? checklistId;

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
        {isForAcknowledgement
          ? [
              <MenuItem
                key="checklist"
                className="pest-cm__menu-item"
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
                <VisibilityIcon className="pest-cm__menu-icon" />
                Show Checklist
              </MenuItem>,
            ]
          : isDraft
            ? [
                <MenuItem
                  key="continue"
                  className="pest-cm__menu-item"
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
                  <EditIcon className="pest-cm__menu-icon" />
                  Continue Checking
                </MenuItem>,
              ]
            : [
                <MenuItem
                  key="start"
                  className="pest-cm__menu-item"
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
                  <PlayArrowIcon className="pest-cm__menu-icon" />
                  Start Checking
                </MenuItem>,
              ]}
      </Menu>
    </div>
  );
};

const PestModal = ({
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

  const monthLabel = MONTHS[(month ?? 1) - 1];
  const periodMap = unitData?.periods ?? {};
  const checklistId = unitData?.id ?? null;
  const unitDataId = null;

  const allBatches = Object.values(periodMap).flat();
  const fallbackEvaluatorId =
    allBatches.find((b) => b?.evaluator_id != null)?.evaluator_id ?? null;
  const fallbackApproverId =
    allBatches.find((b) => b?.approver_id != null)?.approver_id ?? null;

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
                <th className="pest-cm__th pest-cm__th--status">Status</th>
                <th className="pest-cm__th pest-cm__th--actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isFetching
                ? Array.from({ length: 2 }).map((_, idx) => (
                    <tr key={idx} className="pest-cm__tr">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <td key={i} className="pest-cm__td">
                          <Skeleton variant="text" width="70%" height={20} />
                        </td>
                      ))}
                    </tr>
                  ))
                : rows.map(({ period, entries }, index) => {
                    const previousEntries =
                      index === 0 ? null : rows[index - 1].entries;
                    const isPreviousPeriodDone =
                      index === 0 || isWeekDone(previousEntries);
                    return (
                      <tr key={period} className="pest-cm__tr">
                        <td className="pest-cm__td">{unitName}</td>
                        <td className="pest-cm__td">{period}</td>
                        <td className="pest-cm__td pest-cm__td--doneon">
                          {getDoneOn(entries)}
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
                            fallbackEvaluatorId={fallbackEvaluatorId}
                            fallbackApproverId={fallbackApproverId}
                            isPreviousPeriodDone={isPreviousPeriodDone}
                            onStartChecking={setStartCheckingData}
                            onContinueChecking={setContinueCheckingData}
                            onShowChecklist={setShowChecklistData}
                          />
                        </td>
                      </tr>
                    );
                  })}
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

      <PestStartCheckingDialog
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

      <PestStartCheckingDialog
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

      <PestStartCheckingDialog
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
    </>
  );
};

export default PestModal;
