import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import BugReportIcon from "@mui/icons-material/BugReport";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import {
  SaveButton,
  EditButton,
  BackModalButton,
} from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetPestTypeByIdQuery,
  useCreatePestTypeMutation,
  useUpdatePestTypeMutation,
} from "../../../features/api/masterlist/pestTypesApi";
import "./PestTypesModal.scss";

const schema = yup.object({
  name: yup.string().required("Pest name is required"),
});

const SkeletonLoader = () => (
  <div className="ptm__skeleton-wrap">
    <div className="ptm__skeleton-group">
      <span className="ut__skeleton ptm__skeleton-label" />
      <span className="ut__skeleton ptm__skeleton-field" />
    </div>
    <div className="ptm__skeleton-footer">
      <span className="ut__skeleton ptm__skeleton-btn" />
    </div>
  </div>
);

const PestTypesModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createPestType, { isLoading: isCreating }] =
    useCreatePestTypeMutation();
  const [updatePestType, { isLoading: isUpdating }] =
    useUpdatePestTypeMutation();
  const isLoading = isCreating || isUpdating;

  const { data: pestData, isFetching: pestLoading } = useGetPestTypeByIdQuery(
    selectedId,
    { skip: !selectedId || !open },
  );

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
      setMode(selectedId ? "view" : "add");
      if (!selectedId) {
        setSelectedRow(null);
        reset({ name: "" });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (pestData) {
      const data = pestData?.data ?? null;
      setSelectedRow(data);
      reset({ name: data?.name ?? "" });
    }
  }, [pestData, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updatePestType({ id: selectedId, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Pest type updated successfully.",
          {
            variant: "success",
          },
        );
      } else {
        await createPestType(form).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Pest type created successfully.",
          {
            variant: "success",
          },
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
    add: <BugReportIcon className="ptm__header-icon" />,
    view: <RemoveRedEyeIcon className="ptm__header-icon" />,
    edit: <EditIcon className="ptm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Pest Type",
    view: "View Pest Type",
    edit: "Edit Pest Type",
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
      PaperProps={{ className: "ptm__paper" }}>
      <div className="ptm__header">
        <div className="ptm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="ptm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="ptm__content">
        {pestLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="ptm__group">
              <p className="ptm__group-label">Pest Type Details</p>
              <div className="ptm__field">
                <div className="ptm__input-wrap ptm__input-wrap--disabled">
                  <label className="ptm__label">Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="ptm__footer">
              <EditButton onClick={() => setMode("edit")} />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="ptm__group">
              <p className="ptm__group-label">Pest Type Details</p>
              <div className="ptm__field">
                <div
                  className={`ptm__input-wrap${errors.name ? " ptm__input-wrap--error" : ""}`}>
                  <label className="ptm__label">
                    Name
                    <span className="ptm__required">
                      <PushPinIcon />
                    </span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="ptm__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="ptm__footer">
              {selectedId && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Pest Type"
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

export default PestTypesModal;
