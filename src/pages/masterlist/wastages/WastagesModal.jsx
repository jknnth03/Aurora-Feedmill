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
  useGetWastageByIdQuery,
  useCreateWastageMutation,
  useUpdateWastageMutation,
} from "../../../features/api/masterlist/wastagesApi";
import "./WastagesModal.scss";

const schema = yup.object({
  name: yup.string().required("Name is required"),
});

const SkeletonLoader = () => (
  <div className="wm__skeleton-wrap">
    {[50, 75, 60, 80].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="wm__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

const WastagesModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createWastage, { isLoading: isCreating }] = useCreateWastageMutation();
  const [updateWastage, { isLoading: isUpdating }] = useUpdateWastageMutation();
  const isLoading = isCreating || isUpdating;

  const { data: wastageData, isFetching: wastageLoading } =
    useGetWastageByIdQuery(selectedId, {
      skip: !selectedId || !open,
    });

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
    if (wastageData) {
      const data = wastageData?.data ?? null;
      setSelectedRow(data);
      reset({ name: data?.name ?? "" });
    }
  }, [wastageData, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateWastage({ id: selectedId, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Wastage updated successfully.", {
          variant: "success",
        });
      } else {
        await createWastage(form).unwrap();
        window.__snackbar__?.enqueueSnackbar("Wastage created successfully.", {
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
    add: <TuneIcon className="wm__header-icon" />,
    view: <RemoveRedEyeIcon className="wm__header-icon" />,
    edit: <EditIcon className="wm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Wastage",
    view: "View Wastage",
    edit: "Edit Wastage",
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
      PaperProps={{ className: "wm__paper" }}>
      <div className="wm__header">
        <div className="wm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="wm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="wm__content">
        {wastageLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="wm__group">
              <p className="wm__group-label">Wastage Details</p>
              <div className="wm__field">
                <div className="wm__input-wrap wm__input-wrap--disabled">
                  <label className="wm__label">Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="wm__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={() => setMode("edit")}
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="wm__group">
              <p className="wm__group-label">Wastage Details</p>
              <div className="wm__field">
                <div
                  className={`wm__input-wrap${errors.name ? " wm__input-wrap--error" : ""}`}>
                  <label className="wm__label">
                    Name
                    <span className="wm__required">
                      <PushPinIcon />
                    </span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="wm__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="wm__footer">
              {selectedId && (
                <button
                  type="button"
                  className="wm__back-btn"
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
                      : "Add Wastage"
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

export default WastagesModal;
