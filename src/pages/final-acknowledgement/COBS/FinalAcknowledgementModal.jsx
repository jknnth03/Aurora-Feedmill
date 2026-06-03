import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useState } from "react";
import COBSImagePreviewDialog from "../../cobs/COBSImagePreviewDialog";
import FinalAcknowledgementSignatureDialog from "./FinalAcknowledgementSignatureDialog";
import "./FinalAcknowledgementModal.scss";
import { useAssessAcknowledgementMutation } from "../../../features/api/final-acknowledgement/cobsAcknowledgementApi";

const SCORE_OPTIONS = [0, 50, 75, 100];
const TEMPORAL_AUDIT_OPTIONS = [
  "Spot/Ongoing",
  "Pre-operation",
  "Post-operation",
];

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

const formatDateDisplay = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const groupResponsesByCategory = (responses = []) => {
  const grouped = {};
  responses.forEach(({ response, images }) => {
    const category = response.checklist ?? "Uncategorized";
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({ response, images: images ?? [] });
  });
  return grouped;
};

const FinalAcknowledgementModal = ({
  open,
  onClose,
  batchEntry = null,
  onAssess,
}) => {
  const [previewState, setPreviewState] = useState({
    open: false,
    images: [],
    index: 0,
  });
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [assessAcknowledgement, { isLoading: isAssessing }] =
    useAssessAcknowledgementMutation();

  const openPreview = (imgs, idx) =>
    setPreviewState({ open: true, images: imgs, index: idx });
  const closePreview = () => setPreviewState((p) => ({ ...p, open: false }));

  const groupedResponses = batchEntry
    ? groupResponsesByCategory(batchEntry.responses ?? [])
    : {};

  const handleAssess = ({ blob, assessorId }) => {
    if (!batchEntry || !blob) return;

    const assessImageFile = new File([blob], "signature.png", {
      type: "image/png",
    });

    assessAcknowledgement({
      batch_no: batchEntry.batch_no,
      assessor_id: assessorId,
      assess: [
        {
          id: batchEntry.id ?? 1,
          name: batchEntry.assessor ?? "",
        },
      ],
      assessImageFile,
    })
      .unwrap()
      .then(() => {
        onAssess?.(batchEntry);
      })
      .catch((err) => {
        console.error("Assess failed:", err);
      });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason === "backdropClick") return;
          onClose();
        }}
        disableEscapeKeyDown
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "finackm__paper" }}>
        <div className="finackm__header">
          <div className="finackm__header-title">
            <FactCheckIcon className="finackm__header-icon" />
            <span>Final Acknowledgement Details</span>
          </div>
          {batchEntry && (
            <span className="finackm__batch-label">
              Batch #{batchEntry.batch_no} — {batchEntry.unit ?? "—"}
            </span>
          )}
          <IconButton size="small" className="finackm__close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {batchEntry && (
          <div className="finackm__info-strip">
            <div className="finackm__info-item">
              <span className="finackm__info-label">Submitted by</span>
              <span className="finackm__info-value">
                {batchEntry.user ?? "—"}
              </span>
            </div>
            <div className="finackm__info-item">
              <span className="finackm__info-label">Assessor</span>
              <span className="finackm__info-value">
                {batchEntry.assessor ?? "—"}
              </span>
            </div>
            <div className="finackm__info-item">
              <span className="finackm__info-label">Checklist</span>
              <span className="finackm__info-value">
                {batchEntry.checklist_name ?? "—"}
              </span>
            </div>
            <div className="finackm__info-item">
              <span className="finackm__info-label">Week</span>
              <span className="finackm__info-value">
                Week {batchEntry.week ?? "—"}
              </span>
            </div>
            <div className="finackm__info-item">
              <span className="finackm__info-label">Start</span>
              <span className="finackm__info-value">
                {formatDateTime(batchEntry.start_at)}
              </span>
            </div>
            <div className="finackm__info-item">
              <span className="finackm__info-label">End</span>
              <span className="finackm__info-value">
                {formatDateTime(batchEntry.end_at)}
              </span>
            </div>
            <div className="finackm__info-item">
              <span className="finackm__info-label">Progress</span>
              <span className="finackm__info-value finackm__info-value--accent">
                {batchEntry.progress ?? "—"}
              </span>
            </div>
          </div>
        )}

        <DialogContent className="finackm__content">
          {!batchEntry ? (
            <div className="finackm__skeleton-wrap">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="finackm__skeleton-row" />
              ))}
            </div>
          ) : (
            <>
              {Object.entries(groupedResponses).map(([category, items]) => (
                <div key={category} className="finackm__section">
                  <div className="finackm__section-header">{category}</div>
                  <div className="finackm__table-scroll">
                    <table className="finackm__table">
                      <thead>
                        <tr className="finackm__thead-row">
                          <th className="finackm__th finackm__th--item">
                            Item
                          </th>
                          <th className="finackm__th finackm__th--compliance">
                            Compliance
                          </th>
                          <th className="finackm__th finackm__th--remarks">
                            Remarks
                          </th>
                          <th className="finackm__th finackm__th--attachment">
                            Attachment
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(({ response, images }, idx) => (
                          <tr key={idx} className="finackm__tr">
                            <td className="finackm__td finackm__td--item">
                              {idx + 1}. {response.sub_item ?? "—"}
                              {response.item && (
                                <span className="finackm__item-area">
                                  {response.item}
                                </span>
                              )}
                            </td>
                            <td className="finackm__td finackm__td--compliance">
                              <div className="finackm__radio-box">
                                {SCORE_OPTIONS.map((score) => (
                                  <label
                                    key={score}
                                    className="finackm__radio-item finackm__radio-item--readonly">
                                    <input
                                      type="radio"
                                      value={score}
                                      checked={response.score === score}
                                      readOnly
                                      disabled
                                      className="finackm__radio-input"
                                    />
                                    <span
                                      className={`finackm__radio-circle finackm__radio-circle--${score}`}
                                    />
                                    <span className="finackm__radio-text">
                                      {score}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </td>
                            <td className="finackm__td finackm__td--remarks">
                              <textarea
                                className="finackm__textarea finackm__textarea--readonly"
                                value={response.remarks ?? ""}
                                readOnly
                                rows={2}
                                placeholder="—"
                              />
                            </td>
                            <td className="finackm__td finackm__td--attachment">
                              {images.length > 0 ? (
                                <div className="finackm__attach-file-list">
                                  {images.map((url, i) => {
                                    const filename =
                                      decodeURIComponent(
                                        url.split("/").pop().split("?")[0],
                                      ) || `file-${i + 1}`;
                                    return (
                                      <div
                                        key={i}
                                        className="finackm__attach-file-row">
                                        <Tooltip
                                          title={filename}
                                          placement="top">
                                          <span className="finackm__attach-file-name">
                                            {filename}
                                          </span>
                                        </Tooltip>
                                        <Tooltip
                                          title="View image"
                                          placement="top">
                                          <IconButton
                                            size="small"
                                            className="finackm__attach-eye"
                                            onClick={() =>
                                              openPreview(images, i)
                                            }>
                                            <VisibilityIcon
                                              sx={{ fontSize: 13 }}
                                            />
                                          </IconButton>
                                        </Tooltip>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="finackm__no-attach">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div className="finackm__others">
                <div className="finackm__others-header">Others</div>
                <div className="finackm__others-body">
                  <div className="finackm__others-field">
                    <span className="finackm__others-label">Date</span>
                    <div className="finackm__others-input-box">
                      <span className="finackm__others-time">
                        {batchEntry?.start_at
                          ? formatDateDisplay(batchEntry.start_at.split(" ")[0])
                          : "—"}
                      </span>
                    </div>
                  </div>
                  <div className="finackm__others-field">
                    <span className="finackm__others-label">Time</span>
                    <div className="finackm__time-row">
                      <div className="finackm__time-block">
                        <span className="finackm__time-block-label">Start</span>
                        <span className="finackm__time-block-value">
                          {formatDateTime(batchEntry?.start_at)}
                        </span>
                      </div>
                      <div className="finackm__time-divider">—</div>
                      <div className="finackm__time-block">
                        <span className="finackm__time-block-label">End</span>
                        <span className="finackm__time-block-value">
                          {formatDateTime(batchEntry?.end_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="finackm__others-field">
                    <span className="finackm__others-label">
                      Temporal Audit
                    </span>
                    <div className="finackm__others-input-box">
                      <div className="finackm__temporal-options">
                        {TEMPORAL_AUDIT_OPTIONS.map((opt) => (
                          <label
                            key={opt}
                            className="finackm__temporal-item finackm__temporal-item--readonly">
                            <input
                              type="radio"
                              name="view_temporal_audit"
                              value={opt}
                              checked={
                                (batchEntry?.temporal_audit ?? "") === opt
                              }
                              readOnly
                              disabled
                              className="finackm__radio-input"
                            />
                            <span className="finackm__temporal-circle" />
                            <span className="finackm__temporal-text">
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="finackm__others-field">
                    <span className="finackm__others-label">Good Points</span>
                    <textarea
                      className="finackm__others-textarea finackm__others-textarea--readonly"
                      value={batchEntry.good_points ?? ""}
                      readOnly
                      rows={4}
                      placeholder="—"
                    />
                  </div>
                  <div className="finackm__others-field">
                    <span className="finackm__others-label">Remarks</span>
                    <textarea
                      className="finackm__others-textarea finackm__others-textarea--readonly"
                      value={batchEntry.remarks ?? ""}
                      readOnly
                      rows={4}
                      placeholder="—"
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>

        <DialogActions className="finackm__footer">
          <Button
            variant="text"
            onClick={onClose}
            disabled={isAssessing}
            className="finackm__btn-close">
            CLOSE
          </Button>
          <div />
          {batchEntry?.is_completed === 1 && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
              onClick={() => setSignatureDialogOpen(true)}
              disabled={isAssessing}
              className="finackm__btn-assess">
              {isAssessing ? "SUBMITTING…" : "ASSESS"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <FinalAcknowledgementSignatureDialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        onSubmit={({ blob, assessorId }) => {
          setSignatureDialogOpen(false);
          handleAssess({ blob, assessorId });
        }}
        signerName={batchEntry?.assessor ?? ""}
        isSubmitting={isAssessing}
      />

      <COBSImagePreviewDialog
        open={previewState.open}
        onClose={closePreview}
        images={previewState.images}
        initialIndex={previewState.index}
      />
    </>
  );
};

export default FinalAcknowledgementModal;
