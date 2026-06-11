import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import CloseIcon from "@mui/icons-material/Close";
import BugReportIcon from "@mui/icons-material/BugReport";
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
  useGetChecklistByIdQuery,
  useCreateChecklistMutation,
  useUpdateChecklistMutation,
} from "../../../features/api/questionnaires/pestQuestionnairesApi";
import { useGetInspectionAreasQuery } from "../../../features/api/masterlist/inspectionAreaApi";
import { useGetPestsQuery } from "../../../features/api/masterlist/pestTypesApi";
import "./PestSheetModal.scss";

const OTHER_OBSERVATION_ITEMS = [
  {
    name: "Cleanliness/Sanitation",
    sub_items: [
      { name: "Clean", type: "Checkbox" },
      { name: "Dirty", type: "Checkbox" },
    ],
  },
  {
    name: "Structural",
    sub_items: [
      { name: "Good", type: "Checkbox" },
      { name: "Defects", type: "Checkbox" },
    ],
  },
  {
    name: "Proper Ventilation",
    sub_items: [
      { name: "Yes", type: "Checkbox" },
      { name: "No", type: "Checkbox" },
    ],
  },
];

const schema = yup.object({
  checklist_name: yup.string().required("Checklist name is required"),
  inspection_area_names: yup
    .array()
    .of(yup.string())
    .min(1, "Select at least one inspection area")
    .required(),
  pest_names: yup
    .array()
    .of(yup.string())
    .min(1, "Select at least one pest")
    .required(),
});

