import { useState } from "react";
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
import PrintIcon from "@mui/icons-material/Print";
import ImageIcon from "@mui/icons-material/Image";
import DrawIcon from "@mui/icons-material/Draw";
import COBSImagePreviewDialog from "./COBSImagePreviewDialog";
import "./COBSShowReportDialog.scss";

const COBSShowReportDialog = ({ open, onClose, reportData }) => {
  const [downloadType, setDownloadType] = useState("PDF");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);

  if (!reportData) return null;

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

  const totalAllocation = reportData.score_breakdown
    ? reportData.score_breakdown.reduce(
        (sum, s) => sum + (s.allocation ?? 0),
        0,
      )
    : 100;

  const scorePercent =
    totalAllocation > 0
      ? ((reportData.score / totalAllocation) * 100).toFixed(2)
      : "0.00";

  const handleDownload = () => {
    console.log("Download as:", downloadType);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAddSignature = () => {
    console.log("Add signature clicked");
  };

  const handleImageClick = (index) => {
    setPreviewIndex(index);
    setPreviewOpen(true);
  };

  const allImages = reportData.responses
    ? reportData.responses.flatMap((r) => r.images || [])
    : [];

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        className="cobs-sr"
        PaperProps={{ className: "cobs-sr__paper" }}>
        <div className="cobs-sr__header">
          <div className="cobs-sr__header-left">
            <AssessmentIcon className="cobs-sr__header-icon" />
            <span className="cobs-sr__header-title">Report Summary</span>
          </div>
          <IconButton size="small" className="cobs-sr__close" onClick={onClose}>
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
                    {formatDate(reportData.start_at)}
                  </span>
                </div>
                <div className="cobs-sr__detail-row">
                  <span className="cobs-sr__detail-label">Time in:</span>
                  <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                    {formatTime(reportData.start_at)}
                  </span>
                </div>
                <div className="cobs-sr__detail-row">
                  <span className="cobs-sr__detail-label">Time out:</span>
                  <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                    {formatTime(reportData.end_at)}
                  </span>
                </div>
                <div className="cobs-sr__detail-row">
                  <span className="cobs-sr__detail-label">Unit:</span>
                  <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                    {reportData.unit || "—"}
                  </span>
                </div>
                <div className="cobs-sr__detail-row">
                  <span className="cobs-sr__detail-label">QA Name:</span>
                  <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                    {reportData.user || "—"}
                  </span>
                </div>
              </div>

              <div className="cobs-sr__signed-card">
                <p className="cobs-sr__signed-title">Signed by</p>
                <button
                  className="cobs-sr__btn-add-signature"
                  onClick={handleAddSignature}>
                  <DrawIcon style={{ fontSize: 16 }} />
                  Add Signature
                </button>
              </div>
            </div>

            <div className="cobs-sr__right">
              <div className="cobs-sr__section-card">
                <p className="cobs-sr__section-label">Remarks</p>
                <div className="cobs-sr__section-body">
                  {reportData.remarks ? (
                    <p className="cobs-sr__section-text">
                      {reportData.remarks}
                    </p>
                  ) : (
                    <span className="cobs-sr__empty">—</span>
                  )}
                </div>
              </div>

              <div className="cobs-sr__section-card">
                <p className="cobs-sr__section-label">Temporal Audit</p>
                <div className="cobs-sr__section-body">
                  <p className="cobs-sr__section-text">
                    {reportData.temporal_audit || "—"}
                  </p>
                </div>
              </div>

              <div className="cobs-sr__bottom-row">
                <div className="cobs-sr__section-card cobs-sr__score-card">
                  <p className="cobs-sr__section-label">Score Summary</p>
                  <div className="cobs-sr__section-body">
                    {reportData.score_breakdown &&
                      reportData.score_breakdown.map((s, i) => (
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
                        {reportData.score}
                      </span>
                      <span className="cobs-sr__score-total-pct">
                        {scorePercent}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="cobs-sr__section-card cobs-sr__attach-card">
                  <p className="cobs-sr__section-label">Attachment</p>
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
                              style={{ cursor: "pointer" }}
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
          <button className="cobs-sr__btn-close" onClick={onClose}>
            Close
          </button>
        </DialogActions>
      </Dialog>

      <COBSImagePreviewDialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        images={allImages}
        initialIndex={previewIndex}
      />
    </>
  );
};

export default COBSShowReportDialog;
