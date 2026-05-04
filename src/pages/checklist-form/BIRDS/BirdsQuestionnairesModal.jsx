import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import FlutterDashIcon from "@mui/icons-material/FlutterDash";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CheckIcon from "@mui/icons-material/Check";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetBirdByIdQuery,
  useCreateBirdMutation,
  useUpdateBirdMutation,
} from "../../../features/api/checklist-form/birdsApi";
import { useGetInspectionAreasQuery } from "../../../features/api/masterlist/inspectionAreaApi";
import { useGetInfestationLevelsQuery } from "../../../features/api/masterlist/infestationLevelApi";
import "./BirdsQuestionnairesModal.scss";

const schema = yup.object({
  inspection_area_ids: yup
    .array()
    .of(yup.number())
    .min(1, "Select at least one inspection area")
    .required(),
  infestation_level_ids: yup
    .array()
    .of(yup.number())
    .min(1, "Select at least one infestation level")
    .required(),
});

const SkeletonLoader = () => (
  <div className="bm__skeleton-wrap">
    {[60, 80, 50, 70, 90, 55].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="bm__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "30%" }} />
    </div>
  </div>
);

const MultiSelectField = ({
  label,
  options = [],
  value = [],
  onChange,
  error,
  disabled = false,
  isLoading = false,
  onFirstClick,
}) => {
  const toggle = (id) => {
    if (disabled) return;
    const next = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    onChange(next);
  };

  const allSelected =
    options.length > 0 && options.every((o) => value.includes(o.id));

  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.id));
    }
  };

  return (
    <div className="bm__field" onClick={onFirstClick}>
      <div
        className={`bm__multiselect${error ? " bm__multiselect--error" : ""}${disabled ? " bm__multiselect--disabled" : ""}`}>
        <label className="bm__label">
          {label}
          {!disabled && (
            <span className="bm__required">
              <PushPinIcon />
            </span>
          )}
        </label>
        {!disabled && !isLoading && options.length > 0 && (
          <div className="bm__multiselect-toolbar">
            <button
              type="button"
              className="bm__select-all-btn"
              onClick={handleSelectAll}>
              {allSelected ? "Deselect All" : "Select All"}
            </button>
            <span className="bm__selected-count">
              {value.length}/{options.length} selected
            </span>
          </div>
        )}
        <div className="bm__multiselect-body">
          {isLoading ? (
            <p className="bm__multiselect-empty">Loading...</p>
          ) : options.length === 0 ? (
            <p className="bm__multiselect-empty">Click to load options.</p>
          ) : (
            options.map((opt) => {
              const selected = value.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  className={`bm__option${selected ? " bm__option--selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(opt.id);
                  }}>
                  <span className="bm__option-check">
                    {selected && <CheckIcon />}
                  </span>
                  <span className="bm__option-label">{opt.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
      {error && (
        <p className="bm__error">
          <ReportProblemIcon />
          {error}
        </p>
      )}
    </div>
  );
};

const ViewChips = ({ label, items = [] }) => (
  <div className="bm__field">
    <div className="bm__multiselect bm__multiselect--disabled">
      <label className="bm__label">{label}</label>
      <div className="bm__chip-wrap">
        {items.length === 0 ? (
          <p className="bm__multiselect-empty">None assigned.</p>
        ) : (
          items.map((item) => (
            <span key={item.id} className="bm__chip">
              {item.name}
            </span>
          ))
        )}
      </div>
    </div>
  </div>
);

const BirdsQuestionnairesModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [areasTouched, setAreasTouched] = useState(false);
  const [infestationTouched, setInfestationTouched] = useState(false);

  const { data: birdData, isFetching: birdLoading } = useGetBirdByIdQuery(
    selectedId,
    { skip: !selectedId || !open },
  );

  const selectedRow = birdData?.data ?? null;

  const [createBird, { isLoading: isCreating }] = useCreateBirdMutation();
  const [updateBird, { isLoading: isUpdating }] = useUpdateBirdMutation();
  const isLoading = isCreating || isUpdating;

  const { data: areasData, isFetching: areasLoading } =
    useGetInspectionAreasQuery(
      { status: "active", per_page: 100 },
      { skip: !areasTouched },
    );
  const { data: infestationData, isFetching: infestationLoading } =
    useGetInfestationLevelsQuery(
      { status: 1, per_page: 100 },
      { skip: !infestationTouched },
    );

  const inspectionAreas = areasData?.data?.data ?? [];
  const infestationLevels = infestationData?.data?.data ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      inspection_area_ids: [],
      infestation_level_ids: [],
    },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      setAreasTouched(false);
      setInfestationTouched(false);
      if (!selectedId) {
        reset({
          inspection_area_ids: [],
          infestation_level_ids: [],
        });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (selectedRow) {
      reset({
        inspection_area_ids:
          selectedRow.inspection_areas?.map((a) => a.id) ?? [],
        infestation_level_ids:
          selectedRow.infestation_levels?.map((l) => l.id) ?? [],
      });
    }
  }, [selectedRow, reset]);

  const handleSwitchToEdit = () => {
    setAreasTouched(true);
    setInfestationTouched(true);
    setMode("edit");
  };

  const onSubmit = async (form) => {
    const payload = {
      inspection_area_id: form.inspection_area_ids,
      infestation_level_id: form.infestation_level_ids,
    };
    try {
      if (mode === "edit") {
        await updateBird({ id: selectedId, ...payload }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Bird Questionnaire updated successfully.",
          { variant: "success" },
        );
      } else {
        await createBird(payload).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Bird Questionnaire created successfully.",
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
    add: <FlutterDashIcon className="bm__header-icon" />,
    view: <RemoveRedEyeIcon className="bm__header-icon" />,
    edit: <EditIcon className="bm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Bird Questionnaire",
    view: "View Bird Questionnaire",
    edit: "Edit Bird Questionnaire",
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
      PaperProps={{ className: "bm__paper" }}>
      <div className="bm__header">
        <div className="bm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="bm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="bm__content">
        {birdLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="bm__group">
              <p className="bm__group-label">Bird Questionnaire Details</p>
              <div className="bm__fields-row">
                <ViewChips
                  label="Inspection Areas"
                  items={selectedRow?.inspection_areas ?? []}
                />
                <ViewChips
                  label="Infestation Levels"
                  items={selectedRow?.infestation_levels ?? []}
                />
              </div>
            </div>
            <div className="bm__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={handleSwitchToEdit}
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="bm__group">
              <p className="bm__group-label">Bird Questionnaire Details</p>
              <div className="bm__fields-row">
                <Controller
                  name="inspection_area_ids"
                  control={control}
                  render={({ field }) => (
                    <MultiSelectField
                      label="Inspection Areas"
                      options={inspectionAreas}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.inspection_area_ids?.message}
                      isLoading={areasLoading}
                      onFirstClick={() => setAreasTouched(true)}
                    />
                  )}
                />
                <Controller
                  name="infestation_level_ids"
                  control={control}
                  render={({ field }) => (
                    <MultiSelectField
                      label="Infestation Levels"
                      options={infestationLevels}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.infestation_level_ids?.message}
                      isLoading={infestationLoading}
                      onFirstClick={() => setInfestationTouched(true)}
                    />
                  )}
                />
              </div>
            </div>

            <div className="bm__footer">
              {selectedId && (
                <button
                  type="button"
                  className="bm__back-btn"
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
                      : "Add Bird Questionnaire"
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

export default BirdsQuestionnairesModal;
