import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import AssessmentIcon from "@mui/icons-material/Assessment";
import DownloadIcon from "@mui/icons-material/Download";
import DownloadingIcon from "@mui/icons-material/Downloading";
import PrintIcon from "@mui/icons-material/Print";
import ImageIcon from "@mui/icons-material/Image";
import DrawIcon from "@mui/icons-material/Draw";
import GestureIcon from "@mui/icons-material/Gesture";
import COBSImagePreviewDialog from "./COBSImagePreviewDialog";
import COBSSignatureDialog from "./COBSSignatureDialog";
import { useEvaluateResponseMutation } from "../../features/api/cobs/cobsApi";
import "./COBSShowReportDialog.scss";

const downloadImageViaCanvas = (url, filename) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("Canvas toBlob failed"));
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
          document.body.removeChild(a);
          URL.revokeObjectURL(objectUrl);
          resolve();
        }, 300);
      }, "image/png");
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url + (url.includes("?") ? "&" : "?") + "t=" + Date.now();
  });

const COBSShowReportDialog = ({ open, onClose, reportData, onRefetch }) => {
  const [downloadType, setDownloadType] = useState("PDF");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [signatureOpen, setSignatureOpen] = useState(false);
  const [signaturePreviewOpen, setSignaturePreviewOpen] = useState(false);
  const [frozenData, setFrozenData] = useState(null);
  const [localSignatureDataUrl, setLocalSignatureDataUrl] = useState(null);
  const [localSignatoryName, setLocalSignatoryName] = useState(null);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveProgress, setSaveProgress] = useState({ current: 0, total: 0 });

  const [evaluateResponse, { isLoading: isSubmitting }] =
    useEvaluateResponseMutation();

  useEffect(() => {
    if (open && reportData) {
      setFrozenData(reportData);
      setLocalSignatureDataUrl(null);
      setLocalSignatoryName(null);
    }
    if (!open) {
      setFrozenData(null);
      setLocalSignatureDataUrl(null);
      setLocalSignatoryName(null);
    }
  }, [open]);

  const data = frozenData;
  if (!data) return null;

  const signatureRecordUrls = data.responses
    ? data.responses
        .filter((r) => r.response === null || r.response === undefined)
        .flatMap((r) => r.images || [])
    : [];

  const signatureFromServer =
    data.signatory_1?.evaluate_image ?? signatureRecordUrls[0] ?? null;

  const signatureDataUrl = localSignatureDataUrl ?? signatureFromServer ?? null;
  const signatoryName = localSignatoryName ?? data.signatory_1?.name ?? null;

  const signatory2 = data.signatory_2 ?? null;
  const signatory3 = data.signatory_3 ?? null;

  const allImages = data.responses
    ? data.responses
        .filter((r) => r.response !== null && r.response !== undefined)
        .flatMap((r) => r.images || [])
        .filter((url) => !signatureRecordUrls.includes(url))
    : [];

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const totalAllocation = data.score_breakdown
    ? data.score_breakdown.reduce((sum, s) => sum + (s.allocation ?? 0), 0)
    : 100;

  const scorePercent =
    totalAllocation > 0
      ? ((data.score / totalAllocation) * 100).toFixed(2)
      : "0.00";

  const handleDownload = () => {
    console.log("Download as:", downloadType);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSaveAll = async () => {
    if (isSavingAll || allImages.length === 0) return;
    setIsSavingAll(true);
    setSaveProgress({ current: 0, total: allImages.length });

    for (let i = 0; i < allImages.length; i++) {
      setSaveProgress({ current: i + 1, total: allImages.length });
      try {
        await downloadImageViaCanvas(allImages[i], `attachment-${i + 1}.png`);
        if (i < allImages.length - 1) {
          await new Promise((res) => setTimeout(res, 1200));
        }
      } catch {
        console.error(`Failed to download image ${i + 1}`);
      }
    }

    setIsSavingAll(false);
    setSaveProgress({ current: 0, total: 0 });
  };

  const handleSignatureSubmit = async ({
    dataUrl,
    blob,
    selectedEvaluator,
    selectedApprover,
    selectedAssessor,
  }) => {
    setLocalSignatureDataUrl(dataUrl);
    setLocalSignatoryName(selectedEvaluator?.full_name ?? "");

    const formData = new FormData();
    formData.append("batch_no", data.batch_no ?? "");
    formData.append("evaluator_id", selectedEvaluator?.id ?? "");
    formData.append("approver_id", selectedApprover?.id ?? "");
    formData.append("assessor_id", selectedAssessor?.id ?? "");
    formData.append(
      "evaluate[0]",
      JSON.stringify({
        id: selectedEvaluator?.id ?? "",
        name: selectedEvaluator?.full_name ?? "",
      }),
    );
    formData.append("evaluate_image[0]", blob, "signature.png");

    try {
      const result = await evaluateResponse(formData).unwrap();
      const returnedUrl =
        result?.signature_url ??
        result?.evaluate_image?.[0] ??
        result?.image_url ??
        null;
      if (returnedUrl) {
        setLocalSignatureDataUrl(returnedUrl);
      }
      onRefetch?.();
    } catch (err) {
      console.error("[COBSShowReportDialog] evaluateResponse ERROR", err);
      setLocalSignatureDataUrl(null);
      setLocalSignatoryName(null);
    } finally {
      setSignatureOpen(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const handleImageClick = (index) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        className="cobs-sr"
        PaperProps={{ className: "cobs-sr__paper" }}>
        <div className="cobs-sr__header">
          <div className="cobs-sr__header-left">
            <AssessmentIcon className="cobs-sr__header-icon" />
            <span className="cobs-sr__header-title">Report Summary</span>
          </div>
          <IconButton
            size="small"
            className="cobs-sr__close"
            onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        <DialogContent className="cobs-sr__content">
          <div className="cobs-sr__body">
            <div className="cobs-sr__left">
              <div className="cobs-sr__details-card">
                <p className="cobs-sr__details-title">Details</p>
                <div className="cobs-sr__detail-row">
                  <span className="cobs-sr__detail-label">Date:</span>
                  <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                    {formatDate(data.start_at)}
                  </span>
                </div>
                <div className="cobs-sr__detail-row">
                  <span className="cobs-sr__detail-label">Time in:</span>
                  <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                    {formatTime(data.start_at)}
                  </span>
                </div>
                <div className="cobs-sr__detail-row">
                  <span className="cobs-sr__detail-label">Time out:</span>
                  <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                    {formatTime(data.end_at)}
                  </span>
                </div>
                <div className="cobs-sr__detail-row">
                  <span className="cobs-sr__detail-label">Unit:</span>
                  <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                    {data.unit || "—"}
                  </span>
                </div>
                <div className="cobs-sr__detail-row">
                  <span className="cobs-sr__detail-label">QA Name:</span>
                  <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                    {data.user || "—"}
                  </span>
                </div>
              </div>

              <div className="cobs-sr__signed-card">
                <p className="cobs-sr__signed-title">Acknowledge by</p>
                {signatureDataUrl ? (
                  <>
                    <Tooltip title="View signature" placement="top">
                      <div
                        className="cobs-sr__signature-box cobs-sr__signature-box--clickable"
                        onClick={() => setSignaturePreviewOpen(true)}>
                        <img
                          src={signatureDataUrl}
                          alt="signature"
                          className="cobs-sr__signature-img"
                        />
                      </div>
                    </Tooltip>
                    {signatoryName && (
                      <p className="cobs-sr__signee-name">{signatoryName}</p>
                    )}
                  </>
                ) : (
                  <button
                    className="cobs-sr__btn-add-signature"
                    onClick={() => setSignatureOpen(true)}
                    disabled={isSubmitting}>
                    <DrawIcon style={{ fontSize: 16 }} />
                    {isSubmitting ? "Saving..." : "Add Signature"}
                  </button>
                )}
              </div>
            </div>

            <div className="cobs-sr__right">
              <div className="cobs-sr__section-card">
                <p className="cobs-sr__section-label">Remarks</p>
                <div className="cobs-sr__section-body">
                  {data.remarks ? (
                    <p className="cobs-sr__section-text">{data.remarks}</p>
                  ) : (
                    <span className="cobs-sr__empty">—</span>
                  )}
                </div>
              </div>

              <div className="cobs-sr__section-card">
                <p className="cobs-sr__section-label">Temporal Audit</p>
                <div className="cobs-sr__section-body">
                  <p className="cobs-sr__section-text">
                    {data.temporal_audit || "—"}
                  </p>
                </div>
              </div>

              <div className="cobs-sr__bottom-row">
                <div className="cobs-sr__section-card cobs-sr__score-card">
                  <p className="cobs-sr__section-label">Score Summary</p>
                  <div className="cobs-sr__section-body">
                    {data.score_breakdown &&
                      data.score_breakdown.map((s, i) => (
                        <div key={i} className="cobs-sr__score-row">
                          <span className="cobs-sr__score-category">
                            {s.category}
                          </span>
                          <span className="cobs-sr__score-value">
                            {s.score.toFixed(2)} / {s.allocation.toFixed(2)}{" "}
                            <span className="cobs-sr__score-pct">
                              ({s.percentage.toFixed(2)}%)
                            </span>
                          </span>
                        </div>
                      ))}
                    <div className="cobs-sr__score-divider" />
                    <div className="cobs-sr__score-total-row">
                      <span className="cobs-sr__score-total-label">
                        Total —
                      </span>
                      <span className="cobs-sr__score-total-value">
                        {data.score}
                      </span>
                      <span className="cobs-sr__score-total-pct">
                        {scorePercent}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="cobs-sr__section-card cobs-sr__attach-card">
                  <div className="cobs-sr__attach-header">
                    <p className="cobs-sr__section-label">Attachment</p>
                    {allImages.length > 0 && (
                      <Tooltip
                        title={
                          isSavingAll
                            ? `Downloading ${saveProgress.current} of ${saveProgress.total}...`
                            : `Download all ${allImages.length} images`
                        }
                        placement="top">
                        <button
                          className={`cobs-sr__save-all-btn${isSavingAll ? " cobs-sr__save-all-btn--loading" : ""}`}
                          onClick={handleSaveAll}
                          disabled={isSavingAll}>
                          {isSavingAll ? (
                            <>
                              <DownloadingIcon style={{ fontSize: 13 }} />
                              {saveProgress.current}/{saveProgress.total}
                            </>
                          ) : (
                            <>
                              <DownloadIcon style={{ fontSize: 13 }} />
                              Save All
                            </>
                          )}
                        </button>
                      </Tooltip>
                    )}
                  </div>
                  <div className="cobs-sr__attach-body">
                    {allImages.length === 0 ? (
                      <div className="cobs-sr__attach-empty">
                        <ImageIcon className="cobs-sr__attach-icon" />
                        <span>No Photo Attachments</span>
                      </div>
                    ) : (
                      <div className="cobs-sr__attach-grid">
                        {allImages.map((url, i) => (
                          <Tooltip key={i} title="View image" placement="top">
                            <img
                              src={url}
                              alt={`attachment-${i}`}
                              className="cobs-sr__attach-thumb"
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
          </div>

          {(signatory2 || signatory3) && (
            <div className="cobs-sr__signatories-row">
              {signatory2 && (
                <div className="cobs-sr__signatory-item">
                  <span className="cobs-sr__signatory-label">Reviewed by:</span>
                  {signatory2.approve_image ? (
                    <div className="cobs-sr__signatory-img-box">
                      <img
                        src={signatory2.approve_image}
                        alt="reviewed-by"
                        className="cobs-sr__signatory-img"
                      />
                    </div>
                  ) : (
                    <div className="cobs-sr__signatory-img-box cobs-sr__signatory-img-box--empty" />
                  )}
                  {signatory2.name && (
                    <span className="cobs-sr__signatory-name">
                      {signatory2.name}
                    </span>
                  )}
                </div>
              )}
              {signatory3 && (
                <div className="cobs-sr__signatory-item">
                  <span className="cobs-sr__signatory-label">Noted by:</span>
                  {signatory3.assess_image ? (
                    <div className="cobs-sr__signatory-img-box">
                      <img
                        src={signatory3.assess_image}
                        alt="noted-by"
                        className="cobs-sr__signatory-img"
                      />
                    </div>
                  ) : (
                    <div className="cobs-sr__signatory-img-box cobs-sr__signatory-img-box--empty" />
                  )}
                  {signatory3.name && (
                    <span className="cobs-sr__signatory-name">
                      {signatory3.name}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>

        <DialogActions className="cobs-sr__footer">
          <div className="cobs-sr__footer-left">
            <FormControl size="small" className="cobs-sr__download-select">
              <Select
                value={downloadType}
                onChange={(e) => setDownloadType(e.target.value)}
                className="cobs-sr__select"
                MenuProps={{
                  PaperProps: { className: "cobs-sr__select-menu" },
                }}>
                <MenuItem value="PDF">PDF</MenuItem>
                <MenuItem value="Excel">Excel</MenuItem>
              </Select>
            </FormControl>
            <IconButton
              className="cobs-sr__btn-download"
              onClick={handleDownload}
              size="small">
              <DownloadIcon fontSize="small" />
            </IconButton>
            <button className="cobs-sr__btn-print" onClick={handlePrint}>
              <PrintIcon fontSize="small" />
              PRINT
            </button>
          </div>
          <button className="cobs-sr__btn-close" onClick={handleClose}>
            Close
          </button>
        </DialogActions>
      </Dialog>

      <COBSSignatureDialog
        open={signatureOpen}
        onClose={() => setSignatureOpen(false)}
        onSubmit={handleSignatureSubmit}
        isSubmitting={isSubmitting}
      />

      <COBSImagePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        images={allImages}
        initialIndex={previewIndex}
      />

      <Dialog
        open={signaturePreviewOpen}
        onClose={() => setSignaturePreviewOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ className: "cobs-sr__sig-preview-paper" }}>
        <div className="cobs-sr__sig-preview-header">
          <div className="cobs-sr__sig-preview-header-left">
            <GestureIcon className="cobs-sr__sig-preview-header-icon" />
            <span className="cobs-sr__sig-preview-title">Signature</span>
          </div>
          <IconButton
            size="small"
            className="cobs-sr__sig-preview-close"
            onClick={() => setSignaturePreviewOpen(false)}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
        <div className="cobs-sr__sig-preview-body">
          <div className="cobs-sr__sig-preview-frame">
            {signatureDataUrl && (
              <img
                src={signatureDataUrl}
                alt="signature-preview"
                className="cobs-sr__sig-preview-img"
              />
            )}
          </div>
          {signatoryName && (
            <div className="cobs-sr__sig-preview-footer">
              <span className="cobs-sr__sig-preview-name">{signatoryName}</span>
              <span className="cobs-sr__sig-preview-role">Acknowledged by</span>
            </div>
          )}
        </div>
      </Dialog>
    </>
  );
};

export default COBSShowReportDialog;
