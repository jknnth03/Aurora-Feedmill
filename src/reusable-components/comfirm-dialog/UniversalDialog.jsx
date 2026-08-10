import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import "./UniversalDialog.scss";

const skeletonSx = {
  bgcolor: "rgba(230, 100, 20, 0.10)",
  borderRadius: "6px",
  "&::after": {
    background:
      "linear-gradient(90deg, transparent, rgba(230, 100, 20, 0.07), transparent)",
  },
};

const UniversalDialog = ({
  open,
  onClose,
  icon,
  title,
  subtitle,
  headerActions,
  maxWidth = "sm",
  fullWidth = true,
  loading = false,
  disableBackdropClose = false,
  disableEscapeKeyDown = false,
  children,
  footer,
  closeLabel = "CLOSE",
}) => {
  const handleDialogClose = (_, reason) => {
    if (disableBackdropClose && reason === "backdropClick") return;
    onClose?.();
  };

  return (
    <Dialog
      open={open}
      onClose={handleDialogClose}
      disableEscapeKeyDown={disableEscapeKeyDown}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      PaperProps={{ className: "ud__paper" }}>
      <div className="ud__header">
        <div className="ud__header-title">
          {icon && <span className="ud__header-icon">{icon}</span>}
          <span>{title}</span>
        </div>

        {subtitle && (
          <span className="ud__name-value" title={subtitle}>
            {subtitle}
          </span>
        )}

        <div className="ud__header-actions">
          {headerActions}
          <IconButton size="small" className="ud__close" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent className="ud__content">
        {loading ? (
          <div className="ud__skeleton-wrap">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={48}
                sx={{ mb: 1, ...skeletonSx }}
              />
            ))}
          </div>
        ) : (
          children
        )}
      </DialogContent>

      <DialogActions className="ud__footer">
        {footer ?? (
          <Button variant="text" onClick={onClose} className="ud__btn-close">
            {closeLabel}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default UniversalDialog;
