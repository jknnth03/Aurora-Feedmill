import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { useState } from "react";
import COBSImagePreviewDialog from "../../cobs/COBSImagePreviewDialog";
import "./COBSApprovalModal.scss";

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

const COBSApprovalModal = ({ open, onClose, batchEntry = null, onApprove }) => {
  const [previewState, setPreviewState] = useState({
    open: false,
    images: [],
    index: 0,
  });

  const openPreview = (imgs, idx) =>
    setPreviewState({ open: true, images: imgs, index: idx });

  const closePreview = () => setPreviewState((p) => ({ ...p, open: false }));

  const groupedResponses = batchEntry
    ? groupResponsesByCategory(batchEntry.responses ?? [])
    : {};

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
        PaperProps={{ className: "cobsam__paper" }}>
        <div className="cobsam__header">
          <div className="cobsam__header-title">
            <GppMaybeIcon className="cobsam__header-icon" />
            <span>Approval Details</span>
          </div>
          {batchEntry && (
            <span className="cobsam__batch-label">
              Batch #{batchEntry.batch_no} — {batchEntry.unit ?? "—"}
            </span>
          )}
          <IconButton size="small" className="cobsam__close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {batchEntry && (
          <div className="cobsam__info-strip">
            <div className="cobsam__info-item">
              <span className="cobsam__info-label">Submitted by</span>
              <span className="cobsam__info-value">
                {batchEntry.user ?? "—"}
              </span>
            </div>
            <div className="cobsam__info-item">
              <span className="cobsam__info-label">Approver</span>
              <span className="cobsam__info-value">
                {batchEntry.approver ?? "—"}
              </span>
            </div>
            <div className="cobsam__info-item">
              <span className="cobsam__info-label">Checklist</span>
              <span className="cobsam__info-value">
                {batchEntry.checklist_name ?? "—"}
              </span>
            </div>
            <div className="cobsam__info-item">
              <span className="cobsam__info-label">Week</span>
              <span className="cobsam__info-value">
                Week {batchEntry.week ?? "—"}
              </span>
            </div>
            <div className="cobsam__info-item">
              <span className="cobsam__info-label">Start</span>
              <span className="cobsam__info-value">
                {formatDateTime(batchEntry.start_at)}
              </span>
            </div>
            <div className="cobsam__info-item">
              <span className="cobsam__info-label">End</span>
              <span className="cobsam__info-value">
                {formatDateTime(batchEntry.end_at)}
              </span>
            </div>
            <div className="cobsam__info-item">
              <span className="cobsam__info-label">Progress</span>
              <span className="cobsam__info-value cobsam__info-value--accent">
                {batchEntry.progress ?? "—"}
              </span>
            </div>
          </div>
        )}

        <DialogContent className="cobsam__content">
          {!batchEntry ? (
            <div className="cobsam__skeleton-wrap">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="cobsam__skeleton-row" />
              ))}
            </div>
          ) : (
            <>
              {Object.entries(groupedResponses).map(([category, items]) => (
                <div key={category} className="cobsam__section">
                  <div className="cobsam__section-header">{category}</div>
                  <div className="cobsam__table-scroll">
                    <table className="cobsam__table">
                      <thead>
                        <tr className="cobsam__thead-row">
                          <th className="cobsam__th cobsam__th--item">Item</th>
                          <th className="cobsam__th cobsam__th--compliance">
                            Compliance
                          </th>
                          <th className="cobsam__th cobsam__th--remarks">
                            Remarks
                          </th>
                          <th className="cobsam__th cobsam__th--attachment">
                            Attachment
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(({ response, images }, idx) => (
                          <tr key={idx} className="cobsam__tr">
                            <td className="cobsam__td cobsam__td--item">
                              {idx + 1}. {response.sub_item ?? "—"}
                              {response.item && (
                                <span className="cobsam__item-area">
                                  {response.item}
                                </span>
                              )}
                            </td>

                            <td className="cobsam__td cobsam__td--compliance">
                              <div className="cobsam__radio-box">
                                {SCORE_OPTIONS.map((score) => (
                                  <label
                                    key={score}
                                    className="cobsam__radio-item cobsam__radio-item--readonly">
                                    <input
                                      type="radio"
                                      value={score}
                                      checked={response.score === score}
                                      readOnly
                                      disabled
                                      className="cobsam__radio-input"
                                    />
                                    <span
                                      className={`cobsam__radio-circle cobsam__radio-circle--${score}`}
                                    />
                                    <span className="cobsam__radio-text">
                                      {score}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </td>

                            <td className="cobsam__td cobsam__td--remarks">
                              <textarea
                                className="cobsam__textarea cobsam__textarea--readonly"
                                value={response.remarks ?? ""}
                                readOnly
                                rows={2}
                                placeholder="—"
                              />
                            </td>

                            <td className="cobsam__td cobsam__td--attachment">
                              {images.length > 0 ? (
                                <div className="cobsam__attach-file-list">
                                  {images.map((url, i) => {
                                    const filename =
                                      decodeURIComponent(
                                        url.split("/").pop().split("?")[0],
                                      ) || `file-${i + 1}`;
                                    return (
                                      <div
                                        key={i}
                                        className="cobsam__attach-file-row">
                                        <Tooltip
                                          title={filename}
                                          placement="top">
                                          <span className="cobsam__attach-file-name">
                                            {filename}
                                          </span>
                                        </Tooltip>
                                        <Tooltip
                                          title="View image"
                                          placement="top">
                                          <IconButton
                                            size="small"
                                            className="cobsam__attach-eye"
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
                                <span className="cobsam__no-attach">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div className="cobsam__others">
                <div className="cobsam__others-header">Others</div>
                <div className="cobsam__others-body">
                  <div className="cobsam__others-field">
                    <span className="cobsam__others-label">Date</span>
                    <div className="cobsam__others-input-box">
                      <span className="cobsam__others-time">
                        {batchEntry?.start_at
                          ? formatDateDisplay(batchEntry.start_at.split(" ")[0])
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="cobsam__others-field">
                    <span className="cobsam__others-label">Time</span>
                    <div className="cobsam__time-row">
                      <div className="cobsam__time-block">
                        <span className="cobsam__time-block-label">Start</span>
                        <span className="cobsam__time-block-value">
                          {formatDateTime(batchEntry?.start_at)}
                        </span>
                      </div>
                      <div className="cobsam__time-divider">—</div>
                      <div className="cobsam__time-block">
                        <span className="cobsam__time-block-label">End</span>
                        <span className="cobsam__time-block-value">
                          {formatDateTime(batchEntry?.end_at)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="cobsam__others-field">
                    <span className="cobsam__others-label">Temporal Audit</span>
                    <div className="cobsam__others-input-box">
                      <div className="cobsam__temporal-options">
                        {TEMPORAL_AUDIT_OPTIONS.map((opt) => (
                          <label
                            key={opt}
                            className="cobsam__temporal-item cobsam__temporal-item--readonly">
                            <input
                              type="radio"
                              name="view_temporal_audit"
                              value={opt}
                              checked={
                                (batchEntry?.temporal_audit ?? "") === opt
                              }
                              readOnly
                              disabled
                              className="cobsam__radio-input"
                            />
                            <span className="cobsam__temporal-circle" />
                            <span className="cobsam__temporal-text">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="cobsam__others-field">
                    <span className="cobsam__others-label">Good Points</span>
                    <textarea
                      className="cobsam__others-textarea cobsam__others-textarea--readonly"
                      value={batchEntry.good_points ?? ""}
                      readOnly
                      rows={4}
                      placeholder="—"
                    />
                  </div>

                  <div className="cobsam__others-field">
                    <span className="cobsam__others-label">Remarks</span>
                    <textarea
                      className="cobsam__others-textarea cobsam__others-textarea--readonly"
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

        <DialogActions className="cobsam__footer">
          <Button
            variant="text"
            onClick={onClose}
            className="cobsam__btn-close">
            CLOSE
          </Button>
          <div />
          {batchEntry?.is_completed === 1 && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
              onClick={() => onApprove?.(batchEntry)}
              className="cobsam__btn-approve">
              ACKNOWLEDGE
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <COBSImagePreviewDialog
        open={previewState.open}
        onClose={closePreview}
        images={previewState.images}
        initialIndex={previewState.index}
      />
    </>
  );
};

export default COBSApprovalModal;
