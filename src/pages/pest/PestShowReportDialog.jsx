import { useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import AssessmentIcon from "@mui/icons-material/Assessment";
import BugReportIcon from "@mui/icons-material/BugReport";
import "./PestShowReportDialog.scss";

const PestShowReportDialog = ({ open, onClose, reportData, onRefetch }) => {
  const [frozenData, setFrozenData] = useState(null);

  useEffect(() => {
    if (open && reportData) setFrozenData(reportData);
    if (!open) setFrozenData(null);
  }, [open]);

  const data = frozenData;
  if (!data) return null;

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
          <div className="pest-sr__left">
            <div className="pest-sr__details-card">
              <p className="pest-sr__details-title">Details</p>
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
              <div className="pest-sr__detail-row">
                <span className="pest-sr__detail-label">Time out:</span>
                <span className="pest-sr__detail-value pest-sr__detail-value--accent">
                  {formatTime(data.end_at)}
                </span>
              </div>
              <div className="pest-sr__detail-row">
                <span className="pest-sr__detail-label">Inspector:</span>
                <span className="pest-sr__detail-value pest-sr__detail-value--accent">
                  {data.user || "—"}
                </span>
              </div>
              <div className="pest-sr__detail-row">
                <span className="pest-sr__detail-label">Evaluator:</span>
                <span className="pest-sr__detail-value pest-sr__detail-value--accent">
                  {data.evaluator || "—"}
                </span>
              </div>
            </div>

            <div className="pest-sr__section-card">
              <p className="pest-sr__section-label">Score Summary</p>
              <div className="pest-sr__section-body">
                {Array.isArray(data.score_breakdown) &&
                data.score_breakdown.length > 0 ? (
                  data.score_breakdown.map((s, i) => (
                    <div key={i} className="pest-sr__score-row">
                      <span className="pest-sr__score-category">
                        {s.category}
                      </span>
                      <span className="pest-sr__score-value">
                        {s.score.toFixed(2)} / {s.allocation.toFixed(2)}{" "}
                        <span className="pest-sr__score-pct">
                          ({s.percentage.toFixed(2)}%)
                        </span>
                      </span>
                    </div>
                  ))
                ) : (
                  <span className="pest-sr__empty">—</span>
                )}
                {data.score != null && (
                  <>
                    <div className="pest-sr__score-divider" />
                    <div className="pest-sr__score-total-row">
                      <span className="pest-sr__score-total-label">
                        Total —
                      </span>
                      <span className="pest-sr__score-total-value">
                        {data.score}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="pest-sr__right">
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
                                      <span
                                        key={j}
                                        className="pest-sr__pest-tag">
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
                                    {Object.entries(obs).map(
                                      ([key, val], j) => (
                                        <div
                                          key={j}
                                          className="pest-sr__obs-item">
                                          <span className="pest-sr__obs-key">
                                            {key}:
                                          </span>{" "}
                                          <span className="pest-sr__obs-val">
                                            {val}
                                          </span>
                                        </div>
                                      ),
                                    )}
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
        <button className="pest-sr__btn-close" onClick={onClose}>
          Close
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default PestShowReportDialog;
