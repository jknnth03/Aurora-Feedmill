import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useApprovePestsApprovalMutation } from "../../../features/api/approval/pestsApproval";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import "./PestsApprovalModal.scss";

const OTHER_OBSERVATIONS = [
  { name: "Cleanliness/Sanitation", subs: ["Clean", "Dirty"] },
  { name: "Structural", subs: ["Good", "Defects"] },
  { name: "Proper Ventilation", subs: ["Yes", "No"] },
];

const TOTAL_OBS_COLUMNS = OTHER_OBSERVATIONS.reduce(
  (acc, item) => acc + item.subs.length,
  0,
);

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

const formatDateOnly = (raw) => {
  if (!raw) return "—";
  const date = new Date(raw);
  if (isNaN(date)) return "—";
  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getGrade = (percent) => {
  if (percent <= 30) return { label: "Low", color: "#7bc67e" };
  if (percent <= 60) return { label: "Moderate", color: "#4db6ac" };
  return { label: "Critical", color: "#1a237e" };
};

const getViewObsValue = (responses, areaName, itemName) => {
  if (!responses) return null;
  for (const r of responses) {
    const raw = r?.response ?? r;
    if (raw?.inspection_area === areaName) {
      const obs = raw?.other_obervation ?? raw?.other_observations ?? {};
      if (Array.isArray(obs)) {
        const found = obs.find((o) => o.name === itemName);
        return found?.score ?? null;
      }
      return obs[itemName] ?? null;
    }
  }
  return null;
};

const getViewGridValue = (responses, areaName, pestName) => {
  if (!responses) return "";
  for (const r of responses) {
    const raw = r?.response ?? r;
    if (raw?.inspection_area === areaName) {
      const pestList = raw?.pests ?? [];
      const found = pestList.find((p) =>
        typeof p === "string" ? p === pestName : p.name === pestName,
      );
      if (found != null) {
        return typeof found === "object" ? String(found.score ?? "") : "";
      }
    }
  }
  return "";
};

const dataUrlToFile = (dataUrl, filename) => {
  if (!dataUrl) return null;
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) return null;
  const mimeType = match[1];
  const base64Data = match[2];
  const byteString = atob(base64Data);
  const byteArray = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }
  const extension = mimeType === "image/jpeg" ? "jpg" : "png";
  return new File([byteArray], `${filename}.${extension}`, {
    type: mimeType,
  });
};

