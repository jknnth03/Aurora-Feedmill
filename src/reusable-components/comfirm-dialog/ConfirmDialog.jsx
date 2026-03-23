import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import "./ConfirmDialog.scss";

const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isLoading = false,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "cd__paper" }}>
      <DialogContent className="cd__content">
        <div className="cd__icon-wrap">
          <WarningAmberIcon className="cd__icon" />
        </div>

        <h3 className="cd__title">{title}</h3>
        {message && <p className="cd__message">{message}</p>}

        <div className="cd__footer">
          <button
            className="cd__cancel-btn"
            onClick={onClose}
            disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            className="cd__confirm-btn"
            onClick={onConfirm}
            disabled={isLoading}>
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
