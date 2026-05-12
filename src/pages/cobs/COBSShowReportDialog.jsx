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
import "./COBSShowReportDialog.scss";

// ─── Static mock data (replace with API later) ───────────────────────────────
const MOCK_REPORT = {
  date: "May 11, 2026",
  time_in: "09:39 AM",
  time_out: "09:40 AM",
  time_summary: "1 minute",
  area: "AREA 1",
  staff_on_duty: ["MARQUEZ JK", "SAM BUENAVENTURA"],
  qa_name: "SUPER ADMIN",
  signed_by: {
    name: "MARQUEZ JK",
    signature_url: null, // set to image URL when available
  },
  remarks: [{ category: "Documents", note: "sample remarks", deduction: -2.5 }],
  good_points: "good points sample remarks",
  additional_notes: "notes sample remarks",
  score_summary: [
    { category: "Documents", score: 17.5, max: 20, percent: 17.5 },
    {
      category: "Personnel Hygiene and Food Safety Practices",
      score: 19.98,
      max: 20,
      percent: 19.98,
    },
    { category: "Product Handling", score: 20.02, max: 20, percent: 20.02 },
    {
      category: "Cleanliness and Facilities (Store Facilities)",
      score: 20,
      max: 20,
      percent: 20.0,
    },
    {
      category: "Cleanliness and Orderliness (Display Unit and Storage)",
      score: 19.98,
      max: 20,
      percent: 19.98,
    },
  ],
  total_score: 97.48,
  total_max: 100,
  total_percent: 97.48,
  attachments: [], // array of image URLs
};
// ─────────────────────────────────────────────────────────────────────────────

