import { useEffect, useState } from "react";
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
  confirmVariant = "danger",
  showRemarksField = false,
  remarksLabel = "Remarks",
  remarksPlaceholder = "Enter remarks",
  remarksRequired = false,
}) => {
  const [remarks, setRemarks] = useState("");
  const [remarksError, setRemarksError] = useState(false);

  // Reset the field every time the dialog is (re)opened so stale text from
  // a previous confirmation doesn't carry over.
  useEffect(() => {
    if (open) {
      setRemarks("");
      setRemarksError(false);
    }
  }, [open]);

  const handleConfirmClick = () => {
    if (showRemarksField && remarksRequired && !remarks.trim()) {
      setRemarksError(true);
      return;
    }
    onConfirm?.(remarks);
  };

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

        {showRemarksField && (
          <div className="cd__remarks-field">
            <label className="cd__remarks-label">
              {remarksLabel}
              {remarksRequired && (
                <span className="cd__remarks-required">*</span>
              )}
            </label>
            <textarea
              className={`cd__remarks-textarea${
                remarksError ? " cd__remarks-textarea--error" : ""
              }`}
              placeholder={remarksPlaceholder}
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                if (e.target.value.trim()) setRemarksError(false);
              }}
              rows={3}
              disabled={isLoading}
            />
            {remarksError && (
              <span className="cd__remarks-error">Remarks is required.</span>
            )}
          </div>
        )}

        <div className="cd__footer">
          <button
            className="cd__cancel-btn"
            onClick={onClose}
            disabled={isLoading}>
            {cancelLabel}
          </button>
          <button
            className={`cd__confirm-btn cd__confirm-btn--${confirmVariant}`}
            onClick={handleConfirmClick}
            disabled={isLoading}>
            {isLoading ? "Processing..." : confirmLabel}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDialog;
