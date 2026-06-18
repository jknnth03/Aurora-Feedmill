import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ImageIcon from "@mui/icons-material/Image";
import COBSImagePreviewDialog from "../../cobs/COBSImagePreviewDialog";
import { useApproveBirdsApprovalMutation } from "../../../features/api/approval/birdsApproval";
import "./BirdsApprovalModal.scss";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return "—";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const BirdsApprovalModal = ({ open, onClose, batchEntry = null, onApprove }) => {
  const [previewState, setPreviewState] = useState({
    open: false,
    images: [],
    index: 0,
  });

  const [approveBirdsApproval, { isLoading: isApproving }] =
    useApproveBirdsApprovalMutation();

  if (!batchEntry) return null;

  const allImages = batchEntry.responses
    ? batchEntry.responses
        .filter((r) => r.response !== null && r.response !== undefined)
        .flatMap((r) => r.images || [])
    : [];

  const totalAllocation = batchEntry.score_breakdown
    ? batchEntry.score_breakdown.reduce(
        (sum, s) => sum + (s.allocation ?? 0),
        0,
      )
    : 100;

  const scorePercent =
    totalAllocation > 0
      ? ((batchEntry.score / totalAllocation) * 100).toFixed(2)
      : "0.00";

  const openPreview = (imgs, idx) =>
    setPreviewState({ open: true, images: imgs, index: idx });
  const closePreview = () => setPreviewState((p) => ({ ...p, open: false }));

  const handleAcknowledge = () => {
    if (!batchEntry) return;
    approveBirdsApproval({
      batch_no: batchEntry.batch_no,
      approver_id: batchEntry.approver_id ?? 1,
      approvers: [
        {
          id: batchEntry.approver_id ?? 1,
          name: batchEntry.approver ?? "",
        },
      ],
    })
      .unwrap()
      .then(() => {
        onApprove?.(batchEntry);
      })
      .catch((err) => {
        console.error("Acknowledge failed:", err);
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
        PaperProps={{ className: "birdsam__paper" }}>
        <div className="birdsam__header">
          <div className="birdsam__header-title">
            <GppMaybeIcon className="birdsam__header-icon" />
            <span>Acknowledgement Details</span>
          </div>
          <span className="birdsam__batch-label">
            Batch #{batchEntry.batch_no} — {batchEntry.unit ?? "—"}
          </span>
          <IconButton size="small" className="birdsam__close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <DialogContent className="birdsam__content">
          <div className="birdsam__body">
            <div className="birdsam__left">
              <div className="birdsam__details-card">
                <p className="birdsam__details-title">Details</p>
                <div className="birdsam__detail-row">
                  <span className="birdsam__detail-label">Date:</span>
                  <span className="birdsam__detail-value birdsam__detail-value--accent">
                    {formatDate(batchEntry.start_at)}
                  </span>
                </div>
                <div className="birdsam__detail-row">
                  <span className="birdsam__detail-label">Time in:</span>
                  <span className="birdsam__detail-value birdsam__detail-value--accent">
                    {formatTime(batchEntry.start_at)}
                  </span>
                </div>
                <div className="birdsam__detail-row">
                  <span className="birdsam__detail-label">Time out:</span>
                  <span className="birdsam__detail-value birdsam__detail-value--accent">
                    {formatTime(batchEntry.end_at)}
                  </span>
                </div>
                <div className="birdsam__detail-row">
                  <span className="birdsam__detail-label">Unit:</span>
                  <span className="birdsam__detail-value birdsam__detail-value--accent">
                    {batchEntry.unit || "—"}
                  </span>
                </div>
                <div className="birdsam__detail-row">
                  <span className="birdsam__detail-label">QA Name:</span>
                  <span className="birdsam__detail-value birdsam__detail-value--accent">
                    {batchEntry.user || "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="birdsam__right">
              <div className="birdsam__section-card">
                <p className="birdsam__section-label">Remarks</p>
                <div className="birdsam__section-body">
                  {batchEntry.remarks ? (
                    <p className="birdsam__section-text">{batchEntry.remarks}</p>
                  ) : (
                    <span className="birdsam__empty">—</span>
                  )}
                </div>
              </div>

              <div className="birdsam__section-card">
                <p className="birdsam__section-label">Temporal Audit</p>
                <div className="birdsam__section-body">
                  <p className="birdsam__section-text">
                    {batchEntry.temporal_audit || "—"}
                  </p>
                </div>
              </div>

              <div className="birdsam__bottom-row">
                <div className="birdsam__section-card birdsam__score-card">
                  <p className="birdsam__section-label">Score Summary</p>
                  <div className="birdsam__section-body">
                    {batchEntry.score_breakdown &&
                      batchEntry.score_breakdown.map((s, i) => (
                        <div key={i} className="birdsam__score-row">
                          <span className="birdsam__score-category">
                            {s.category}
                          </span>
                          <span className="birdsam__score-value">
                            {s.score.toFixed(2)} / {s.allocation.toFixed(2)}{" "}
                            <span className="birdsam__score-pct">
                              ({s.percentage.toFixed(2)}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    <div className="birdsam__score-divider" />
                    <div className="birdsam__score-total-row">
                      <span className="birdsam__score-total-label">Total —</span>
                      <span className="birdsam__score-total-value">
                        {batchEntry.score}
                      </span>
                      <span className="birdsam__score-total-pct">
                        {scorePercent}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="birdsam__section-card birdsam__attach-card">
                  <p className="birdsam__section-label">Attachment</p>
                  <div className="birdsam__attach-body">
                    {allImages.length === 0 ? (
                      <div className="birdsam__attach-empty">
                        <ImageIcon className="birdsam__attach-icon" />
                        <span>No Photo Attachments</span>
                      </div>
                    ) : (
                      <div className="birdsam__attach-grid">
                        {allImages.map((url, i) => (
                          <Tooltip key={i} title="View image" placement="top">
                            <img
                              src={url}
                              alt={`attachment-${i}`}
                              className="birdsam__attach-thumb"
                              onClick={() => openPreview(allImages, i)}
                            />
                          </Tooltip>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
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
            onClick={handleAcknowledge}
            disabled={isApproving}
            className="birdsam__btn-approve">
            {isApproving ? "SUBMITTING…" : "ACKNOWLEDGE"}
          </Button>
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

export default BirdsApprovalModal;