import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import TuneIcon from "@mui/icons-material/Tune";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetUnitByIdQuery,
  useCreateUnitMutation,
  useUpdateUnitMutation,
} from "../../../features/api/masterlist/unitsApi";
import "./UnitsModal.scss";

const schema = yup.object({
  name: yup.string().required("Name is required"),
});

const SkeletonLoader = () => (
  <div className="um__skeleton-wrap">
    {[50, 75, 60, 80].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="um__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

const UnitsModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createUnit, { isLoading: isCreating }] = useCreateUnitMutation();
  const [updateUnit, { isLoading: isUpdating }] = useUpdateUnitMutation();
  const isLoading = isCreating || isUpdating;

  const { data: unitData, isFetching: unitLoading } = useGetUnitByIdQuery(
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
    if (unitData) {
      const data = unitData?.data ?? null;
      setSelectedRow(data);
      reset({ name: data?.name ?? "" });
    }
  }, [unitData, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateUnit({ id: selectedId, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Unit updated successfully.", {
          variant: "success",
        });
      } else {
        await createUnit(form).unwrap();
        window.__snackbar__?.enqueueSnackbar("Unit created successfully.", {
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
    add: <TuneIcon className="um__header-icon" />,
    view: <RemoveRedEyeIcon className="um__header-icon" />,
    edit: <EditIcon className="um__header-icon" />,
  };

  const headerTitle = {
    add: "Add Unit",
    view: "View Unit",
    edit: "Edit Unit",
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
      PaperProps={{ className: "um__paper" }}>
      <div className="um__header">
        <div className="um__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="um__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="um__content">
        {unitLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="um__group">
              <p className="um__group-label">Unit Details</p>
              <div className="um__field">
                <div className="um__input-wrap um__input-wrap--disabled">
                  <label className="um__label">Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="um__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={() => setMode("edit")}
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="um__group">
              <p className="um__group-label">Unit Details</p>
              <div className="um__field">
                <div
                  className={`um__input-wrap${errors.name ? " um__input-wrap--error" : ""}`}>
                  <label className="um__label">
                    Name
                    <span className="um__required">
                      <PushPinIcon />
                    </span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="um__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="um__footer">
              {selectedId && (
                <button
                  type="button"
                  className="um__back-btn"
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
                      : "Add Unit"
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

export default UnitsModal;
