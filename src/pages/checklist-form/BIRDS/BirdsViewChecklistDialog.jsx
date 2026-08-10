import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import "../../birds/BirdsStartCheckingDialog.scss";

const BirdsViewChecklistDialog = ({ open, onClose, checklistData }) => {
  const inspectionAreas =
    checklistData?.items?.find((s) => s.name === "Inspection Areas")?.items ??
    [];
  const infestationLevelItems =
    checklistData?.items?.find((s) => s.name === "Infestation Level")?.items ??
    [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{ className: "birds-sc__paper" }}>
      <div className="birds-sc__header">
        <div className="birds-sc__header-title">
          <ChecklistIcon className="birds-sc__header-icon" />
          <span>View Checklist</span>
        </div>
        <Tooltip title={checklistData?.checklist_name ?? ""} placement="top">
          <span
            className="birds-sc__name-value"
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
        <IconButton size="small" className="birds-sc__close" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="birds-sc__content">
        <div className="birds-sc__section">
          <div className="birds-sc__section-header">Bird Inspection</div>
          <div className="birds-sc__table-scroll">
            <table className="birds-sc__grid-table">
              <thead>
                <tr className="birds-sc__thead-row">
                  <th className="birds-sc__th birds-sc__th--area">
                    Inspection Areas
                  </th>
                  <th
                    className="birds-sc__th birds-sc__th--group"
                    colSpan={infestationLevelItems.length}>
                    Infestation Level
                  </th>
                  <th className="birds-sc__th birds-sc__th--group">
                    Treatment / Action Dose
                  </th>
                  <th className="birds-sc__th birds-sc__th--group">
                    Presence of Feed/RM Wastage
                  </th>
                  <th className="birds-sc__th birds-sc__th--group">
                    Identify Entry Points
                  </th>
                </tr>
                <tr className="birds-sc__thead-row birds-sc__thead-row--sub">
                  <th className="birds-sc__th birds-sc__th--area-placeholder" />
                  {infestationLevelItems.map((lvl) => (
                    <th
                      key={lvl.name}
                      className="birds-sc__th birds-sc__th--col">
                      {lvl.name}
                    </th>
                  ))}
                  <th className="birds-sc__th birds-sc__th--col birds-sc__th--wide" />
                  <th className="birds-sc__th birds-sc__th--col birds-sc__th--wide" />
                  <th className="birds-sc__th birds-sc__th--col birds-sc__th--wide" />
                </tr>
              </thead>
              <tbody>
                {inspectionAreas.map((area) => (
                  <tr key={area.name} className="birds-sc__tr">
                    <td className="birds-sc__td birds-sc__td--area-name">
                      {area.name}
                    </td>
                    {infestationLevelItems.map((lvl) => (
                      <td
                        key={lvl.name}
                        className="birds-sc__td birds-sc__td--radio">
                        <label className="birds-sc__radio-label birds-sc__radio-label--readonly">
                          <input
                            type="radio"
                            checked={false}
                            readOnly
                            disabled
                            className="birds-sc__radio-input"
                          />
                          <span className="birds-sc__radio-box" />
                        </label>
                      </td>
                    ))}
                    <td className="birds-sc__td birds-sc__td--text">
                      <span className="birds-sc__text-display">—</span>
                    </td>
                    <td className="birds-sc__td birds-sc__td--text">
                      <span className="birds-sc__text-display">—</span>
                    </td>
                    <td className="birds-sc__td birds-sc__td--text">
                      <span className="birds-sc__text-display">—</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="birds-sc__section birds-sc__section--others">
          <div className="birds-sc__section-header">Others</div>
          <div className="birds-sc__others-body">
            <div className="birds-sc__others-field">
              <label className="birds-sc__others-label">Date</label>
              <span className="birds-sc__text-display">—</span>
            </div>
            <div className="birds-sc__others-field birds-sc__others-field--remarks">
              <label className="birds-sc__others-label">
                Remarks (Optional)
              </label>
              <span className="birds-sc__text-display">—</span>
            </div>
          </div>
        </div>
      </DialogContent>

      <DialogActions className="birds-sc__footer">
        <Button
          variant="text"
          onClick={onClose}
          className="birds-sc__btn-close">
          CLOSE
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BirdsViewChecklistDialog;
