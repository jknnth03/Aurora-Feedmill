import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import MergeIcon from "@mui/icons-material/MergeType";
import { useMergeCobsMutation } from "../../../features/api/cobs/cobsApi";

const COBSMergeConfirmDialog = ({ open, onClose, onSuccess, month, year }) => {
  const [mergeCobs, { isLoading: isMerging }] = useMergeCobsMutation();

  const handleConfirm = async () => {
    try {
      await mergeCobs({ month, year }).unwrap();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Merge failed:", err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "cobsam__paper" }}>
      <div className="cobsam__header">
        <div className="cobsam__header-title">
          <MergeIcon className="cobsam__header-icon" />
          <span>Merge with Week 3</span>
        </div>
        <IconButton
          size="small"
          className="cobsam__close"
          onClick={onClose}
          disabled={isMerging}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="cobsam__content">
        <p style={{ margin: 0, fontSize: "0.875rem", lineHeight: 1.6 }}>
          Are you sure you want to merge <strong>Week 4</strong> with{" "}
          <strong>Week 3</strong>? This action cannot be undone.
        </p>
      </DialogContent>

      <DialogActions className="cobsam__footer">
        <Button
          variant="text"
          onClick={onClose}
          disabled={isMerging}
          className="cobsam__btn-close">
          CANCEL
        </Button>
        <Button
          variant="contained"
          startIcon={<MergeIcon sx={{ fontSize: 16 }} />}
          onClick={handleConfirm}
          disabled={isMerging}
          className="cobsam__btn-approve">
          {isMerging ? "MERGING…" : "CONFIRM MERGE"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default COBSMergeConfirmDialog;
