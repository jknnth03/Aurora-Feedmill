import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";
import FlutterDashIcon from "@mui/icons-material/FlutterDash";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import CheckIcon from "@mui/icons-material/Check";
import {
  SaveButton,
  EditButton,
  BackModalButton,
} from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetBirdChecklistByIdQuery,
  useCreateBirdChecklistMutation,
  useUpdateBirdChecklistMutation,
} from "../../../features/api/questionnaires/birdsQuestionnairesApi";
import { useGetInspectionAreasQuery } from "../../../features/api/masterlist/inspectionAreaApi";
import "./BirdsQuestionnairesModal.scss";

const INFESTATION_LEVELS = [
  { id: "low", name: "Low" },
  { id: "average", name: "Average" },
  { id: "moderate", name: "Moderate" },
];

const STATIC_ITEMS = [
  { name: "Treatment/Action Dose" },
  {
    name: "Presence of Feed/RM Wastage",
    items: [{ name: "FG Spillage" }, { name: "RM Spillage" }],
  },
  { name: "Identify entry points/Saan sila pumapasok o Dumadaan" },
];

const schema = yup.object({
  checklist_name: yup.string().required("Checklist name is required"),
  inspection_area_names: yup
    .array()
    .of(yup.string())
    .min(1, "Select at least one inspection area")
    .required(),
  infestation_level_names: yup
    .array()
    .of(yup.string())
    .min(1, "Select at least one infestation level")
    .required(),
});

const SkeletonLoader = () => (
  <div className="bm__skeleton-wrap">
    <div className="bm__skeleton-group">
      <span className="ut__skeleton bm__skeleton-label" />
      <span className="ut__skeleton bm__skeleton-field" />
    </div>
    <div className="bm__skeleton-group">
      <span className="ut__skeleton bm__skeleton-label" />
      <span className="ut__skeleton bm__skeleton-field" />
    </div>
    <div className="bm__skeleton-footer">
      <span className="ut__skeleton bm__skeleton-btn" />
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
  const toggle = (name) => {
    if (disabled) return;
    const next = value.includes(name)
      ? value.filter((v) => v !== name)
      : [...value, name];
    onChange(next);
  };

  const allSelected =
    options.length > 0 && options.every((o) => value.includes(o.name));

  const handleSelectAll = (e) => {
    e.stopPropagation();
    onChange(allSelected ? [] : options.map((o) => o.name));
  };

  return (
    <div className="bm__field" onClick={onFirstClick}>
      <div
        className={`bm__multiselect${error ? " bm__multiselect--error" : ""}${
          disabled ? " bm__multiselect--disabled" : ""
        }`}>
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
              const selected = value.includes(opt.name);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  className={`bm__option${selected ? " bm__option--selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(opt.name);
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
          items.map((item, idx) => (
            <span key={idx} className="bm__chip">
              {item.name}
            </span>
          ))
        )}
      </div>
    </div>
  </div>
);

const buildPayload = (form) => ({
  checklist_name: form.checklist_name,
  section_id: 3,
  items: [
    {
      name: "Inspection Areas",
      items: form.inspection_area_names.map((name) => ({ name })),
    },
    {
      name: "Infestation Level",
      items: form.infestation_level_names.map((name) => ({ name })),
    },
    ...STATIC_ITEMS,
  ],
});

const BirdsQuestionnairesModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [areasTouched, setAreasTouched] = useState(false);

  const { data: birdData, isFetching: birdLoading } =
    useGetBirdChecklistByIdQuery(selectedId, {
      skip: !selectedId || !open,
    });
  const selectedRow = birdData?.data ?? null;

  const [createBirdChecklist, { isLoading: isCreating }] =
    useCreateBirdChecklistMutation();
  const [updateBirdChecklist, { isLoading: isUpdating }] =
    useUpdateBirdChecklistMutation();
  const isLoading = isCreating || isUpdating;

  const { data: areasData, isFetching: areasLoading } =
    useGetInspectionAreasQuery(
      { status: "active", per_page: 100 },
      { skip: !areasTouched },
    );
  const inspectionAreas = areasData?.data ?? [];

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      checklist_name: "",
      inspection_area_names: [],
      infestation_level_names: [],
    },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      setAreasTouched(false);
      if (!selectedId) {
        reset({
          checklist_name: "",
          inspection_area_names: [],
          infestation_level_names: [],
        });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (selectedRow) {
      const areasGroup = selectedRow.items?.find(
        (i) => i.name === "Inspection Areas",
      );
      const levelGroup = selectedRow.items?.find(
        (i) => i.name === "Infestation Level",
      );
      reset({
        checklist_name: selectedRow.checklist_name ?? "",
        inspection_area_names: areasGroup?.items?.map((i) => i.name) ?? [],
        infestation_level_names: levelGroup?.items?.map((i) => i.name) ?? [],
      });
    }
  }, [selectedRow, reset]);

  const handleSwitchToEdit = () => {
    setAreasTouched(true);
    setMode("edit");
  };

  const onSubmit = async (form) => {
    const payload = buildPayload(form);
    try {
      if (mode === "edit") {
        await updateBirdChecklist({ id: selectedId, ...payload }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Bird Questionnaire updated successfully.",
          { variant: "success" },
        );
      } else {
        await createBirdChecklist(payload).unwrap();
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

  const viewAreas =
    selectedRow?.items?.find((i) => i.name === "Inspection Areas")?.items ?? [];
  const viewLevels =
    selectedRow?.items?.find((i) => i.name === "Infestation Level")?.items ??
    [];

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
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
              <div className="bm__fields-col">
                <div className="bm__field">
                  <div className="bm__multiselect bm__multiselect--disabled">
                    <label className="bm__label">Checklist Name</label>
                    <p className="bm__view-text">
                      {selectedRow?.checklist_name || "—"}
                    </p>
                  </div>
                </div>
                <div className="bm__fields-row">
                  <ViewChips label="Inspection Areas" items={viewAreas} />
                  <ViewChips label="Infestation Level" items={viewLevels} />
                </div>
              </div>
            </div>
            <div className="bm__footer">
              <EditButton onClick={handleSwitchToEdit} />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="bm__group">
              <p className="bm__group-label">Bird Questionnaire Details</p>
              <div className="bm__fields-col">
                <Controller
                  name="checklist_name"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Checklist Name"
                      fullWidth
                      size="small"
                      error={!!errors.checklist_name}
                      helperText={errors.checklist_name?.message}
                      className="bm__textfield"
                    />
                  )}
                />

                <div className="bm__fields-row">
                  <Controller
                    name="inspection_area_names"
                    control={control}
                    render={({ field }) => (
                      <MultiSelectField
                        label="Inspection Areas"
                        options={inspectionAreas}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.inspection_area_names?.message}
                        isLoading={areasLoading}
                        onFirstClick={() => setAreasTouched(true)}
                      />
                    )}
                  />

                  <Controller
                    name="infestation_level_names"
                    control={control}
                    render={({ field }) => (
                      <MultiSelectField
                        label="Infestation Level"
                        options={INFESTATION_LEVELS}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.infestation_level_names?.message}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="bm__footer">
              {selectedId && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
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
