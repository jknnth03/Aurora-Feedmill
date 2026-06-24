import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useApproveBirdsApprovalMutation } from "../../../features/api/approval/birdsApproval";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import "./BirdsApprovalModal.scss";

const INFESTATION_LEVELS = ["Low", "Average", "Moderate"];

const getResponseValue = (responses, areaName, field) => {
  if (!responses) return null;
  for (const r of responses) {
    const raw = r?.response ?? r;
    if (raw?.inspection_area === areaName) return raw?.[field] ?? null;
  }
  return null;
};

const getWastage = (responses, areaName) => {
  if (!responses) return "—";
  for (const r of responses) {
    const raw = r?.response ?? r;
    if (raw?.inspection_area === areaName) {
      const wastage = raw?.wastage ?? [];
      if (wastage.length === 0) return "—";
      const first = wastage[0];
      return typeof first === "string" ? first : (first?.name ?? "—");
    }
  }
  return "—";
};

const BirdsApprovalModal = ({
  open,
  onClose,
  batchEntry = null,
  onApprove,
}) => {
  const [approveBirdsApproval, { isLoading: isApproving }] =
    useApproveBirdsApprovalMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!batchEntry) return null;

  const responses = batchEntry.responses ?? [];

  const inspectionAreas = [
    ...new Set(
      responses
        .map((r) => r?.response?.inspection_area ?? null)
        .filter(Boolean),
    ),
  ];

  const handleAcknowledgeClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmAcknowledge = () => {
    if (!batchEntry) return;
    approveBirdsApproval({
      batch_no: batchEntry.batch_no,
      user_id: batchEntry.user_id,
      approvers: [
        {
          id: batchEntry.user_id,
          name: batchEntry.user ?? "",
        },
      ],
    })
      .unwrap()
      .then(() => {
        setConfirmOpen(false);
        onApprove?.(batchEntry);
      })
      .catch((err) => {
        console.error("Acknowledge failed:", err);
      });
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="lg"
      fullWidth
      PaperProps={{ className: "birdsam__paper" }}>
      <div className="birdsam__header">
        <div className="birdsam__header-title">
          <GppMaybeIcon className="birdsam__header-icon" />
          <span>Acknowledgement Details</span>
        </div>
        <span className="birdsam__batch-label">
          {batchEntry.checklist_name ?? "—"} —{" "}
          {batchEntry.period_display ?? "—"} ({batchEntry.month_display ?? "—"}/
          {new Date(batchEntry.start_at).getFullYear()})
        </span>
        <IconButton size="small" className="birdsam__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="birdsam__content">
        <div className="birdsam__section">
          <div className="birdsam__section-header">Bird Inspection</div>
          <div className="birdsam__table-scroll">
            <table className="birdsam__grid-table">
              <thead>
                <tr className="birdsam__thead-row">
                  <th className="birdsam__th birdsam__th--area">
                    Inspection Areas
                  </th>
                  <th
                    className="birdsam__th birdsam__th--group"
                    colSpan={INFESTATION_LEVELS.length}>
                    Infestation Level
                  </th>
                  <th className="birdsam__th birdsam__th--group">
                    Treatment / Action Dose
                  </th>
                  <th className="birdsam__th birdsam__th--group">
                    Presence of Feed/RM Wastage
                  </th>
                  <th className="birdsam__th birdsam__th--group">
                    Identify Entry Points
                  </th>
                </tr>
                <tr className="birdsam__thead-row birdsam__thead-row--sub">
                  <th className="birdsam__th birdsam__th--area-placeholder" />
                  {INFESTATION_LEVELS.map((lvl) => (
                    <th key={lvl} className="birdsam__th birdsam__th--col">
                      {lvl}
                    </th>
                  ))}
                  <th className="birdsam__th birdsam__th--col birdsam__th--wide" />
                  <th className="birdsam__th birdsam__th--col birdsam__th--wide" />
                  <th className="birdsam__th birdsam__th--col birdsam__th--wide" />
                </tr>
              </thead>
              <tbody>
                {inspectionAreas.map((areaName) => {
                  const infestation = getResponseValue(
                    responses,
                    areaName,
                    "infestation_level",
                  );
                  const treatment = getResponseValue(
                    responses,
                    areaName,
                    "treatment_dose",
                  );
                  const entryPoints = getResponseValue(
                    responses,
                    areaName,
                    "entry_points",
                  );
                  const wastage = getWastage(responses, areaName);

                  return (
                    <tr key={areaName} className="birdsam__tr">
                      <td className="birdsam__td birdsam__td--area-name">
                        {areaName}
                      </td>
                      {INFESTATION_LEVELS.map((lvl) => (
                        <td
                          key={lvl}
                          className="birdsam__td birdsam__td--radio">
                          <label className="birdsam__radio-label">
                            <input
                              type="radio"
                              checked={infestation === lvl}
                              readOnly
                              disabled
                              className="birdsam__radio-input"
                            />
                            <span className="birdsam__radio-box" />
                          </label>
                        </td>
                      ))}
                      <td className="birdsam__td birdsam__td--text">
                        <span className="birdsam__text-display">
                          {treatment || "—"}
                        </span>
                      </td>
                      <td className="birdsam__td birdsam__td--text">
                        <span className="birdsam__text-display">{wastage}</span>
                      </td>
                      <td className="birdsam__td birdsam__td--text">
                        <span className="birdsam__text-display">
                          {entryPoints || "—"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="birdsam__section birdsam__section--others">
          <div className="birdsam__section-header">Others</div>
          <div className="birdsam__others-body">
            <div className="birdsam__others-field">
              <span className="birdsam__others-label">Date</span>
              <span className="birdsam__text-display">
                {batchEntry.start_at
                  ? new Date(batchEntry.start_at).toLocaleDateString("en-PH", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "—"}
              </span>
            </div>
            <div className="birdsam__others-field">
              <span className="birdsam__others-label">Companion</span>
              <span className="birdsam__text-display">
                {batchEntry.evaluator || "—"}
              </span>
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions className="birdsam__footer">
        <Button
          variant="text"
          onClick={onClose}
          disabled={isApproving}
          className="birdsam__btn-close">
          CLOSE
        </Button>
        <Button
          variant="contained"
          startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
          onClick={handleAcknowledgeClick}
          disabled={isApproving}
          className="birdsam__btn-approve">
          {isApproving ? "SUBMITTING…" : "ACKNOWLEDGE"}
        </Button>
      </DialogActions>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmAcknowledge}
        title="Acknowledge this report?"
        message="This action will mark the report as acknowledged and cannot be undone."
        confirmLabel="Acknowledge"
        cancelLabel="Cancel"
        isLoading={isApproving}
        confirmVariant="primary"
      />
    </Dialog>
  );
};

export default BirdsApprovalModal;