const SkeletonLoader = () => (
  <div className="psm__skeleton-wrap">
    <div className="psm__skeleton-group">
      <span className="ut__skeleton psm__skeleton-label" />
      <span className="ut__skeleton psm__skeleton-field" />
    </div>
    <div className="psm__skeleton-group">
      <span className="ut__skeleton psm__skeleton-label" />
      <span className="ut__skeleton psm__skeleton-field" />
    </div>
    <div className="psm__skeleton-footer">
      <span className="ut__skeleton psm__skeleton-btn" />
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
    if (allSelected) {
      onChange([]);
    } else {
      onChange(options.map((o) => o.name));
    }
  };

  return (
    <div className="psm__field" onClick={onFirstClick}>
      <div
        className={`psm__multiselect${error ? " psm__multiselect--error" : ""}${disabled ? " psm__multiselect--disabled" : ""}`}>
        <label className="psm__label">
          {label}
          {!disabled && (
            <span className="psm__required">
              <PushPinIcon />
            </span>
          )}
        </label>
        {!disabled && !isLoading && options.length > 0 && (
          <div className="psm__multiselect-toolbar">
            <button
              type="button"
              className="psm__select-all-btn"
              onClick={handleSelectAll}>
              {allSelected ? "Deselect All" : "Select All"}
            </button>
            <span className="psm__selected-count">
              {value.length}/{options.length} selected
            </span>
          </div>
        )}
        <div className="psm__multiselect-body">
          {isLoading ? (
            <p className="psm__multiselect-empty">Loading...</p>
          ) : options.length === 0 ? (
            <p className="psm__multiselect-empty">Click to load options.</p>
          ) : (
            options.map((opt) => {
              const selected = value.includes(opt.name);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  className={`psm__option${selected ? " psm__option--selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(opt.name);
                  }}>
                  <span className="psm__option-check">
                    {selected && <CheckIcon />}
                  </span>
                  <span className="psm__option-label">{opt.name}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
      {error && (
        <p className="psm__error">
          <ReportProblemIcon />
          {error}
        </p>
      )}
    </div>
  );
};

const ViewChips = ({ label, items = [] }) => (
  <div className="psm__field">
    <div className="psm__multiselect psm__multiselect--disabled">
      <label className="psm__label">{label}</label>
      <div className="psm__chip-wrap">
        {items.length === 0 ? (
          <p className="psm__multiselect-empty">None assigned.</p>
        ) : (
          items.map((item, idx) => (
            <span key={idx} className="psm__chip">
              {item.name}
            </span>
          ))
        )}
      </div>
    </div>
  </div>
);

const PestSheetModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [areasTouched, setAreasTouched] = useState(false);
  const [pestsTouched, setPestsTouched] = useState(false);

  const { data: sheetData, isFetching: sheetLoading } =
    useGetChecklistByIdQuery(selectedId, {
      skip: !selectedId || !open,
    });

  const selectedRow = sheetData?.data ?? null;

  const [createChecklist, { isLoading: isCreating }] =
    useCreateChecklistMutation();
  const [updateChecklist, { isLoading: isUpdating }] =
    useUpdateChecklistMutation();
  const isLoading = isCreating || isUpdating;

  const { data: areasData, isFetching: areasLoading } =
    useGetInspectionAreasQuery(
      { status: "active", per_page: 100 },
      { skip: !areasTouched },
    );
  const { data: pestsData, isFetching: pestsLoading } = useGetPestsQuery(
    { status: 1, per_page: 100 },
    { skip: !pestsTouched },
  );

  const inspectionAreas = areasData?.data ?? [];
  const pests = pestsData?.data ?? [];

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
      pest_names: [],
    },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      setAreasTouched(false);
      setPestsTouched(false);
      if (!selectedId) {
        reset({
          checklist_name: "",
          inspection_area_names: [],
          pest_names: [],
        });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (selectedRow) {
      const inspectionAreasGroup = selectedRow.items?.find(
        (i) => i.name === "Inspection Areas",
      );
      const pestGroup = selectedRow.items?.find((i) => i.name === "Pest");
      reset({
        checklist_name: selectedRow.checklist_name ?? "",
        inspection_area_names:
          inspectionAreasGroup?.items?.map((i) => i.name) ?? [],
        pest_names: pestGroup?.items?.map((i) => i.name) ?? [],
      });
    }
  }, [selectedRow, reset]);

  const handleSwitchToEdit = () => {
    setAreasTouched(true);
    setPestsTouched(true);
    setMode("edit");
  };

  const onSubmit = async (form) => {
    const payload = {
      checklist_name: form.checklist_name,
      section_id: 2,
      items: [
        {
          name: "Inspection Areas",
          items: form.inspection_area_names.map((name) => ({ name })),
        },
        {
          name: "Pest",
          items: form.pest_names.map((name) => ({ name })),
        },
        {
          name: "Other Observation",
          items: OTHER_OBSERVATION_ITEMS,
        },
      ],
    };
    try {
      if (mode === "edit") {
        await updateChecklist({ id: selectedId, ...payload }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Pest questionnaire updated successfully.",
          { variant: "success" },
        );
      } else {
        await createChecklist(payload).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Pest questionnaire created successfully.",
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
    add: <BugReportIcon className="psm__header-icon" />,
    view: <RemoveRedEyeIcon className="psm__header-icon" />,
    edit: <EditIcon className="psm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Pest Questionnaire",
    view: "View Pest Questionnaire",
    edit: "Edit Pest Questionnaire",
  };

  const isView = mode === "view";

  const viewInspectionAreas =
    selectedRow?.items?.find((i) => i.name === "Inspection Areas")?.items ?? [];
  const viewPests =
    selectedRow?.items?.find((i) => i.name === "Pest")?.items ?? [];

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
      PaperProps={{ className: "psm__paper" }}>
      <div className="psm__header">
        <div className="psm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="psm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="psm__content">
        {sheetLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="psm__group">
              <p className="psm__group-label">Pest Questionnaire Details</p>
              <div className="psm__fields-col">
                <div className="psm__field">
                  <div className="psm__multiselect psm__multiselect--disabled">
                    <label className="psm__label">Checklist Name</label>
                    <p className="psm__view-text">
                      {selectedRow?.checklist_name || "—"}
                    </p>
                  </div>
                </div>
                <div className="psm__fields-row">
                  <ViewChips
                    label="Inspection Areas"
                    items={viewInspectionAreas}
                  />
                  <ViewChips label="Pests" items={viewPests} />
                </div>
              </div>
            </div>
            <div className="psm__footer">
              <EditButton onClick={handleSwitchToEdit} />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="psm__group">
              <p className="psm__group-label">Pest Questionnaire Details</p>
              <div className="psm__fields-col">
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
                      className="psm__textfield"
                    />
                  )}
                />
                <div className="psm__fields-row">
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
                    name="pest_names"
                    control={control}
                    render={({ field }) => (
                      <MultiSelectField
                        label="Pests"
                        options={pests}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.pest_names?.message}
                        isLoading={pestsLoading}
                        onFirstClick={() => setPestsTouched(true)}
                      />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="psm__footer">
              {selectedId && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Pest Questionnaire"
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

export default PestSheetModal;
