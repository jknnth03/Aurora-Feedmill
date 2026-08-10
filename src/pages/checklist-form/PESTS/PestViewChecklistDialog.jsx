import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import "../../pest/PestStartCheckingDialog.scss";

const RequiredStar = () => <span className="pest-sc__required">*</span>;

const PestViewChecklistDialog = ({ open, onClose, checklistData }) => {
  const inspectionAreas =
    checklistData?.items?.find((s) => s.name === "Inspection Areas")?.items ??
    [];
  const pests =
    checklistData?.items?.find((s) => s.name === "Pest")?.items ?? [];
  const otherObsItems =
    checklistData?.items?.find((s) => s.name === "Other Observation")?.items ??
    [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ className: "pest-sc__paper" }}>
      <div className="pest-sc__header">
        <div className="pest-sc__header-title">
          <ChecklistIcon className="pest-sc__header-icon" />
          <span>View Checklist</span>
        </div>
        <Tooltip title={checklistData?.checklist_name ?? ""} placement="top">
          <span
            className="pest-sc__name-value"
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
        <IconButton size="small" className="pest-sc__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="pest-sc__content">
        <div className="pest-sc__section">
          <div className="pest-sc__section-header">Pest Inspection</div>
          <div className="pest-sc__table-scroll">
            <table className="pest-sc__grid-table">
              <thead>
                <tr className="pest-sc__thead-row">
                  <th className="pest-sc__th pest-sc__th--area" rowSpan={2}>
                    Inspection Areas
                  </th>
                  <th
                    className="pest-sc__th pest-sc__th--group pest-sc__th--divider"
                    colSpan={pests.length}>
                    Pest
                  </th>
                  <th
                    className="pest-sc__th pest-sc__th--group"
                    colSpan={otherObsItems.reduce(
                      (acc, item) => acc + (item.sub_items?.length ?? 0),
                      0,
                    )}>
                    Other Observation
                  </th>
                </tr>
                <tr className="pest-sc__thead-row pest-sc__thead-row--sub">
                  {pests.map((pest, idx) => {
                    const isLastPest = idx === pests.length - 1;
                    return (
                      <th
                        key={pest.name}
                        className={`pest-sc__th pest-sc__th--col${isLastPest ? " pest-sc__th--divider" : ""}`}>
                        {pest.name}
                      </th>
                    );
                  })}
                  {otherObsItems.map((item, itemIdx) =>
                    item.sub_items?.map((sub, subIdx) => {
                      const isLastSub = subIdx === item.sub_items.length - 1;
                      const isLastItem = itemIdx === otherObsItems.length - 1;
                      const addDivider = isLastSub && !isLastItem;
                      return (
                        <th
                          key={`${item.name}__${sub.name}`}
                          className={`pest-sc__th pest-sc__th--col pest-sc__th--obs-sub${addDivider ? " pest-sc__th--divider" : ""}`}>
                          <div className="pest-sc__th-obs-group">
                            {item.name}
                          </div>
                          <div className="pest-sc__th-obs-sub-row">
                            <span className="pest-sc__th-obs-sub">
                              {sub.name}
                            </span>
                          </div>
                        </th>
                      );
                    }),
                  )}
                </tr>
              </thead>
              <tbody>
                {inspectionAreas.map((area) => (
                  <tr key={area.name} className="pest-sc__tr">
                    <td className="pest-sc__td pest-sc__td--area-name">
                      {area.name}
                    </td>
                    {pests.map((pest, idx) => {
                      const isLastPest = idx === pests.length - 1;
                      return (
                        <td
                          key={pest.name}
                          className={`pest-sc__td pest-sc__td--input${isLastPest ? " pest-sc__td--divider" : ""}`}>
                          <span className="pest-sc__score-display">—</span>
                        </td>
                      );
                    })}
                    {otherObsItems.map((item, itemIdx) =>
                      item.sub_items?.map((sub, subIdx) => {
                        const isLastSub = subIdx === item.sub_items.length - 1;
                        const isLastItem = itemIdx === otherObsItems.length - 1;
                        const addDivider = isLastSub && !isLastItem;
                        return (
                          <td
                            key={`${item.name}__${sub.name}`}
                            className={`pest-sc__td pest-sc__td--checkbox${addDivider ? " pest-sc__td--divider" : ""}`}>
                            <label className="pest-sc__checkbox-label pest-sc__checkbox-label--readonly">
                              <input
                                type="checkbox"
                                checked={false}
                                readOnly
                                disabled
                                className="pest-sc__checkbox-input"
                              />
                              <span className="pest-sc__checkbox-box" />
                            </label>
                          </td>
                        );
                      }),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="pest-sc__section">
          <div className="pest-sc__section-header">Grading Summary</div>
          <div className="pest-sc__graph-body">
            {pests.map(({ name }) => (
              <div key={name} className="pest-sc__graph-row">
                <span className="pest-sc__graph-label">{name}</span>
                <div className="pest-sc__graph-bar-track">
                  <div
                    className="pest-sc__graph-bar-fill"
                    style={{ width: "0%", background: "#7bc67e" }}
                  />
                </div>
                <span className="pest-sc__graph-percent">0%</span>
              </div>
            ))}
            <div className="pest-sc__graph-legend">
              <span className="pest-sc__legend-item">
                <span
                  className="pest-sc__legend-dot"
                  style={{ background: "#7bc67e" }}
                />
                Low (0–30%)
              </span>
              <span className="pest-sc__legend-item">
                <span
                  className="pest-sc__legend-dot"
                  style={{ background: "#4db6ac" }}
                />
                Moderate (31–60%)
              </span>
              <span className="pest-sc__legend-item">
                <span
                  className="pest-sc__legend-dot"
                  style={{ background: "#1a237e" }}
                />
                Critical (61%+)
              </span>
            </div>
          </div>
        </div>

        <div className="pest-sc__section">
          <div className="pest-sc__section-header">Others</div>
          <div className="pest-sc__others-body">
            <div className="pest-sc__others-row">
              <div className="pest-sc__others-field pest-sc__others-field--date">
                <span className="pest-sc__others-label">Date</span>
                <div className="pest-sc__date-display">—</div>
              </div>
            </div>

            <div className="pest-sc__others-field">
              <span className="pest-sc__others-label">
                Remarks for Observation
              </span>
              <div className="pest-sc__others-textarea-wrap">
                <textarea
                  className="pest-sc__others-textarea"
                  placeholder="—"
                  value=""
                  readOnly
                  disabled
                  rows={4}
                />
              </div>
            </div>

            <div className="pest-sc__others-field">
              <span className="pest-sc__others-label">Notes</span>
              <div className="pest-sc__others-textarea-wrap">
                <textarea
                  className="pest-sc__others-textarea"
                  placeholder="—"
                  value=""
                  readOnly
                  disabled
                  rows={4}
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions className="pest-sc__footer">
        <Button variant="text" onClick={onClose} className="pest-sc__btn-close">
          CLOSE
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PestViewChecklistDialog;
