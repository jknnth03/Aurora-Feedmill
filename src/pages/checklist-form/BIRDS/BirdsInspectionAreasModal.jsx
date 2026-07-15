import { Dialog, DialogContent, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import VisibilityIcon from "@mui/icons-material/Visibility";
import "./BirdsInspectionAreasModal.scss";

const BirdsInspectionAreasModal = ({ open, onClose, areas }) => {
  const list = areas ?? [];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      className="birds-inspection-modal">
      <div className="birds-inspection-modal__header">
        <VisibilityIcon fontSize="small" />
        <span>Inspection Areas</span>
        <IconButton
          className="birds-inspection-modal__close"
          onClick={onClose}
          size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="birds-inspection-modal__content">
        {list.length === 0 ? (
          <div className="birds-inspection-modal__empty">
            No inspection areas configured.
          </div>
        ) : (
          <ul className="birds-inspection-modal__list">
            {list.map((area, idx) => (
              <li key={idx} className="birds-inspection-modal__item">
                {area.name}
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BirdsInspectionAreasModal;
