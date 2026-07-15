import { Dialog, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import "./PestInspectionAreasModal.scss";

const PestInspectionAreasModal = ({ open, onClose, areas }) => {
  const list = areas ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      className="pest-inspection-modal">
      <div className="pest-inspection-modal__header">
        <VisibilityIcon fontSize="small" />
        <span>Inspection Areas</span>
        <IconButton
          className="pest-inspection-modal__close"
          onClick={onClose}
          size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="pest-inspection-modal__content">
        {list.length === 0 ? (
          <div className="pest-inspection-modal__empty">
            No inspection areas configured.
          </div>
        ) : (
          <ul className="pest-inspection-modal__list">
            {list.map((area, idx) => (
              <li key={idx} className="pest-inspection-modal__item">
                {area.name}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PestInspectionAreasModal;
