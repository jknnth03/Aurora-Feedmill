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
import ChecklistIcon from "@mui/icons-material/Checklist";
import COBSApprovalImagePreviewDialog from "./COBSApprovalImagePreviewDialog";
import ConfirmDialog from "../../../reusable-components/comfirm-dialog/ConfirmDialog";
import COBSStartCheckingDialog from "../../cobs/COBSStartCheckingDialog";
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

const getMonthYearFromEntry = (entry) => {
  const raw = entry?.start_at;
  if (!raw) return { month: undefined, year: undefined };
  const d = new Date(raw);
  if (isNaN(d)) return { month: undefined, year: undefined };
  return { month: d.getMonth() + 1, year: d.getFullYear() };
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

const COBSApprovalModal = ({ open, onClose, batchEntry = null, onApprove }) => {
  const [previewState, setPreviewState] = useState({
    open: false,
    images: [],
    index: 0,
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [signaturePreviewOpen, setSignaturePreviewOpen] = useState(false);
  const [viewChecklistOpen, setViewChecklistOpen] = useState(false);
  const [isAcknowledging, setIsAcknowledging] = useState(false);

  const [approveCobApproval, { isLoading: isApproving }] =
    useApproveCobApprovalMutation();

  useEffect(() => {
    if (!open) {
      setIsAcknowledging(false);
    }
  }, [open]);

  if (!batchEntry) return null;

  const isBusy = isApproving || isAcknowledging;

  const signatureDataUrl = batchEntry.signatory_1?.evaluate_image ?? null;
  const signatoryName = batchEntry.signatory_1?.name ?? null;

  const signatory2 = batchEntry.signatory_2 ?? null;
  const signatory3 = batchEntry.signatory_3 ?? null;

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
    setIsAcknowledging(true);
    setConfirmDialogOpen(false);

    const loggedInUser = getLoggedInUser();
    console.log("loggedInUser:", loggedInUser);
    console.log("signature present:", Boolean(loggedInUser?.signature));
    const approverId = batchEntry.approver_id ?? loggedInUser?.id ?? 1;
    const approverName =
      batchEntry.approver ??
      `${loggedInUser?.first_name ?? ""} ${loggedInUser?.last_name ?? ""}`.trim();
    const signatureFile = dataUrlToFile(
      loggedInUser?.signature,
      `signature-${approverId}`,
    );
    console.log("signatureFile:", signatureFile);

    approveCobApproval({
      batch_no: batchEntry.batch_no,
      approver_id: approverId,
      approvers: [{ id: approverId, name: approverName }],
      signatureFile,
    })
      .unwrap()
      .then(() => {
        onApprove?.(batchEntry);
      })
      .catch((err) => {
        console.error("Acknowledge failed:", err);
        setIsAcknowledging(false);
      });
  };

  const handleImageClick = (index) => {
    openPreview(allImages, index);
  };

  const handleClose = () => {
    if (isBusy) return;
    onClose();
  };

  const hasSignature = !!signatureDataUrl;
  const hasSignatories = signatory2 || signatory3 || hasSignature;

  const { month: checklistMonth, year: checklistYear } =
    getMonthYearFromEntry(batchEntry);

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (reason === "backdropClick") return;
          handleClose();
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
          <IconButton
            size="small"
            className="cobsam__close"
            onClick={handleClose}
            disabled={isBusy}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <DialogContent className="cobsam__content">
          {isAcknowledging ? (
            <div className="cobsam__skeleton-wrap">
              <div className="cobsam__skeleton-block cobsam__skeleton-block--details" />
              <div className="cobsam__skeleton-block cobsam__skeleton-block--sm" />
              <div className="cobsam__skeleton-block cobsam__skeleton-block--sm" />
              <div className="cobsam__skeleton-block cobsam__skeleton-block--sm" />
              <div className="cobsam__skeleton-row-group">
                <div className="cobsam__skeleton-block cobsam__skeleton-block--half" />
                <div className="cobsam__skeleton-block cobsam__skeleton-block--half" />
              </div>
              <div className="cobsam__skeleton-block cobsam__skeleton-block--signature" />
            </div>
          ) : (
            <>
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
                      <p className="cobsam__section-text">
                        {batchEntry.remarks}
                      </p>
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
                        <span className="cobsam__score-total-label">
                          Total —
                        </span>
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
                      <span className="cobsam__signatory-label">
                        Reviewed by:
                      </span>
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
            </>
          )}
        </DialogContent>

        <DialogActions className="cobsam__footer">
          <Button
            variant="text"
            onClick={handleClose}
            disabled={isBusy}
            className="cobsam__btn-close">
            CLOSE
          </Button>
          <div className="cobsam__footer-right">
            <Button
              variant="outlined"
              startIcon={<ChecklistIcon sx={{ fontSize: 16 }} />}
              onClick={() => setViewChecklistOpen(true)}
              disabled={isBusy}
              className="cobsam__btn-view-checklist">
              VIEW CHECKLIST
            </Button>
            <Button
              variant="contained"
              startIcon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
              onClick={() => setConfirmDialogOpen(true)}
              disabled={isBusy}
              className="cobsam__btn-approve">
              {isBusy ? "SUBMITTING…" : "ACKNOWLEDGE"}
            </Button>
          </div>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleAcknowledge}
        title="Acknowledge this batch?"
        message={`You are about to acknowledge Batch #${batchEntry.batch_no} — ${batchEntry.unit ?? "—"}. This action cannot be undone.`}
        confirmLabel="ACKNOWLEDGE"
        cancelLabel="Cancel"
        isLoading={isBusy}
        confirmVariant="primary"
      />

      <COBSStartCheckingDialog
        open={viewChecklistOpen}
        onClose={() => setViewChecklistOpen(false)}
        viewMode
        batchEntry={batchEntry}
        unitName={batchEntry?.unit}
        week={batchEntry?.week}
        month={checklistMonth}
        year={checklistYear}
        checklistId={batchEntry?.checklist_id ?? 1}
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
