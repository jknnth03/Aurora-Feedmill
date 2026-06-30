import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import CloseIcon from "@mui/icons-material/Close";
import BugReportIcon from "@mui/icons-material/BugReport";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import "./PestShowReportDialog.scss";

const getGrade = (percent) => {
  if (percent <= 30) return { label: "Low", color: "#7bc67e" };
  if (percent <= 60) return { label: "Moderate", color: "#4db6ac" };
  return { label: "Critical", color: "#1a237e" };
};

const PestShowReportDialog = ({ open, onClose, reportData, onRefetch }) => {
  const [frozenData, setFrozenData] = useState(null);
  const [downloadType, setDownloadType] = useState("PDF");

  useEffect(() => {
    if (open && reportData) setFrozenData(reportData);
    if (!open) setFrozenData(null);
  }, [open]);

  const data = frozenData;
  if (!data) return null;

  const handleDownload = () => {
    console.log("Download as:", downloadType);
  };

  const handlePrint = () => {
    window.print();
  };

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

  const responses = Array.isArray(data.responses)
    ? data.responses.filter(
        (r) => r.response !== null && r.response !== undefined,
      )
    : [];

  const signatory2 = data.signatory_2 ?? null;

  // Collect all unique pest names across all responses
  const allPestNames = [
    ...new Set(
      responses.flatMap((r) =>
        Array.isArray(r.response?.pests)
          ? r.response.pests.map((p) => p.name)
          : [],
      ),
    ),
  ];

  // Total quantity per pest type across all areas
  const gradingSummary = allPestNames.map((name) => {
    const total = responses.reduce((sum, r) => {
      const found = (r.response?.pests ?? []).find((p) => p.name === name);
      return sum + (found ? Number(found.score ?? 0) : 0);
    }, 0);
    const areaCount = responses.length;
    const maxPerPest = areaCount * 10;
    const percent =
      maxPerPest === 0
        ? 0
        : Math.min(Math.round((total / maxPerPest) * 100), 100);
    const grade = getGrade(percent);
    return { name, total, percent, grade };
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="pest-sr"
      PaperProps={{ className: "pest-sr__paper" }}>
      <div className="pest-sr__header">
        <div className="pest-sr__header-left">
          <BugReportIcon className="pest-sr__header-icon" />
          <span className="pest-sr__header-title">Pest Inspection Report</span>
        </div>
        <IconButton size="small" className="pest-sr__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="pest-sr__content">
        <div className="pest-sr__body">
          <div className="pest-sr__details-card">
            <p className="pest-sr__details-title">Details</p>
            <div className="pest-sr__details-grid">
              <div className="pest-sr__details-col">
                <div className="pest-sr__detail-row">
                  <span className="pest-sr__detail-label">Date:</span>
                  <span className="pest-sr__detail-value pest-sr__detail-value--accent">
                    {formatDate(data.start_at)}
                  </span>
                </div>
                <div className="pest-sr__detail-row">
                  <span className="pest-sr__detail-label">Time in:</span>
                  <span className="pest-sr__detail-value pest-sr__detail-value--accent">
                    {formatTime(data.start_at)}
                  </span>
                </div>
              </div>
              <div className="pest-sr__details-col">
                <div className="pest-sr__detail-row">
                  <span className="pest-sr__detail-label">Time out:</span>
                  <span className="pest-sr__detail-value pest-sr__detail-value--accent">
                    {formatTime(data.end_at)}
                  </span>
                </div>
                <div className="pest-sr__detail-row">
                  <span className="pest-sr__detail-label">Companion:</span>
                  <span className="pest-sr__detail-value pest-sr__detail-value--accent">
                    {data.evaluator || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {gradingSummary.length > 0 && (
            <div className="pest-sr__section-card">
              <p className="pest-sr__section-label">Pests Score</p>
              <div className="pest-sr__section-body pest-sr__section-body--no-pad">
                <table className="pest-sr__grade-table">
                  <thead>
                    <tr>
                      <th className="pest-sr__grade-th">Pest</th>
                      <th className="pest-sr__grade-th pest-sr__grade-th--center">
                        Qty
                      </th>
                      <th className="pest-sr__grade-th pest-sr__grade-th--center">
                        Grade
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gradingSummary.map(({ name, total, grade }) => (
                      <tr key={name} className="pest-sr__grade-tr">
                        <td className="pest-sr__grade-td">{name}</td>
                        <td className="pest-sr__grade-td pest-sr__grade-td--center">
                          {total}
                        </td>
                        <td className="pest-sr__grade-td pest-sr__grade-td--center">
                          <span
                            className="pest-sr__grade-chip"
                            style={{ background: grade.color }}>
                            {grade.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="pest-sr__section-card">
            <p className="pest-sr__section-label">Remarks</p>
            <div className="pest-sr__section-body">
              {data.remarks ? (
                <p className="pest-sr__section-text">{data.remarks}</p>
              ) : (
                <span className="pest-sr__empty">—</span>
              )}
            </div>
          </div>

          <div className="pest-sr__section-card">
            <p className="pest-sr__section-label">Notes</p>
            <div className="pest-sr__section-body">
              {data.notes ? (
                <p className="pest-sr__section-text">{data.notes}</p>
              ) : (
                <span className="pest-sr__empty">—</span>
              )}
            </div>
          </div>

          <div className="pest-sr__section-card">
            <p className="pest-sr__section-label">Inspection Results</p>
            <div className="pest-sr__section-body pest-sr__section-body--no-pad">
              {responses.length === 0 ? (
                <div className="pest-sr__empty-pad">—</div>
              ) : (
                <div className="pest-sr__inspection-table-wrap">
                  <table className="pest-sr__inspection-table">
                    <thead>
                      <tr>
                        <th className="pest-sr__it-th">Area</th>
                        <th className="pest-sr__it-th">Pests Found</th>
                        <th className="pest-sr__it-th">Observations</th>
                      </tr>
                    </thead>
                    <tbody>
                      {responses.map((r, i) => {
                        const res = r.response;
                        const pests = Array.isArray(res?.pests)
                          ? res.pests
                          : [];
                        const obs = res?.other_observations ?? {};
                        return (
                          <tr key={i} className="pest-sr__it-tr">
                            <td className="pest-sr__it-td pest-sr__it-td--area">
                              {res?.inspection_area || "—"}
                            </td>
                            <td className="pest-sr__it-td">
                              {pests.length === 0 ? (
                                <span className="pest-sr__no-pest">None</span>
                              ) : (
                                <div className="pest-sr__pest-list">
                                  {pests.map((p, j) => (
                                    <span key={j} className="pest-sr__pest-tag">
                                      {p.name}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="pest-sr__it-td">
                              {Object.keys(obs).length === 0 ? (
                                <span className="pest-sr__empty">—</span>
                              ) : (
                                <div className="pest-sr__obs-list">
                                  {Object.entries(obs).map(([key, val], j) => (
                                    <div key={j} className="pest-sr__obs-item">
                                      <span className="pest-sr__obs-key">
                                        {key}:
                                      </span>{" "}
                                      <span className="pest-sr__obs-val">
                                        {val}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {signatory2 && (
          <div className="pest-sr__signatories-row">
            <div className="pest-sr__signatory-item">
              <span className="pest-sr__signatory-label">Acknowledged by:</span>
              {signatory2.approve_image ? (
                <div className="pest-sr__signatory-img-box">
                  <img
                    src={signatory2.approve_image}
                    alt="acknowledged-by"
                    className="pest-sr__signatory-img"
                  />
                </div>
              ) : (
                <div className="pest-sr__signatory-img-box pest-sr__signatory-img-box--empty" />
              )}
              {signatory2.name && (
                <span className="pest-sr__signatory-name">
                  {signatory2.name}
                </span>
              )}
            </div>
          </div>
        )}
      </DialogContent>

      <DialogActions className="pest-sr__footer">
        <div className="pest-sr__footer-left">
          <FormControl size="small" className="pest-sr__download-select">
            <Select
              value={downloadType}
              onChange={(e) => setDownloadType(e.target.value)}
              className="pest-sr__select"
              MenuProps={{
                PaperProps: { className: "pest-sr__select-menu" },
              }}>
              <MenuItem value="PDF">PDF</MenuItem>
              <MenuItem value="Excel">Excel</MenuItem>
            </Select>
          </FormControl>
          <IconButton
            className="pest-sr__btn-download"
            onClick={handleDownload}
            size="small">
            <DownloadIcon fontSize="small" />
          </IconButton>
          <button className="pest-sr__btn-print" onClick={handlePrint}>
            <PrintIcon fontSize="small" />
            PRINT
          </button>
        </div>
        <button className="pest-sr__btn-close" onClick={onClose}>
          Close
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default PestShowReportDialog;