const COBSShowReportDialog = ({
  open,
  onClose,
  unitName,
  week,
  month,
  year,
  // reportData, // uncomment and use when API is ready
}) => {
  const [downloadType, setDownloadType] = useState("PDF");

  // Use mock for now; swap with reportData prop later
  const report = MOCK_REPORT;

  const handleDownload = () => {
    // TODO: implement download
    console.log("Download as:", downloadType);
  };

  const handlePrint = () => {
    // TODO: implement print
    window.print();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="cobs-sr"
      PaperProps={{ className: "cobs-sr__paper" }}>
      {/* ── Header ── */}
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
          {/* ── Left Column ── */}
          <div className="cobs-sr__left">
            {/* Details */}
            <div className="cobs-sr__details-card">
              <p className="cobs-sr__details-title">Details</p>
              <div className="cobs-sr__detail-row">
                <span className="cobs-sr__detail-label">Date:</span>
                <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                  {report.date}
                </span>
              </div>
              <div className="cobs-sr__detail-row">
                <span className="cobs-sr__detail-label">Time in:</span>
                <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                  {report.time_in}
                </span>
              </div>
              <div className="cobs-sr__detail-row">
                <span className="cobs-sr__detail-label">Time out:</span>
                <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                  {report.time_out}
                </span>
              </div>
              <div className="cobs-sr__detail-row">
                <span className="cobs-sr__detail-label">Time Summary:</span>
                <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                  {report.time_summary}
                </span>
              </div>
              <div className="cobs-sr__detail-row">
                <span className="cobs-sr__detail-label">Area:</span>
                <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                  {report.area}
                </span>
              </div>
              <div className="cobs-sr__detail-row">
                <span className="cobs-sr__detail-label">Staff on duty:</span>
                <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                  {report.staff_on_duty.join(", ")}
                </span>
              </div>
              <div className="cobs-sr__detail-row">
                <span className="cobs-sr__detail-label">QA Name:</span>
                <span className="cobs-sr__detail-value cobs-sr__detail-value--accent">
                  {report.qa_name}
                </span>
              </div>
            </div>

            {/* Signed by */}
            <div className="cobs-sr__signed-card">
              <p className="cobs-sr__signed-title">Signed by</p>
              <div className="cobs-sr__signature-box">
                {report.signed_by.signature_url ? (
                  <img
                    src={report.signed_by.signature_url}
                    alt="Signature"
                    className="cobs-sr__signature-img"
                  />
                ) : (
                  <div className="cobs-sr__signature-placeholder" />
                )}
              </div>
              <p className="cobs-sr__signee-name">{report.signed_by.name}</p>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="cobs-sr__right">
            {/* Remarks */}
            <div className="cobs-sr__section-card">
              <p className="cobs-sr__section-label">Remarks</p>
              <div className="cobs-sr__section-body">
                {report.remarks.length === 0 ? (
                  <span className="cobs-sr__empty">—</span>
                ) : (
                  report.remarks.map((r, i) => (
                    <div key={i} className="cobs-sr__remark-row">
                      <span className="cobs-sr__remark-bullet">•</span>
                      <span className="cobs-sr__remark-category">
                        {r.category}
                      </span>
                      <span className="cobs-sr__remark-note">{r.note}</span>
                      {r.deduction !== undefined && (
                        <span className="cobs-sr__remark-deduction">
                          ({r.deduction})
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Good Points */}
            <div className="cobs-sr__section-card">
              <p className="cobs-sr__section-label">Good points</p>
              <div className="cobs-sr__section-body">
                <p className="cobs-sr__section-text">
                  {report.good_points || "—"}
                </p>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="cobs-sr__section-card">
              <p className="cobs-sr__section-label">Additional notes</p>
              <div className="cobs-sr__section-body">
                <p className="cobs-sr__section-text">
                  {report.additional_notes || "—"}
                </p>
              </div>
            </div>

            {/* Score Summary + Attachment */}
            <div className="cobs-sr__bottom-row">
              {/* Score Summary */}
              <div className="cobs-sr__section-card cobs-sr__score-card">
                <p className="cobs-sr__section-label">Score Summary</p>
                <div className="cobs-sr__section-body">
                  {report.score_summary.map((s, i) => (
                    <div key={i} className="cobs-sr__score-row">
                      <span className="cobs-sr__score-category">
                        {s.category}
                      </span>
                      <span className="cobs-sr__score-value">
                        {s.score} / {s.max}{" "}
                        <span className="cobs-sr__score-pct">
                          ({s.percent.toFixed(2)}%)
                        </span>
                      </span>
                    </div>
                  ))}
                  <div className="cobs-sr__score-divider" />
                  <div className="cobs-sr__score-total-row">
                    <span className="cobs-sr__score-total-label">Total —</span>
                    <span className="cobs-sr__score-total-value">
                      {report.total_score} / {report.total_max}
                    </span>
                    <span className="cobs-sr__score-total-pct">
                      {report.total_percent.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Attachment */}
              <div className="cobs-sr__section-card cobs-sr__attach-card">
                <p className="cobs-sr__section-label">Attachment</p>
                <div className="cobs-sr__attach-body">
                  {report.attachments.length === 0 ? (
                    <div className="cobs-sr__attach-empty">
                      <ImageIcon className="cobs-sr__attach-icon" />
                      <span>No Photo Attachments</span>
                    </div>
                  ) : (
                    <div className="cobs-sr__attach-grid">
                      {report.attachments.map((url, i) => (
                        <Tooltip key={i} title="View image" placement="top">
                          <img
                            src={url}
                            alt={`attachment-${i}`}
                            className="cobs-sr__attach-thumb"
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

      {/* ── Footer ── */}
      <DialogActions className="cobs-sr__footer">
        <div className="cobs-sr__footer-left">
          <FormControl size="small" className="cobs-sr__download-select">
            <Select
              value={downloadType}
              onChange={(e) => setDownloadType(e.target.value)}
              className="cobs-sr__select"
              MenuProps={{ PaperProps: { className: "cobs-sr__select-menu" } }}>
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
  );
};

export default COBSShowReportDialog;
