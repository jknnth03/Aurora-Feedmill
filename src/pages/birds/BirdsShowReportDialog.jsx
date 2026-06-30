import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import CloseIcon from "@mui/icons-material/Close";
import FlutterDashIcon from "@mui/icons-material/FlutterDash";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import "./BirdsShowReportDialog.scss";

const getInfestationColor = (level) => {
  const normalized = (level ?? "").toLowerCase();
  if (normalized === "low") return "#7bc67e";
  if (normalized === "average") return "#4db6ac";
  if (normalized === "moderate") return "#1a237e";
  return "#a07858";
};

const BirdsShowReportDialog = ({ open, onClose, reportData, onRefetch }) => {
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

  const infestationSummary = responses.reduce((acc, r) => {
    const level = r.response?.infestation_level;
    if (!level) return acc;
    acc[level] = (acc[level] ?? 0) + 1;
    return acc;
  }, {});

  const infestationRows = Object.entries(infestationSummary).map(
    ([level, count]) => ({
      level,
      count,
      color: getInfestationColor(level),
    }),
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      className="birds-sr"
      PaperProps={{ className: "birds-sr__paper" }}>
      <div className="birds-sr__header">
        <div className="birds-sr__header-left">
          <FlutterDashIcon className="birds-sr__header-icon" />
          <span className="birds-sr__header-title">
            Birds Inspection Report
          </span>
        </div>
        <IconButton size="small" className="birds-sr__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="birds-sr__content">
        <div className="birds-sr__body">
          <div className="birds-sr__details-card">
            <p className="birds-sr__details-title">Details</p>
            <div className="birds-sr__details-grid">
              <div className="birds-sr__details-col">
                <div className="birds-sr__detail-row">
                  <span className="birds-sr__detail-label">Date:</span>
                  <span className="birds-sr__detail-value birds-sr__detail-value--accent">
                    {formatDate(data.start_at)}
                  </span>
                </div>
                <div className="birds-sr__detail-row">
                  <span className="birds-sr__detail-label">Time in:</span>
                  <span className="birds-sr__detail-value birds-sr__detail-value--accent">
                    {formatTime(data.start_at)}
                  </span>
                </div>
              </div>
              <div className="birds-sr__details-col">
                <div className="birds-sr__detail-row">
                  <span className="birds-sr__detail-label">Time out:</span>
                  <span className="birds-sr__detail-value birds-sr__detail-value--accent">
                    {formatTime(data.end_at)}
                  </span>
                </div>
                <div className="birds-sr__detail-row">
                  <span className="birds-sr__detail-label">Companion:</span>
                  <span className="birds-sr__detail-value birds-sr__detail-value--accent">
                    {data.evaluator || "—"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {infestationRows.length > 0 && (
            <div className="birds-sr__section-card">
              <p className="birds-sr__section-label">Infestation Level</p>
              <div className="birds-sr__section-body birds-sr__section-body--no-pad">
                <table className="birds-sr__grade-table">
                  <thead>
                    <tr>
                      <th className="birds-sr__grade-th">Level</th>
                      <th className="birds-sr__grade-th birds-sr__grade-th--center">
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {infestationRows.map(({ level, count, color }) => (
                      <tr key={level} className="birds-sr__grade-tr">
                        <td className="birds-sr__grade-td">
                          <span
                            className="birds-sr__grade-chip"
                            style={{ background: color }}>
                            {level}
                          </span>
                        </td>
                        <td className="birds-sr__grade-td birds-sr__grade-td--center">
                          {count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="birds-sr__section-card">
            <p className="birds-sr__section-label">Remarks</p>
            <div className="birds-sr__section-body">
              {data.remarks ? (
                <p className="birds-sr__section-text">{data.remarks}</p>
              ) : (
                <span className="birds-sr__empty">—</span>
              )}
            </div>
          </div>

          <div className="birds-sr__section-card">
            <p className="birds-sr__section-label">Notes</p>
            <div className="birds-sr__section-body">
              {data.notes ? (
                <p className="birds-sr__section-text">{data.notes}</p>
              ) : (
                <span className="birds-sr__empty">—</span>
              )}
            </div>
          </div>

          <div className="birds-sr__section-card">
            <p className="birds-sr__section-label">Inspection Results</p>
            <div className="birds-sr__section-body birds-sr__section-body--no-pad">
              {responses.length === 0 ? (
                <div className="birds-sr__empty-pad">—</div>
              ) : (
                <div className="birds-sr__inspection-table-wrap">
                  <table className="birds-sr__inspection-table">
                    <thead>
                      <tr>
                        <th className="birds-sr__it-th">Area</th>
                        <th className="birds-sr__it-th">Infestation Level</th>
                        <th className="birds-sr__it-th">Wastage</th>
                        <th className="birds-sr__it-th">Entry Points</th>
                        <th className="birds-sr__it-th">Treatment Dose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {responses.map((r, i) => {
                        const res = r.response;
                        const wastage = Array.isArray(res?.wastage)
                          ? res.wastage
                          : [];
                        return (
                          <tr key={i} className="birds-sr__it-tr">
                            <td className="birds-sr__it-td birds-sr__it-td--area">
                              {res?.inspection_area || "—"}
                            </td>
                            <td className="birds-sr__it-td">
                              {res?.infestation_level ? (
                                <span
                                  className="birds-sr__level-tag"
                                  style={{
                                    color: getInfestationColor(
                                      res.infestation_level,
                                    ),
                                  }}>
                                  {res.infestation_level}
                                </span>
                              ) : (
                                <span className="birds-sr__empty">—</span>
                              )}
                            </td>
                            <td className="birds-sr__it-td">
                              {wastage.length === 0 ? (
                                <span className="birds-sr__empty">—</span>
                              ) : (
                                <div className="birds-sr__wastage-list">
                                  {wastage.map((w, j) => (
                                    <span
                                      key={j}
                                      className="birds-sr__wastage-tag">
                                      {w}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="birds-sr__it-td">
                              {res?.entry_points || (
                                <span className="birds-sr__empty">—</span>
                              )}
                            </td>
                            <td className="birds-sr__it-td">
                              {res?.treatment_dose || (
                                <span className="birds-sr__empty">—</span>
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
          <div className="birds-sr__signatories-row">
            <div className="birds-sr__signatory-item">
              <span className="birds-sr__signatory-label">
                Acknowledged by:
              </span>
              {signatory2.approve_image ? (
                <div className="birds-sr__signatory-img-box">
                  <img
                    src={signatory2.approve_image}
                    alt="acknowledged-by"
                    className="birds-sr__signatory-img"
                  />
                </div>
              ) : (
                <div className="birds-sr__signatory-img-box birds-sr__signatory-img-box--empty" />
              )}
              {signatory2.name && (
                <span className="birds-sr__signatory-name">
                  {signatory2.name}
                </span>
              )}
            </div>
          </div>
        )}
      </DialogContent>

      <DialogActions className="birds-sr__footer">
        <div className="birds-sr__footer-left">
          <FormControl size="small" className="birds-sr__download-select">
            <Select
              value={downloadType}
              onChange={(e) => setDownloadType(e.target.value)}
              className="birds-sr__select"
              MenuProps={{
                PaperProps: { className: "birds-sr__select-menu" },
              }}>
              <MenuItem value="PDF">PDF</MenuItem>
              <MenuItem value="Excel">Excel</MenuItem>
            </Select>
          </FormControl>
          <IconButton
            className="birds-sr__btn-download"
            onClick={handleDownload}
            size="small">
            <DownloadIcon fontSize="small" />
          </IconButton>
          <button className="birds-sr__btn-print" onClick={handlePrint}>
            <PrintIcon fontSize="small" />
            PRINT
          </button>
        </div>
        <button className="birds-sr__btn-close" onClick={onClose}>
          Close
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default BirdsShowReportDialog;
