import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useCreateChecklistMutation,
  useUpdateChecklistMutation,
} from "../../../features/api/masterlist/checklistApi";
import { useGetSectionsQuery } from "../../../features/api/masterlist/sectionsApi";
import "./ChecklistsModal.scss";

const schema = yup.object({
  name: yup.string().required("Checklist name is required"),
  section_id: yup
    .number()
    .required("Section is required")
    .typeError("Section is required"),
});

const SectionAutocomplete = ({ value, onChange, error, displayValue }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const { data, isFetching } = useGetSectionsQuery(
    { status: 1, search, page: 1, per_page: 50 },
    { skip: !open },
  );
  const options = data?.data?.data ?? [];
  const selected = options.find((s) => s.id === value) ?? null;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (section) => {
    onChange(section.id);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className={`cm__ac${error ? " cm__ac--error" : ""}`} ref={wrapRef}>
      <label className="cm__label">
        Section
        <span className="cm__required">
          <PushPinIcon />
        </span>
      </label>

      <div className="cm__ac-box" onClick={() => setOpen((p) => !p)}>
        {open ? (
          <div className="cm__ac-search-wrap">
            <SearchIcon
              sx={{ fontSize: "0.9rem", flexShrink: 0, color: "inherit" }}
            />
            <input
              autoFocus
              type="text"
              placeholder="Search section..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="cm__ac-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <span
            className={
              selected || displayValue ? "cm__ac-value" : "cm__ac-placeholder"
            }>
            {selected ? selected.name : displayValue || "Select section..."}
          </span>
        )}
        <span className="cm__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>

      {open && (
        <div className="cm__ac-dropdown">
          <div className="cm__ac-options">
            {isFetching ? (
              <p className="cm__ac-empty">Loading...</p>
            ) : options.length === 0 ? (
              <p className="cm__ac-empty">No sections found</p>
            ) : (
              options.map((s) => (
                <div
                  key={s.id}
                  className={`cm__ac-option${value === s.id ? " cm__ac-option--selected" : ""}`}
                  onClick={() => handleSelect(s)}>
                  {s.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ChecklistModal = ({ open, onClose, selectedRow = null }) => {
  const [mode, setMode] = useState("add");

  const [createChecklist, { isLoading: isCreating }] =
    useCreateChecklistMutation();
  const [updateChecklist, { isLoading: isUpdating }] =
    useUpdateChecklistMutation();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: "", section_id: "" },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedRow ? "view" : "add");
      reset({
        name: selectedRow ? (selectedRow.name ?? "") : "",
        section_id: selectedRow ? (selectedRow.section?.id ?? "") : "",
      });
    }
  }, [open, selectedRow, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateChecklist({ id: selectedRow.id, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Checklist updated successfully.",
          {
            variant: "success",
          },
        );
      } else {
        await createChecklist(form).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "Checklist created successfully.",
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
    add: <ChecklistIcon className="cm__header-icon" />,
    view: <RemoveRedEyeIcon className="cm__header-icon" />,
    edit: <EditIcon className="cm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Checklist",
    view: "View Checklist",
    edit: "Edit Checklist",
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
      PaperProps={{ className: "cm__paper" }}>
      <div className="cm__header">
        <div className="cm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="cm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="cm__content">
        {isView ? (
          <>
            <div className="cm__group">
              <p className="cm__group-label">Checklist Details</p>
              <div className="cm__field" style={{ marginBottom: 14 }}>
                <div className="cm__input-wrap cm__input-wrap--disabled">
                  <label className="cm__label">Checklist Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="cm__field">
                <div className="cm__input-wrap cm__input-wrap--disabled">
                  <label className="cm__label">Section</label>
                  <input
                    type="text"
                    value={selectedRow?.section?.name ?? "—"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="cm__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={() => setMode("edit")}
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="cm__group">
              <p className="cm__group-label">Checklist Details</p>
              <div className="cm__field" style={{ marginBottom: 14 }}>
                <div
                  className={`cm__input-wrap${errors.name ? " cm__input-wrap--error" : ""}`}>
                  <label className="cm__label">
                    Checklist Name
                    <span className="cm__required">
                      <PushPinIcon />
                    </span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="cm__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="cm__group">
              <p className="cm__group-label">Section</p>
              <Controller
                name="section_id"
                control={control}
                render={({ field }) => (
                  <SectionAutocomplete
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.section_id}
                    displayValue={selectedRow?.section?.name}
                  />
                )}
              />
              {errors.section_id && (
                <p className="cm__error" style={{ marginTop: 6 }}>
                  <ReportProblemIcon />
                  {errors.section_id?.message}
                </p>
              )}
            </div>

            <div className="cm__footer">
              {selectedRow && (
                <button
                  type="button"
                  className="cm__back-btn"
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
                      : "Add Checklist"
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

export default ChecklistModal;
