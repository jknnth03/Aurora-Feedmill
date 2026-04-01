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
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetInfestationLevelByIdQuery,
  useCreateInfestationLevelMutation,
  useUpdateInfestationLevelMutation,
} from "../../../features/api/masterlist/infestationLevelApi";
import "./InfestationLevelModal.scss";

const TYPE_OPTIONS = ["radio button", "checkbox", "dropdown"];

const schema = yup.object({
  name: yup.string().required("Name is required"),
  type: yup
    .string()
    .oneOf(TYPE_OPTIONS, "Please select a valid type")
    .required("Type is required"),
});

const SkeletonLoader = () => (
  <div className="ilm__skeleton-wrap">
    {[50, 75, 60, 80].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="ilm__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

const InfestationLevelModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);
  const [typeOpen, setTypeOpen] = useState(false);

  const [createInfestationLevel, { isLoading: isCreating }] =
    useCreateInfestationLevelMutation();
  const [updateInfestationLevel, { isLoading: isUpdating }] =
    useUpdateInfestationLevelMutation();
  const isLoading = isCreating || isUpdating;

  const { data: levelData, isFetching: levelLoading } =
    useGetInfestationLevelByIdQuery(selectedId, {
      skip: !selectedId || !open,
    });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: "", type: "" },
  });

  const selectedType = watch("type");

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      setTypeOpen(false);
      if (!selectedId) {
        setSelectedRow(null);
        reset({ name: "", type: "" });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (levelData) {
      const data = levelData?.data ?? null;
      setSelectedRow(data);
      reset({
        name: data?.name ?? "",
        type: data?.type ?? "",
      });
    }
  }, [levelData, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateInfestationLevel({ id: selectedId, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Infestation level updated successfully.",
          { variant: "success" },
        );
      } else {
        await createInfestationLevel(form).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Infestation level created successfully.",
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
    add: <TuneIcon className="ilm__header-icon" />,
    view: <RemoveRedEyeIcon className="ilm__header-icon" />,
    edit: <EditIcon className="ilm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Infestation Level",
    view: "View Infestation Level",
    edit: "Edit Infestation Level",
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
      PaperProps={{ className: "ilm__paper" }}>
      <div className="ilm__header">
        <div className="ilm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="ilm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="ilm__content">
        {levelLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="ilm__group">
              <p className="ilm__group-label">Infestation Level Details</p>
              <div className="ilm__field" style={{ marginBottom: 14 }}>
                <div className="ilm__input-wrap ilm__input-wrap--disabled">
                  <label className="ilm__label">Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="ilm__field">
                <div className="ilm__input-wrap ilm__input-wrap--disabled">
                  <label className="ilm__label">Type</label>
                  <input
                    type="text"
                    value={selectedRow?.type ?? "—"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="ilm__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={() => setMode("edit")}
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="ilm__group">
              <p className="ilm__group-label">Infestation Level Details</p>

              {/* Name */}
              <div className="ilm__field" style={{ marginBottom: 14 }}>
                <div
                  className={`ilm__input-wrap${errors.name ? " ilm__input-wrap--error" : ""}`}>
                  <label className="ilm__label">
                    Name
                    <span className="ilm__required">
                      <PushPinIcon />
                    </span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="ilm__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>

              {/* Type dropdown */}
              <div className="ilm__field">
                <div
                  className={`ilm__select-wrap${errors.type ? " ilm__select-wrap--error" : ""}`}
                  onClick={() => setTypeOpen((p) => !p)}>
                  <label className="ilm__label">
                    Type
                    <span className="ilm__required">
                      <PushPinIcon />
                    </span>
                  </label>
                  <div className="ilm__select-box">
                    <span
                      className={
                        selectedType
                          ? "ilm__select-value"
                          : "ilm__select-placeholder"
                      }>
                      {selectedType || "Select type..."}
                    </span>
                    <ArrowDropDownIcon
                      className={`ilm__select-arrow${typeOpen ? " ilm__select-arrow--open" : ""}`}
                    />
                  </div>
                  {typeOpen && (
                    <div className="ilm__select-dropdown">
                      {TYPE_OPTIONS.map((opt) => (
                        <div
                          key={opt}
                          className={`ilm__select-option${selectedType === opt ? " ilm__select-option--selected" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setValue("type", opt, { shouldValidate: true });
                            setTypeOpen(false);
                          }}>
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.type && (
                  <p className="ilm__error">
                    <ReportProblemIcon />
                    {errors.type?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="ilm__footer">
              {selectedId && (
                <button
                  type="button"
                  className="ilm__back-btn"
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
                      : "Add Infestation Level"
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

export default InfestationLevelModal;
