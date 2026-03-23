import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import MapIcon from "@mui/icons-material/Map";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useCreateInspectionAreaMutation,
  useUpdateInspectionAreaMutation,
} from "../../../features/api/masterlist/inspectionAreaApi";
import "./InspectionAreasModal.scss";

const schema = yup.object({
  name: yup.string().required("Inspection area name is required"),
});

const InspectionAreasModal = ({ open, onClose, selectedRow = null }) => {
  const [mode, setMode] = useState("add");

  const [createInspectionArea, { isLoading: isCreating }] =
    useCreateInspectionAreaMutation();
  const [updateInspectionArea, { isLoading: isUpdating }] =
    useUpdateInspectionAreaMutation();
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
      reset({ name: selectedRow?.name ?? "" });
    }
  }, [open, selectedRow, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateInspectionArea({ id: selectedRow.id, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Inspection area updated successfully.",
          { variant: "success" },
        );
      } else {
        await createInspectionArea(form).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Inspection area created successfully.",
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
    add: <MapIcon className="iam__header-icon" />,
    view: <RemoveRedEyeIcon className="iam__header-icon" />,
    edit: <EditIcon className="iam__header-icon" />,
  };

  const headerTitle = {
    add: "Add Inspection Area",
    view: "View Inspection Area",
    edit: "Edit Inspection Area",
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
      PaperProps={{ className: "iam__paper" }}>
      <div className="iam__header">
        <div className="iam__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="iam__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="iam__content">
        {isView ? (
          <>
            <div className="iam__group">
              <p className="iam__group-label">Inspection Area Details</p>
              <div className="iam__field">
                <div className="iam__input-wrap iam__input-wrap--disabled">
                  <label className="iam__label">Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="iam__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={() => setMode("edit")}
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="iam__group">
              <p className="iam__group-label">Inspection Area Details</p>
              <div className="iam__field">
                <div
                  className={`iam__input-wrap${errors.name ? " iam__input-wrap--error" : ""}`}>
                  <label className="iam__label">
                    Name
                    <span className="iam__required">
                      <PushPinIcon />
                    </span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="iam__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="iam__footer">
              {selectedRow && (
                <button
                  type="button"
                  className="iam__back-btn"
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
                      : "Add Inspection Area"
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

export default InspectionAreasModal;
