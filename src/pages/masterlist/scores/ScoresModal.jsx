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
  useGetScoreByIdQuery,
  useCreateScoreMutation,
  useUpdateScoreMutation,
} from "../../../features/api/masterlist/scoresApi";
import "./ScoresModal.scss";

const schema = yup.object({
  score: yup
    .number()
    .typeError("Score must be a number")
    .required("Score is required"),
  rating: yup
    .number()
    .typeError("Rating must be a number")
    .required("Rating is required"),
});

const SkeletonLoader = () => (
  <div className="sm__skeleton-wrap">
    {[50, 75, 60, 80].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="sm__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

const ScoresModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createScore, { isLoading: isCreating }] = useCreateScoreMutation();
  const [updateScore, { isLoading: isUpdating }] = useUpdateScoreMutation();
  const isLoading = isCreating || isUpdating;

  const { data: scoreData, isFetching: scoreLoading } = useGetScoreByIdQuery(
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
    defaultValues: { score: "", rating: "" },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      if (!selectedId) {
        setSelectedRow(null);
        reset({ score: "", rating: "" });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (scoreData) {
      const data = scoreData?.data ?? null;
      setSelectedRow(data);
      reset({
        score: data?.score ?? "",
        rating: data?.rating ?? "",
      });
    }
  }, [scoreData, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateScore({ id: selectedId, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Score updated successfully.", {
          variant: "success",
        });
      } else {
        await createScore(form).unwrap();
        window.__snackbar__?.enqueueSnackbar("Score created successfully.", {
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
    add: <TuneIcon className="sm__header-icon" />,
    view: <RemoveRedEyeIcon className="sm__header-icon" />,
    edit: <EditIcon className="sm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Score",
    view: "View Score",
    edit: "Edit Score",
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
        {scoreLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="sm__group">
              <p className="sm__group-label">Score Details</p>
              <div className="sm__field" style={{ marginBottom: 14 }}>
                <div className="sm__input-wrap sm__input-wrap--disabled">
                  <label className="sm__label">Score</label>
                  <input
                    type="text"
                    value={selectedRow?.score ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="sm__field">
                <div className="sm__input-wrap sm__input-wrap--disabled">
                  <label className="sm__label">Rating</label>
                  <input
                    type="text"
                    value={selectedRow?.rating ?? ""}
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
              <p className="sm__group-label">Score Details</p>

              <div className="sm__field" style={{ marginBottom: 14 }}>
                <div
                  className={`sm__input-wrap${errors.score ? " sm__input-wrap--error" : ""}`}>
                  <label className="sm__label">
                    Score
                    <span className="sm__required">
                      <PushPinIcon />
                    </span>
                  </label>
                  <input
                    type="number"
                    {...register("score")}
                    autoComplete="off"
                  />
                </div>
                {errors.score && (
                  <p className="sm__error">
                    <ReportProblemIcon />
                    {errors.score?.message}
                  </p>
                )}
              </div>

              <div className="sm__field">
                <div
                  className={`sm__input-wrap${errors.rating ? " sm__input-wrap--error" : ""}`}>
                  <label className="sm__label">
                    Rating
                    <span className="sm__required">
                      <PushPinIcon />
                    </span>
                  </label>
                  <input
                    type="number"
                    {...register("rating")}
                    autoComplete="off"
                  />
                </div>
                {errors.rating && (
                  <p className="sm__error">
                    <ReportProblemIcon />
                    {errors.rating?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="sm__footer">
              {selectedId && (
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
                      : "Add Score"
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

export default ScoresModal;
