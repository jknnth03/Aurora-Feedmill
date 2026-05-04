import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
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
import CheckIcon from "@mui/icons-material/Check";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetPestsSheetByIdQuery,
  useCreatePestsSheetMutation,
  useUpdatePestsSheetMutation,
} from "../../../features/api/checklist-form/pestSheetApi";
import { useGetInspectionAreasQuery } from "../../../features/api/masterlist/inspectionAreaApi";
import { useGetPestsQuery } from "../../../features/api/masterlist/pestsApi";
import "./PestSheetModal.scss";

const schema = yup.object({
  inspection_area_ids: yup
    .array()
    .of(yup.number())
    .min(1, "Select at least one inspection area")
    .required(),
  pest_ids: yup
    .array()
    .of(yup.number())
    .min(1, "Select at least one pest")
    .required(),
});

const SkeletonLoader = () => (
  <div className="psm__skeleton-wrap">
    {[60, 80, 50, 70, 90, 55].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="psm__skeleton-footer">
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
              const selected = value.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  className={`psm__option${selected ? " psm__option--selected" : ""}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(opt.id);
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
          items.map((item) => (
            <span key={item.id} className="psm__chip">
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
    useGetPestsSheetByIdQuery(selectedId, {
      skip: !selectedId || !open,
    });

  const selectedRow = sheetData?.data ?? null;

  const [createPestsSheet, { isLoading: isCreating }] =
    useCreatePestsSheetMutation();
  const [updatePestsSheet, { isLoading: isUpdating }] =
    useUpdatePestsSheetMutation();
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
    defaultValues: { inspection_area_ids: [], pest_ids: [] },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      setAreasTouched(false);
      setPestsTouched(false);
      if (!selectedId) {
        reset({ inspection_area_ids: [], pest_ids: [] });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (selectedRow) {
      reset({
        inspection_area_ids:
          selectedRow.inspection_areas?.map((a) => a.id) ?? [],
        pest_ids: selectedRow.pests?.map((p) => p.id) ?? [],
      });
    }
  }, [selectedRow, reset]);

  const handleSwitchToEdit = () => {
    setAreasTouched(true);
    setPestsTouched(true);
    setMode("edit");
  };

  const onSubmit = async (form) => {
    // ✅ backend expects singular key names with array values
    const payload = {
      inspection_area_id: form.inspection_area_ids,
      pest_id: form.pest_ids,
    };
    try {
      if (mode === "edit") {
        await updatePestsSheet({ id: selectedId, ...payload }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Pest questionnaire updated successfully.",
          { variant: "success" },
        );
      } else {
        await createPestsSheet(payload).unwrap();
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
              <div className="psm__fields-row">
                <ViewChips
                  label="Inspection Areas"
                  items={selectedRow?.inspection_areas ?? []}
                />
                <ViewChips label="Pests" items={selectedRow?.pests ?? []} />
              </div>
            </div>
            <div className="psm__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={handleSwitchToEdit}
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="psm__group">
              <p className="psm__group-label">Pest Questionnaire Details</p>
              <div className="psm__fields-row">
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
                  name="pest_ids"
                  control={control}
                  render={({ field }) => (
                    <MultiSelectField
                      label="Pests"
                      options={pests}
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.pest_ids?.message}
                      isLoading={pestsLoading}
                      onFirstClick={() => setPestsTouched(true)}
                    />
                  )}
                />
              </div>
            </div>

            <div className="psm__footer">
              {selectedId && (
                <button
                  type="button"
                  className="psm__back-btn"
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
