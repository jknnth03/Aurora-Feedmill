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
import { useApprovePestsApprovalMutation } from "../../../features/api/approval/pestsApproval";
import "./PestsApprovalModal.scss";

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

const PestsApprovalModal = ({ open, onClose, batchEntry = null, onApprove }) => {
  const [previewState, setPreviewState] = useState({
    open: false,
    images: [],
    index: 0,
  });

  const [approvePestsApproval, { isLoading: isApproving }] =
    useApprovePestsApprovalMutation();

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
    approvePestsApproval({
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
        PaperProps={{ className: "pestsam__paper" }}>
        <div className="pestsam__header">
          <div className="pestsam__header-title">
            <GppMaybeIcon className="pestsam__header-icon" />
            <span>Acknowledgement Details</span>
          </div>
          <span className="pestsam__batch-label">
            Batch #{batchEntry.batch_no} — {batchEntry.unit ?? "—"}
          </span>
          <IconButton size="small" className="pestsam__close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <DialogContent className="pestsam__content">
          <div className="pestsam__body">
            <div className="pestsam__left">
              <div className="pestsam__details-card">
                <p className="pestsam__details-title">Details</p>
                <div className="pestsam__detail-row">
                  <span className="pestsam__detail-label">Date:</span>
                  <span className="pestsam__detail-value pestsam__detail-value--accent">
                    {formatDate(batchEntry.start_at)}
                  </span>
                </div>
                <div className="pestsam__detail-row">
                  <span className="pestsam__detail-label">Time in:</span>
                  <span className="pestsam__detail-value pestsam__detail-value--accent">
                    {formatTime(batchEntry.start_at)}
                  </span>
                </div>
                <div className="pestsam__detail-row">
                  <span className="pestsam__detail-label">Time out:</span>
                  <span className="pestsam__detail-value pestsam__detail-value--accent">
                    {formatTime(batchEntry.end_at)}
                  </span>
                </div>
                <div className="pestsam__detail-row">
                  <span className="pestsam__detail-label">Unit:</span>
                  <span className="pestsam__detail-value pestsam__detail-value--accent">
                    {batchEntry.unit || "—"}
                  </span>
                </div>
                <div className="pestsam__detail-row">
                  <span className="pestsam__detail-label">QA Name:</span>
                  <span className="pestsam__detail-value pestsam__detail-value--accent">
                    {batchEntry.user || "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pestsam__right">
              <div className="pestsam__section-card">
                <p className="pestsam__section-label">Remarks</p>
                <div className="pestsam__section-body">
                  {batchEntry.remarks ? (
                    <p className="pestsam__section-text">{batchEntry.remarks}</p>
                  ) : (
                    <span className="pestsam__empty">—</span>
                  )}
                </div>
              </div>

              <div className="pestsam__section-card">
                <p className="pestsam__section-label">Temporal Audit</p>
                <div className="pestsam__section-body">
                  <p className="pestsam__section-text">
                    {batchEntry.temporal_audit || "—"}
                  </p>
                </div>
              </div>

              <div className="pestsam__bottom-row">
                <div className="pestsam__section-card pestsam__score-card">
                  <p className="pestsam__section-label">Score Summary</p>
                  <div className="pestsam__section-body">
                    {batchEntry.score_breakdown &&
                      batchEntry.score_breakdown.map((s, i) => (
                        <div key={i} className="pestsam__score-row">
                          <span className="pestsam__score-category">
                            {s.category}
                          </span>
                          <span className="pestsam__score-value">
                            {s.score.toFixed(2)} / {s.allocation.toFixed(2)}{" "}
                            <span className="pestsam__score-pct">
                              ({s.percentage.toFixed(2)}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    <div className="pestsam__score-divider" />
                    <div className="pestsam__score-total-row">
                      <span className="pestsam__score-total-label">Total —</span>
                      <span className="pestsam__score-total-value">
                        {batchEntry.score}
                      </span>
                      <span className="pestsam__score-total-pct">
                        {scorePercent}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pestsam__section-card pestsam__attach-card">
                  <p className="pestsam__section-label">Attachment</p>
                  <div className="pestsam__attach-body">
                    {allImages.length === 0 ? (
                      <div className="pestsam__attach-empty">
                        <ImageIcon className="pestsam__attach-icon" />
                        <span>No Photo Attachments</span>
                      </div>
                    ) : (
                      <div className="pestsam__attach-grid">
                        {allImages.map((url, i) => (
                          <Tooltip key={i} title="View image" placement="top">
                            <img
                              src={url}
                              alt={`attachment-${i}`}
                              className="pestsam__attach-thumb"
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
            onClick={handleAcknowledge}
            disabled={isApproving}
            className="pestsam__btn-approve">
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

export default PestsApprovalModal;