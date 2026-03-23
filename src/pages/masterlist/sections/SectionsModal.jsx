import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ViewListIcon from "@mui/icons-material/ViewList";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useCreateSectionMutation,
  useUpdateSectionMutation,
} from "../../../features/api/masterlist/sectionsApi";
import "./SectionsModal.scss";

const schema = yup.object({
  name: yup.string().required("Section name is required"),
});

const SectionsModal = ({ open, onClose, selectedRow = null }) => {
  const [mode, setMode] = useState("add");

  const [createSection, { isLoading: isCreating }] = useCreateSectionMutation();
  const [updateSection, { isLoading: isUpdating }] = useUpdateSectionMutation();
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
        await updateSection({ id: selectedRow.id, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Section updated successfully.", {
          variant: "success",
        });
      } else {
        await createSection(form).unwrap();
        window.__snackbar__?.enqueueSnackbar("Section created successfully.", {
          variant: "success",
        });
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
    add: <ViewListIcon className="sm__header-icon" />,
    view: <RemoveRedEyeIcon className="sm__header-icon" />,
    edit: <EditIcon className="sm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Section",
    view: "View Section",
    edit: "Edit Section",
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
      PaperProps={{ className: "sm__paper" }}>
      <div className="sm__header">
        <div className="sm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="sm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="sm__content">
        {isView ? (
          <>
            <div className="sm__group">
              <p className="sm__group-label">Section Details</p>
              <div className="sm__field">
                <div className="sm__input-wrap sm__input-wrap--disabled">
                  <label className="sm__label">Section Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="sm__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={() => setMode("edit")}
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="sm__group">
              <p className="sm__group-label">Section Details</p>
              <div className="sm__field">
                <div
                  className={`sm__input-wrap${errors.name ? " sm__input-wrap--error" : ""}`}>
                  <label className="sm__label">
                    Section Name
                    <span className="sm__required">
                      <PushPinIcon />
                    </span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="sm__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="sm__footer">
              {selectedRow && (
                <button
                  type="button"
                  className="sm__back-btn"
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
                      : "Add Section"
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

export default SectionsModal;