const getLoggedInUser = () => {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const PestsApprovalModal = ({
  open,
  onClose,
  batchEntry = null,
  checklistCreatedAt,
  onApprove,
  currentUser = null,
}) => {
  const [approvePestsApproval, { isLoading: isApproving }] =
    useApprovePestsApprovalMutation();

  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!batchEntry) return null;

  const responses = batchEntry.responses ?? [];

  const displayDate =
    batchEntry?.date ?? checklistCreatedAt ?? batchEntry?.start_at ?? null;

  const inspectionAreas = [
    ...new Set(
      responses
        .map((r) => r?.response?.inspection_area ?? null)
        .filter(Boolean),
    ),
  ];

  const pests = (() => {
    const seen = new Set();
    const list = [];
    responses.forEach((r) => {
      const raw = r?.response ?? r;
      (raw?.pests ?? []).forEach((p) => {
        const name = typeof p === "string" ? p : p.name;
        if (name && !seen.has(name)) {
          seen.add(name);
          list.push({ name });
        }
      });
    });
    return list;
  })();

  const getBarPercent = (pestName) => {
    const max = inspectionAreas.length * 10;
    if (max === 0) return 0;
    const total = responses.reduce((sum, r) => {
      const raw = r?.response ?? r;
      const pestList = raw?.pests ?? [];
      const found = pestList.find((p) =>
        typeof p === "string" ? p === pestName : p.name === pestName,
      );
      return (
        sum +
        (found && typeof found === "object" ? Number(found.score ?? 0) : 0)
      );
    }, 0);
    return Math.min(Math.round((total / max) * 100), 100);
  };

  const handleAcknowledgeClick = () => {
    setConfirmOpen(true);
  };

  const handleConfirmAcknowledge = () => {
    if (!batchEntry) return;

    const loggedInUser = getLoggedInUser();
    const approverId =
      currentUser?.id ?? loggedInUser?.id ?? batchEntry.user_id;
    const approverName =
      currentUser?.name ??
      (`${loggedInUser?.first_name ?? ""} ${loggedInUser?.last_name ?? ""}`.trim() ||
        batchEntry.user ||
        "");
    const signatureFile = dataUrlToFile(
      loggedInUser?.signature,
      `signature-${approverId}`,
    );

    approvePestsApproval({
      batch_no: batchEntry.batch_no,
      assessor_id: approverId,
      approvers: [
        {
          id: approverId,
          name: approverName,
        },
      ],
      signatureFile,
    })
      .unwrap()
      .then(() => {
        setConfirmOpen(false);
        onApprove?.(batchEntry);
      })
      .catch((err) => console.error("Acknowledge failed:", err));
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
      PaperProps={{ className: "pestsam__paper" }}>
      <div className="pestsam__header">
        <div className="pestsam__header-title">
          <GppMaybeIcon className="pestsam__header-icon" />
          <span>Acknowledgement Details</span>
        </div>
        <span className="pestsam__batch-label">
          {batchEntry.checklist_name ?? "—"} —{" "}
          {batchEntry.period_display ?? "—"} ({batchEntry.month_display ?? "—"}/
          {new Date(batchEntry.start_at).getFullYear()})
        </span>
        <IconButton size="small" className="pestsam__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <div className="pestsam__info-strip">
        <div className="pestsam__info-item">
          <span className="pestsam__info-label">Date</span>
          <span className="pestsam__info-value">
            {formatDateOnly(displayDate)}
          </span>
        </div>
        <div className="pestsam__info-item">
          <span className="pestsam__info-label">Submitted by</span>
          <span className="pestsam__info-value">{batchEntry.user ?? "—"}</span>
        </div>
        <div className="pestsam__info-item">
          <span className="pestsam__info-label">Approver</span>
          <span className="pestsam__info-value">
            {batchEntry.approver ?? "—"}
          </span>
        </div>
        <div className="pestsam__info-item">
          <span className="pestsam__info-label">Start</span>
          <span className="pestsam__info-value">
            {formatDateTime(batchEntry.start_at)}
          </span>
        </div>
        <div className="pestsam__info-item">
          <span className="pestsam__info-label">End</span>
          <span className="pestsam__info-value">
            {formatDateTime(batchEntry.end_at)}
          </span>
        </div>
      </div>

      <DialogContent className="pestsam__content">
        <div className="pestsam__section">
          <div className="pestsam__section-header">Pest Inspection</div>
          <div className="pestsam__table-scroll">
            <table className="pestsam__grid-table">
              <thead>
                <tr className="pestsam__thead-row">
                  <th className="pestsam__th pestsam__th--area" rowSpan={2}>
                    Inspection Areas
                  </th>
                  <th
                    className="pestsam__th pestsam__th--group"
                    colSpan={pests.length}>
                    Pest
                  </th>
                  <th
                    className="pestsam__th pestsam__th--group"
                    colSpan={TOTAL_OBS_COLUMNS}>
                    Other Observation
                  </th>
                </tr>
                <tr className="pestsam__thead-row pestsam__thead-row--sub">
                  {pests.map((pest) => (
                    <th
                      key={pest.name}
                      className="pestsam__th pestsam__th--col">
                      {pest.name}
                    </th>
                  ))}
                  {OTHER_OBSERVATIONS.map((item) =>
                    item.subs.map((sub) => (
                      <th
                        key={`${item.name}__${sub}`}
                        className="pestsam__th pestsam__th--col pestsam__th--obs-sub">
                        <div className="pestsam__th-obs-group">{item.name}</div>
                        <div className="pestsam__th-obs-sub">{sub}</div>
                      </th>
                    )),
                  )}
                </tr>
              </thead>
              <tbody>
                {inspectionAreas.map((areaName) => (
                  <tr key={areaName} className="pestsam__tr">
                    <td className="pestsam__td pestsam__td--area-name">
                      {areaName}
                    </td>
                    {pests.map((pest) => {
                      const val = getViewGridValue(
                        responses,
                        areaName,
                        pest.name,
                      );
                      return (
                        <td
                          key={pest.name}
                          className="pestsam__td pestsam__td--input">
                          <span className="pestsam__score-display">
                            {val !== "" ? val : "—"}
                          </span>
                        </td>
                      );
                    })}
                    {OTHER_OBSERVATIONS.map((item) => {
                      const currentVal = getViewObsValue(
                        responses,
                        areaName,
                        item.name,
                      );
                      return item.subs.map((sub) => (
                        <td
                          key={`${item.name}__${sub}`}
                          className="pestsam__td pestsam__td--checkbox">
                          <label className="pestsam__checkbox-label pestsam__checkbox-label--readonly">
                            <input
                              type="checkbox"
                              checked={currentVal === sub}
                              readOnly
                              disabled
                              className="pestsam__checkbox-input"
                            />
                            <span className="pestsam__checkbox-box" />
                          </label>
                        </td>
                      ));
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pestsam__section">
          <div className="pestsam__section-header">Grading Summary</div>
          <div className="pestsam__graph-body">
            {pests.map(({ name }) => {
              const percent = getBarPercent(name);
              const grade = getGrade(percent);
              return (
                <div key={name} className="pestsam__graph-row">
                  <span className="pestsam__graph-label">{name}</span>
                  <div className="pestsam__graph-bar-track">
                    <div
                      className="pestsam__graph-bar-fill"
                      style={{ width: `${percent}%`, background: grade.color }}
                    />
                  </div>
                  <span className="pestsam__graph-percent">{percent}%</span>
                </div>
              );
            })}
            <div className="pestsam__graph-legend">
              <span className="pestsam__legend-item">
                <span
                  className="pestsam__legend-dot"
                  style={{ background: "#7bc67e" }}
                />
                Low (0–30%)
              </span>
              <span className="pestsam__legend-item">
                <span
                  className="pestsam__legend-dot"
                  style={{ background: "#4db6ac" }}
                />
                Moderate (31–60%)
              </span>
              <span className="pestsam__legend-item">
                <span
                  className="pestsam__legend-dot"
                  style={{ background: "#1a237e" }}
                />
                Critical (61%+)
              </span>
            </div>
          </div>
        </div>

        <div className="pestsam__section">
          <div className="pestsam__section-header">Others</div>
          <div className="pestsam__others-body">
            <div className="pestsam__others-field">
              <span className="pestsam__others-label">
                Remarks for Observation
              </span>
              <div className="pestsam__others-textarea-wrap">
                <textarea
                  className="pestsam__others-textarea"
                  value={batchEntry.remarks ?? ""}
                  readOnly
                  disabled
                  rows={4}
                />
              </div>
            </div>
            <div className="pestsam__others-field">
              <span className="pestsam__others-label">Notes</span>
              <div className="pestsam__others-textarea-wrap">
                <textarea
                  className="pestsam__others-textarea"
                  value={batchEntry.notes ?? ""}
                  readOnly
                  disabled
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions className="pestsam__footer">
        <Button
          variant="text"
          onClick={onClose}
          disabled={isApproving}
          className="pestsam__btn-close">
          CLOSE
        </Button>
        <Button
          variant="contained"
          startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
          onClick={handleAcknowledgeClick}
          disabled={isApproving}
          className="pestsam__btn-approve">
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

export default PestsApprovalModal;
