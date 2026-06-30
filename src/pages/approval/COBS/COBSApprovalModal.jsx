import { useState, useEffect } from "react";
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
import DrawIcon from "@mui/icons-material/Draw";
import COBSApprovalImagePreviewDialog from "./COBSApprovalImagePreviewDialog";
import COBSSignatureDialog from "./COBSSignatureDialog";
import { useApproveCobApprovalMutation } from "../../../features/api/approval/cobsApproval";
import "./COBSApprovalModal.scss";

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

const COBSApprovalModal = ({ open, onClose, batchEntry = null, onApprove }) => {
  const [previewState, setPreviewState] = useState({
    open: false,
    images: [],
    index: 0,
  });
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false);
  const [signaturePreviewOpen, setSignaturePreviewOpen] = useState(false);
  const [localSignatureDataUrl, setLocalSignatureDataUrl] = useState(null);
  const [localSignatoryName, setLocalSignatoryName] = useState(null);

  const [approveCobApproval, { isLoading: isApproving }] =
    useApproveCobApprovalMutation();

  useEffect(() => {
    if (open && batchEntry) {
      setLocalSignatureDataUrl(null);
      setLocalSignatoryName(null);
    }
    if (!open) {
      setLocalSignatureDataUrl(null);
      setLocalSignatoryName(null);
    }
  }, [open]);

  if (!batchEntry) return null;

  const signatureRecordUrls = batchEntry.responses
    ? batchEntry.responses
        .filter((r) => r.response === null || r.response === undefined)
        .flatMap((r) => r.images || [])
    : [];

  const signatureFromServer =
    batchEntry.signatory_1?.evaluate_image ?? signatureRecordUrls[0] ?? null;
  const signatureDataUrl = localSignatureDataUrl ?? signatureFromServer ?? null;
  const signatoryName =
    localSignatoryName ?? batchEntry.signatory_1?.name ?? null;

  const signatory2 = batchEntry.signatory_2 ?? null;
  const signatory3 = batchEntry.signatory_3 ?? null;

  const allImages = batchEntry.responses
    ? batchEntry.responses
        .filter((r) => r.response !== null && r.response !== undefined)
        .flatMap((r) => r.images || [])
        .filter((url) => !signatureRecordUrls.includes(url))
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

  const handleAcknowledge = ({ blob }) => {
    if (!batchEntry || !blob) return;
    const signatureFile = new File([blob], "signature.png", {
      type: "image/png",
    });
    approveCobApproval({
      batch_no: batchEntry.batch_no,
      approver_id: batchEntry.approver_id ?? 1,
      approvers: [
        {
          id: batchEntry.approver_id ?? 1,
          name: batchEntry.approver ?? "",
        },
      ],
      signatureFile,
    })
      .unwrap()
      .then(() => {
        onApprove?.(batchEntry);
      })
      .catch((err) => {
        console.error("Acknowledge failed:", err);
      });
  };

  const handleImageClick = (index) => {
    openPreview(allImages, index);
  };

  const hasSignature = !!signatureDataUrl;
  const hasSignatories = signatory2 || signatory3 || hasSignature;

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
            <span>Acknowledgement Details</span>
          </div>
          <span className="cobsam__batch-label">
            Batch #{batchEntry.batch_no} — {batchEntry.unit ?? "—"}
          </span>
          <IconButton size="small" className="cobsam__close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <DialogContent className="cobsam__content">
          <div className="cobsam__body">
            <div className="cobsam__details-card">
              <p className="cobsam__details-title">Details</p>
              <div className="cobsam__details-grid">
                <div className="cobsam__details-col">
                  <div className="cobsam__detail-row">
                    <span className="cobsam__detail-label">Date:</span>
                    <span className="cobsam__detail-value cobsam__detail-value--accent">
                      {formatDate(batchEntry.start_at)}
                    </span>
                  </div>
                  <div className="cobsam__detail-row">
                    <span className="cobsam__detail-label">Time in:</span>
                    <span className="cobsam__detail-value cobsam__detail-value--accent">
                      {formatTime(batchEntry.start_at)}
                    </span>
                  </div>
                </div>
                <div className="cobsam__details-col">
                  <div className="cobsam__detail-row">
                    <span className="cobsam__detail-label">Time out:</span>
                    <span className="cobsam__detail-value cobsam__detail-value--accent">
                      {formatTime(batchEntry.end_at)}
                    </span>
                  </div>
                  <div className="cobsam__detail-row">
                    <span className="cobsam__detail-label">Unit:</span>
                    <span className="cobsam__detail-value cobsam__detail-value--accent">
                      {batchEntry.unit || "—"}
                    </span>
                  </div>
                </div>
                <div className="cobsam__details-col">
                  <div className="cobsam__detail-row">
                    <span className="cobsam__detail-label">QA Name:</span>
                    <span className="cobsam__detail-value cobsam__detail-value--accent">
                      {batchEntry.user || "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="cobsam__section-card">
              <p className="cobsam__section-label">Good Points</p>
              <div className="cobsam__section-body">
                {batchEntry.good_points ? (
                  <p className="cobsam__section-text">
                    {batchEntry.good_points}
                  </p>
                ) : (
                  <span className="cobsam__empty">—</span>
                )}
              </div>
            </div>

            <div className="cobsam__section-card">
              <p className="cobsam__section-label">Remarks</p>
              <div className="cobsam__section-body">
                {batchEntry.remarks ? (
                  <p className="cobsam__section-text">{batchEntry.remarks}</p>
                ) : (
                  <span className="cobsam__empty">—</span>
                )}
              </div>
            </div>

            <div className="cobsam__section-card">
              <p className="cobsam__section-label">Temporal Audit</p>
              <div className="cobsam__section-body">
                <p className="cobsam__section-text">
                  {batchEntry.temporal_audit || "—"}
                </p>
              </div>
            </div>

            <div className="cobsam__bottom-row">
              <div className="cobsam__section-card cobsam__score-card">
                <p className="cobsam__section-label">Score Summary</p>
                <div className="cobsam__section-body">
                  {batchEntry.score_breakdown &&
                    batchEntry.score_breakdown.map((s, i) => (
                      <div key={i} className="cobsam__score-row">
                        <span className="cobsam__score-category">
                          {s.category}
                        </span>
                        <span className="cobsam__score-value">
                          {s.score.toFixed(2)} / {s.allocation.toFixed(2)}{" "}
                          <span className="cobsam__score-pct">
                            ({s.percentage.toFixed(2)}%)
                          </span>
                        </span>
                      </div>
                    ))}
                  <div className="cobsam__score-divider" />
                  <div className="cobsam__score-total-row">
                    <span className="cobsam__score-total-label">Total —</span>
                    <span className="cobsam__score-total-value">
                      {batchEntry.score}
                    </span>
                    <span className="cobsam__score-total-pct">
                      {scorePercent}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="cobsam__section-card cobsam__attach-card">
                <p className="cobsam__section-label">Attachment</p>
                <div className="cobsam__attach-body">
                  {allImages.length === 0 ? (
                    <div className="cobsam__attach-empty">
                      <ImageIcon className="cobsam__attach-icon" />
                      <span>No Photo Attachments</span>
                    </div>
                  ) : (
                    <div className="cobsam__attach-grid">
                      {allImages.map((url, i) => (
                        <Tooltip key={i} title="View image" placement="top">
                          <img
                            src={url}
                            alt={`attachment-${i}`}
                            className="cobsam__attach-thumb"
                            onClick={() => handleImageClick(i)}
                          />
                        </Tooltip>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {!hasSignature && (
              <div className="cobsam__section-card">
                <p className="cobsam__section-label">Acknowledge by</p>
                <div className="cobsam__section-body">
                  <button
                    className="cobsam__btn-add-signature"
                    onClick={() => setSignatureDialogOpen(true)}
                    disabled={isApproving}>
                    <DrawIcon style={{ fontSize: 16 }} />
                    {isApproving ? "Saving..." : "Add Signature"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {hasSignatories && (
            <div className="cobsam__signatories-row">
              {hasSignature && (
                <div className="cobsam__signatory-item">
                  <span className="cobsam__signatory-label">
                    Acknowledged by:
                  </span>
                  <Tooltip title="View signature" placement="top">
                    <div
                      className="cobsam__signatory-img-box cobsam__signatory-img-box--clickable"
                      onClick={() => setSignaturePreviewOpen(true)}>
                      <img
                        src={signatureDataUrl}
                        alt="acknowledged-by"
                        className="cobsam__signatory-img"
                      />
                    </div>
                  </Tooltip>
                  {signatoryName && (
                    <span className="cobsam__signatory-name">
                      {signatoryName}
                    </span>
                  )}
                </div>
              )}
              {signatory2 && (
                <div className="cobsam__signatory-item">
                  <span className="cobsam__signatory-label">Reviewed by:</span>
                  {signatory2.approve_image ? (
                    <div className="cobsam__signatory-img-box">
                      <img
                        src={signatory2.approve_image}
                        alt="reviewed-by"
                        className="cobsam__signatory-img"
                      />
                    </div>
                  ) : (
                    <div className="cobsam__signatory-img-box cobsam__signatory-img-box--empty" />
                  )}
                  {signatory2.name && (
                    <span className="cobsam__signatory-name">
                      {signatory2.name}
                    </span>
                  )}
                </div>
              )}
              {signatory3 && (
                <div className="cobsam__signatory-item">
                  <span className="cobsam__signatory-label">Noted by:</span>
                  {signatory3.assess_image ? (
                    <div className="cobsam__signatory-img-box">
                      <img
                        src={signatory3.assess_image}
                        alt="noted-by"
                        className="cobsam__signatory-img"
                      />
                    </div>
                  ) : (
                    <div className="cobsam__signatory-img-box cobsam__signatory-img-box--empty" />
                  )}
                  {signatory3.name && (
                    <span className="cobsam__signatory-name">
                      {signatory3.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>

        <DialogActions className="cobsam__footer">
          <Button
            variant="text"
            onClick={onClose}
            disabled={isApproving}
            className="cobsam__btn-close">
            CLOSE
          </Button>
          {!hasSignature && (
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
              onClick={() => setSignatureDialogOpen(true)}
              disabled={isApproving}
              className="cobsam__btn-approve">
              {isApproving ? "SUBMITTING…" : "ACKNOWLEDGE"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <COBSSignatureDialog
        open={signatureDialogOpen}
        onClose={() => setSignatureDialogOpen(false)}
        onSubmit={({ blob, dataUrl, selectedEvaluator }) => {
          setSignatureDialogOpen(false);
          setLocalSignatureDataUrl(dataUrl);
          setLocalSignatoryName(
            selectedEvaluator?.full_name ?? batchEntry?.approver ?? "",
          );
          handleAcknowledge({ blob });
        }}
        signerName={batchEntry?.approver ?? ""}
        isSubmitting={isApproving}
      />

      <COBSApprovalImagePreviewDialog
        open={previewState.open}
        onClose={closePreview}
        images={previewState.images}
        initialIndex={previewState.index}
      />

      <Dialog
        open={signaturePreviewOpen}
        onClose={() => setSignaturePreviewOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: "cobsam__sig-preview-paper" }}>
        <div className="cobsam__sig-preview-header">
          <div className="cobsam__sig-preview-header-left">
            <DrawIcon className="cobsam__sig-preview-header-icon" />
            <span className="cobsam__sig-preview-title">Signature</span>
          </div>
          <IconButton
            size="small"
            className="cobsam__sig-preview-close"
            onClick={() => setSignaturePreviewOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
        <div className="cobsam__sig-preview-body">
          <div className="cobsam__sig-preview-frame">
            {signatureDataUrl && (
              <img
                src={signatureDataUrl}
                alt="signature-preview"
                className="cobsam__sig-preview-img"
              />
            )}
          </div>
          {signatoryName && (
            <div className="cobsam__sig-preview-footer">
              <span className="cobsam__sig-preview-name">{signatoryName}</span>
              <span className="cobsam__sig-preview-role">Acknowledged by</span>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default COBSApprovalModal;
