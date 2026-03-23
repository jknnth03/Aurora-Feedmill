import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import SecurityIcon from "@mui/icons-material/Security";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
} from "../../../features/api/usermanagement/permissionsApi";
import "./PermissionsModal.scss";

const schema = yup.object({
  name: yup.string().required("Permission name is required"),
});

const PermissionsModal = ({ open, onClose, selectedRow = null }) => {
  const [mode, setMode] = useState("add");

  const [createPermission, { isLoading: isCreating }] =
    useCreatePermissionMutation();
  const [updatePermission, { isLoading: isUpdating }] =
    useUpdatePermissionMutation();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedRow ? "view" : "add");
      reset({ name: selectedRow ? (selectedRow.name ?? "") : "" });
    }
  }, [open, selectedRow, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updatePermission({ id: selectedRow.id, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Permission updated successfully.",
          { variant: "success" },
        );
      } else {
        await createPermission(form).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Permission created successfully.",
          { variant: "success" },
        );
      }
      onClose();
    } catch (err) {
      console.error("Save failed:", err);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong. Please try again.",
        { variant: "error" },
      );
    }
  };

  const headerIcon = {
    add: <SecurityIcon className="pm__header-icon" />,
    view: <RemoveRedEyeIcon className="pm__header-icon" />,
    edit: <EditIcon className="pm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Permission",
    view: "View Permission",
    edit: "Edit Permission",
  };

  const isView = mode === "view";

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{ className: "pm__paper" }}>
      <div className="pm__header">
        <div className="pm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="pm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="pm__content">
        {isView ? (
          <>
            <div className="pm__group">
              <p className="pm__group-label">Permission Details</p>
              <div className="pm__field">
                <div className="pm__input-wrap pm__input-wrap--disabled">
                  <label className="pm__label">Permission Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="pm__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={() => setMode("edit")}
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="pm__group">
              <p className="pm__group-label">Permission Details</p>
              <div className="pm__field">
                <div
                  className={`pm__input-wrap${errors.name ? " pm__input-wrap--error" : ""}`}>
                  <label className="pm__label">
                    Permission Name
                    <span className="pm__required">
                      <PushPinIcon />
                    </span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="pm__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="pm__footer">
              {selectedRow && (
                <button
                  type="button"
                  className="pm__back-btn"
                  onClick={() => setMode("view")}>
                  ← Back
                </button>
              )}
              <UniversalButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Permission"
                }
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
              />
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PermissionsModal;
