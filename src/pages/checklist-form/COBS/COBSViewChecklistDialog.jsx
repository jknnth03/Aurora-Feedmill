import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import "../../cobs/COBSStartCheckingDialog.scss";

const SCORE_OPTIONS = [
  { value: 0, label: "N/A" },
  { value: 50, label: "50" },
  { value: 75, label: "75" },
  { value: 100, label: "100" },
];
const TEMPORAL_AUDIT_OPTIONS = [
  "Spot/Ongoing",
  "Pre-operation",
  "Post-operation",
];

const getKey = (categoryName, itemName, itemIndex, subItemIndex) =>
  `${categoryName}__${itemName}__${itemIndex}__${subItemIndex}`;

const RequiredStar = () => <span className="cobs-sc__required">*</span>;

const COBSViewChecklistDialog = ({ open, onClose, checklistData }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ className: "cobs-sc__paper" }}>
      <div className="cobs-sc__header">
        <div className="cobs-sc__header-title">
          <ChecklistIcon className="cobs-sc__header-icon" />
          <span>View Checklist</span>
        </div>

        <Tooltip title={checklistData?.checklist_name ?? ""} placement="top">
          <span
            className="cobs-sc__name-value"
            style={{
              flex: 1,
              minWidth: 0,
              margin: "0 12px",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              textAlign: "center",
            }}>
            {checklistData?.checklist_name ?? ""}
          </span>
        </Tooltip>

        <div className="cobs-sc__header-actions">
          <IconButton size="small" className="cobs-sc__close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent className="cobs-sc__content">
        {checklistData?.items?.map((category) => (
          <div key={category.name} className="cobs-sc__section">
            <div className="cobs-sc__section-header">{category.name}</div>
            <div className="cobs-sc__table-scroll">
              <table className="cobs-sc__table">
                <thead>
                  <tr className="cobs-sc__thead-row">
                    <th className="cobs-sc__th cobs-sc__th--item">Item</th>
                    <th className="cobs-sc__th cobs-sc__th--compliance">
                      Compliance <RequiredStar />
                    </th>
                    <th className="cobs-sc__th cobs-sc__th--remarks">
                      Remarks
                    </th>
                    <th className="cobs-sc__th cobs-sc__th--attachment">
                      Photo
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {category.items?.map((item, itemIdx) =>
                    item.sub_items?.map((subItem, subIdx) => {
                      const rowKey = getKey(
                        category.name,
                        item.name,
                        itemIdx,
                        subIdx,
                      );
                      return (
                        <tr key={rowKey} className="cobs-sc__tr">
                          <td className="cobs-sc__td cobs-sc__td--item">
                            {subIdx + 1}. {subItem.name}
                          </td>

                          <td className="cobs-sc__td cobs-sc__td--compliance">
                            <div className="cobs-sc__radio-box">
                              {SCORE_OPTIONS.map(({ value, label }) => (
                                <label
                                  key={value}
                                  className="cobs-sc__radio-item cobs-sc__radio-item--readonly">
                                  <input
                                    type="radio"
                                    name={`view-${rowKey}`}
                                    value={value}
                                    checked={false}
                                    readOnly
                                    disabled
                                    className="cobs-sc__radio-input"
                                  />
                                  <span
                                    className={`cobs-sc__radio-circle cobs-sc__radio-circle--${value}`}
                                  />
                                  <span className="cobs-sc__radio-text">
                                    {label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </td>

                          <td className="cobs-sc__td cobs-sc__td--remarks">
                            <textarea
                              placeholder="—"
                              value=""
                              readOnly
                              disabled
                              rows={2}
                              className="cobs-sc__textarea cobs-sc__textarea--readonly"
                            />
                          </td>

                          <td className="cobs-sc__td cobs-sc__td--attachment">
                            <span className="cobs-sc__no-attach">—</span>
                          </td>
                        </tr>
                      );
                    }),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        <div className="cobs-sc__others">
          <div className="cobs-sc__others-header">Others</div>
          <div className="cobs-sc__others-body">
            <div className="cobs-sc__others-field">
              <span className="cobs-sc__others-label">
                Date <RequiredStar />
              </span>
              <div className="cobs-sc__date-picker-wrap">
                <CalendarTodayIcon className="cobs-sc__date-icon" />
                <span className="cobs-sc__date-placeholder">—</span>
              </div>
            </div>

            <div className="cobs-sc__others-field">
              <span className="cobs-sc__others-label">Time</span>
              <div className="cobs-sc__time-row">
                <div className="cobs-sc__time-block cobs-sc__time-block--disabled">
                  <span className="cobs-sc__time-block-label">Start</span>
                  <span className="cobs-sc__time-block-value">—</span>
                </div>
                <div className="cobs-sc__time-divider">—</div>
                <div className="cobs-sc__time-block cobs-sc__time-block--disabled">
                  <span className="cobs-sc__time-block-label">End</span>
                  <span className="cobs-sc__time-block-value">—</span>
                </div>
              </div>
            </div>

            <div className="cobs-sc__others-field">
              <span className="cobs-sc__others-label">
                Temporal Audit <RequiredStar />
              </span>
              <div className="cobs-sc__others-input-box">
                <div className="cobs-sc__temporal-options">
                  {TEMPORAL_AUDIT_OPTIONS.map((opt) => (
                    <label
                      key={opt}
                      className="cobs-sc__temporal-item cobs-sc__temporal-item--readonly">
                      <input
                        type="radio"
                        name="view_temporal_audit"
                        value={opt}
                        checked={false}
                        readOnly
                        disabled
                        className="cobs-sc__radio-input"
                      />
                      <span className="cobs-sc__temporal-circle" />
                      <span className="cobs-sc__temporal-text">{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="cobs-sc__others-field">
              <span className="cobs-sc__others-label">
                Good Points <RequiredStar />
              </span>
              <textarea
                className="cobs-sc__others-textarea cobs-sc__others-textarea--readonly"
                placeholder="—"
                value=""
                readOnly
                disabled
                rows={4}
              />
            </div>

            <div className="cobs-sc__others-field">
              <span className="cobs-sc__others-label">
                Remarks <RequiredStar />
              </span>
              <textarea
                className="cobs-sc__others-textarea cobs-sc__others-textarea--readonly"
                placeholder="—"
                value=""
                readOnly
                disabled
                rows={4}
              />
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions className="cobs-sc__footer">
        <Button variant="text" onClick={onClose} className="cobs-sc__btn-close">
          CLOSE
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default COBSViewChecklistDialog;
