import { useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import CloseIcon from "@mui/icons-material/Close";
import LockResetIcon from "@mui/icons-material/LockReset";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import ConfirmDialog from "../../reusable-components/comfirm-dialog/ConfirmDialog";
import { useChangePasswordMutation } from "../../features/api/usermanagement/userApi";
import "./UpdatePasswordDialog.scss";

const schema = yup.object({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "Password must be at least 8 characters"),
  confirmPassword: yup
    .string()
    .required("Please confirm your new password")
    .oneOf([yup.ref("newPassword")], "Passwords do not match"),
});

const UpdatePasswordDialog = ({ open, onClose }) => {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [pendingValues, setPendingValues] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [changePassword] = useChangePasswordMutation();

  const handleClose = () => {
    reset();
    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
    setConfirmOpen(false);
    setPendingValues(null);
    onClose();
  };

  const onSubmit = (values) => {
    setPendingValues(values);
    setConfirmOpen(true);
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
  };

  const handleConfirmUpdate = async () => {
    setIsUpdating(true);
    try {
      await changePassword({
        current_password: pendingValues.currentPassword,
        new_password: pendingValues.newPassword,
        new_confirm_password: pendingValues.confirmPassword,
      }).unwrap();
      window.__snackbar__?.enqueueSnackbar("Password updated successfully.", {
        variant: "success",
      });
      handleClose();
    } catch (err) {
      console.error("Update password failed:", err);
      const fieldMap = {
        current_password: "currentPassword",
        new_password: "newPassword",
        new_confirm_password: "confirmPassword",
      };
      if (err?.data?.errors) {
        Object.entries(err.data.errors).forEach(([field, messages]) => {
          const formField = fieldMap[field];
          if (formField) {
            setError(formField, { type: "server", message: messages[0] });
          }
        });
      }
      setConfirmOpen(false);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "update-password-dialog__paper" }}>
      <div className="update-password-dialog__header">
        <div className="update-password-dialog__title-row">
          <LockResetIcon className="update-password-dialog__icon" />
          <span className="update-password-dialog__title">
            UP &nbsp;–&nbsp; Update Password
          </span>
        </div>
        <IconButton
          className="update-password-dialog__close"
          onClick={handleClose}
          size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="update-password-dialog__content">
        <form
          className="update-password-dialog__form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate>
          <div className="update-password-dialog__field">
            <label className="update-password-dialog__label">
              Current Password
            </label>
            <div
              className={`update-password-dialog__input-wrap ${
                errors.currentPassword
                  ? "update-password-dialog__input-wrap--error"
                  : ""
              }`}>
              <input
                type={showCurrent ? "text" : "password"}
                className="update-password-dialog__input"
                placeholder="Enter current password"
                {...register("currentPassword")}
              />
              <IconButton
                className="update-password-dialog__visibility-btn"
                size="small"
                onClick={() => setShowCurrent((prev) => !prev)}
                tabIndex={-1}>
                {showCurrent ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
            </div>
            {errors.currentPassword && (
              <span className="update-password-dialog__error">
                {errors.currentPassword.message}
              </span>
            )}
          </div>

          <div className="update-password-dialog__field">
            <label className="update-password-dialog__label">
              New Password
            </label>
            <div
              className={`update-password-dialog__input-wrap ${
                errors.newPassword
                  ? "update-password-dialog__input-wrap--error"
                  : ""
              }`}>
              <input
                type={showNew ? "text" : "password"}
                className="update-password-dialog__input"
                placeholder="Enter new password"
                {...register("newPassword")}
              />
              <IconButton
                className="update-password-dialog__visibility-btn"
                size="small"
                onClick={() => setShowNew((prev) => !prev)}
                tabIndex={-1}>
                {showNew ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
            </div>
            {errors.newPassword && (
              <span className="update-password-dialog__error">
                {errors.newPassword.message}
              </span>
            )}
          </div>

          <div className="update-password-dialog__field">
            <label className="update-password-dialog__label">
              Confirm New Password
            </label>
            <div
              className={`update-password-dialog__input-wrap ${
                errors.confirmPassword
                  ? "update-password-dialog__input-wrap--error"
                  : ""
              }`}>
              <input
                type={showConfirm ? "text" : "password"}
                className="update-password-dialog__input"
                placeholder="Re-enter new password"
                {...register("confirmPassword")}
              />
              <IconButton
                className="update-password-dialog__visibility-btn"
                size="small"
                onClick={() => setShowConfirm((prev) => !prev)}
                tabIndex={-1}>
                {showConfirm ? (
                  <VisibilityOffIcon fontSize="small" />
                ) : (
                  <VisibilityIcon fontSize="small" />
                )}
              </IconButton>
            </div>
            {errors.confirmPassword && (
              <span className="update-password-dialog__error">
                {errors.confirmPassword.message}
              </span>
            )}
          </div>

          <div className="update-password-dialog__actions">
            <button
              type="button"
              className="update-password-dialog__btn update-password-dialog__btn--secondary"
              onClick={handleClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="update-password-dialog__btn update-password-dialog__btn--primary"
              disabled={isSubmitting}>
              <LockResetIcon style={{ fontSize: 16 }} />
              &nbsp;Update Password
            </button>
          </div>
        </form>
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        onClose={handleConfirmClose}
        onConfirm={handleConfirmUpdate}
        title="Update your password?"
        message="You're about to change your account password. Make sure you remember your new password before proceeding."
        confirmLabel="Update Password"
        cancelLabel="Cancel"
        isLoading={isUpdating}
        confirmVariant="success"
      />
    </Dialog>
  );
};

export default UpdatePasswordDialog;
