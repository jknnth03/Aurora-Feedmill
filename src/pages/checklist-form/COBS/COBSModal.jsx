import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AssignmentIcon from "@mui/icons-material/Assignment";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useCreateCobsMutation,
  useUpdateCobsMutation,
} from "../../../features/api/checklist-form/cobsApi";
import "./COBSModal.scss";

const itemSchema = yup.object({
  name: yup.string().required("Item name is required"),
  type: yup.string().required("Type is required"),
});

const formSchema = yup.object({
  name: yup.string().required("Area/section name is required"),
  item: yup.array().of(itemSchema).min(1, "At least one item is required"),
});

const schema = yup.object({
  checklist_id: yup
    .number()
    .required("Checklist ID is required")
    .typeError("Checklist ID is required"),
  forms: yup
    .array()
    .of(formSchema)
    .min(1, "At least one form section is required"),
});

const TYPE_OPTIONS = ["radio button", "checkbox", "text input"];

const FormSection = ({
  formIdx,
  control,
  register,
  errors,
  onRemove,
  canRemove,
}) => {
  const {
    fields: itemFields,
    append: appendItem,
    remove: removeItem,
  } = useFieldArray({ control, name: `forms.${formIdx}.item` });

  const sectionError = errors?.forms?.[formIdx];

  return (
    <div className="cobsm__section-card">
      <div className="cobsm__section-card-header">
        <span className="cobsm__section-badge">Section {formIdx + 1}</span>
        {canRemove && (
          <button
            type="button"
            className="cobsm__remove-btn"
            onClick={onRemove}>
            <DeleteOutlineIcon sx={{ fontSize: "0.9rem" }} />
          </button>
        )}
      </div>

      <div className="cobsm__field" style={{ marginBottom: 14 }}>
        <div
          className={`cobsm__input-wrap${sectionError?.name ? " cobsm__input-wrap--error" : ""}`}>
          <label className="cobsm__label">Area / Section Name</label>
          <input
            type="text"
            {...register(`forms.${formIdx}.name`)}
            autoComplete="off"
            placeholder="e.g. UV Cabinets"
          />
        </div>
        {sectionError?.name && (
          <p className="cobsm__error">
            <ReportProblemIcon />
            {sectionError.name.message}
          </p>
        )}
      </div>

      <div className="cobsm__items-wrap">
        <div className="cobsm__items-header">
          <p className="cobsm__sub-label">Items</p>
          <button
            type="button"
            className="cobsm__add-item-btn"
            onClick={() => appendItem({ name: "", type: "radio button" })}>
            <AddIcon sx={{ fontSize: "0.8rem" }} />
            Add Item
          </button>
        </div>

        {itemFields.map((itemField, itemIdx) => (
          <div key={itemField.id} className="cobsm__item-row">
            <div
              className={`cobsm__input-wrap cobsm__input-wrap--grow${sectionError?.item?.[itemIdx]?.name ? " cobsm__input-wrap--error" : ""}`}>
              <label className="cobsm__label">Item Name</label>
              <input
                type="text"
                {...register(`forms.${formIdx}.item.${itemIdx}.name`)}
                autoComplete="off"
                placeholder="e.g. Malinis ang sahig."
              />
            </div>

            <div
              className={`cobsm__select-wrap${sectionError?.item?.[itemIdx]?.type ? " cobsm__select-wrap--error" : ""}`}>
              <label className="cobsm__label">Type</label>
              <select {...register(`forms.${formIdx}.item.${itemIdx}.type`)}>
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {itemFields.length > 1 && (
              <button
                type="button"
                className="cobsm__remove-item-btn"
                onClick={() => removeItem(itemIdx)}>
                <DeleteOutlineIcon sx={{ fontSize: "0.9rem" }} />
              </button>
            )}
          </div>
        ))}

        {sectionError?.item && !Array.isArray(sectionError.item) && (
          <p className="cobsm__error">
            <ReportProblemIcon />
            {sectionError.item.message}
          </p>
        )}
      </div>
    </div>
  );
};

const COBSModal = ({ open, onClose, selectedRow = null }) => {
  const [mode, setMode] = useState("add");

  const [createCobs, { isLoading: isCreating }] = useCreateCobsMutation();
  const [updateCobs, { isLoading: isUpdating }] = useUpdateCobsMutation();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      checklist_id: "",
      forms: [{ name: "", item: [{ name: "", type: "radio button" }] }],
    },
  });

  const {
    fields: formFields,
    append: appendForm,
    remove: removeForm,
  } = useFieldArray({ control, name: "forms" });

  useEffect(() => {
    if (open) {
      setMode(selectedRow ? "view" : "add");
      if (!selectedRow) {
        reset({
          checklist_id: "",
          forms: [{ name: "", item: [{ name: "", type: "radio button" }] }],
        });
      } else {
        const allForms = selectedRow.allForms ?? [];
        reset({
          checklist_id: selectedRow.checklist_id ?? "",
          forms:
            allForms.length > 0
              ? allForms.map((f) => ({
                  name: f.name ?? "",
                  item: Array.isArray(f.item)
                    ? f.item.map((i) => ({ name: i.name, type: i.type }))
                    : [{ name: "", type: "radio button" }],
                }))
              : [
                  {
                    name: selectedRow.name ?? "",
                    item: Array.isArray(selectedRow.item)
                      ? selectedRow.item.map((i) => ({
                          name: i.name,
                          type: i.type,
                        }))
                      : [{ name: "", type: "radio button" }],
                  },
                ],
        });
      }
    }
  }, [open, selectedRow, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateCobs({ id: selectedRow.checklist_id, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "COBS form updated successfully.",
          {
            variant: "success",
          },
        );
      } else {
        await createCobs(form).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "COBS form created successfully.",
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
        {
          variant: "error",
        },
      );
    }
  };

  const headerIcon = {
    add: <AssignmentIcon className="cobsm__header-icon" />,
    view: <RemoveRedEyeIcon className="cobsm__header-icon" />,
    edit: <EditIcon className="cobsm__header-icon" />,
  };

  const headerTitle = {
    add: "Add COBS Form",
    view: "View COBS Form",
    edit: "Edit COBS Form",
  };

  const isView = mode === "view";
  const viewForms = selectedRow?.allForms ?? [];

  return (
    <Dialog
      open={open}
      onClose={(e, reason) => {
        if (reason === "backdropClick") return;
        onClose();
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "cobsm__paper" }}>
      <div className="cobsm__header">
        <div className="cobsm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="cobsm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="cobsm__content">
        {isView ? (
          <>
            <div className="cobsm__group">
              <p className="cobsm__group-label">Checklist Info</p>
              <div className="cobsm__input-wrap cobsm__input-wrap--disabled">
                <label className="cobsm__label">Checklist ID</label>
                <input
                  type="text"
                  value={selectedRow?.checklist_id ?? "—"}
                  disabled
                  readOnly
                />
              </div>
            </div>

            <div className="cobsm__group">
              <p className="cobsm__group-label">Form Details</p>
              {viewForms.map((form, idx) => (
                <div
                  key={idx}
                  className="cobsm__section-card"
                  style={{ marginBottom: 12 }}>
                  <div className="cobsm__section-card-header">
                    <span className="cobsm__section-badge">
                      Section {idx + 1}
                    </span>
                  </div>
                  <div
                    className="cobsm__input-wrap cobsm__input-wrap--disabled"
                    style={{ marginBottom: 10 }}>
                    <label className="cobsm__label">Area / Section Name</label>
                    <input
                      type="text"
                      value={form.name ?? "—"}
                      disabled
                      readOnly
                    />
                  </div>
                  <p className="cobsm__sub-label">Items</p>
                  {Array.isArray(form.item) &&
                    form.item.map((item, iIdx) => (
                      <div
                        key={iIdx}
                        className="cobsm__item-row cobsm__item-row--disabled">
                        <div className="cobsm__input-wrap cobsm__input-wrap--disabled cobsm__input-wrap--grow">
                          <label className="cobsm__label">Item Name</label>
                          <input
                            type="text"
                            value={item.name}
                            disabled
                            readOnly
                          />
                        </div>
                        <div className="cobsm__input-wrap cobsm__input-wrap--disabled cobsm__input-wrap--type">
                          <label className="cobsm__label">Type</label>
                          <input
                            type="text"
                            value={item.type}
                            disabled
                            readOnly
                          />
                        </div>
                      </div>
                    ))}
                </div>
              ))}
            </div>

            <div className="cobsm__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={() => setMode("edit")}
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="cobsm__group">
              <p className="cobsm__group-label">Checklist</p>
              <div className="cobsm__field">
                <div
                  className={`cobsm__input-wrap${errors.checklist_id ? " cobsm__input-wrap--error" : ""}`}>
                  <label className="cobsm__label">Checklist ID</label>
                  <input
                    type="number"
                    {...register("checklist_id")}
                    autoComplete="off"
                    placeholder="e.g. 1"
                  />
                </div>
                {errors.checklist_id && (
                  <p className="cobsm__error">
                    <ReportProblemIcon />
                    {errors.checklist_id.message}
                  </p>
                )}
              </div>
            </div>

            <div className="cobsm__group">
              <div className="cobsm__section-header">
                <p className="cobsm__group-label">Form Sections</p>
                <button
                  type="button"
                  className="cobsm__add-section-btn"
                  onClick={() =>
                    appendForm({
                      name: "",
                      item: [{ name: "", type: "radio button" }],
                    })
                  }>
                  <AddIcon sx={{ fontSize: "0.85rem" }} />
                  Add Section
                </button>
              </div>

              {formFields.map((formField, formIdx) => (
                <FormSection
                  key={formField.id}
                  formIdx={formIdx}
                  control={control}
                  register={register}
                  errors={errors}
                  onRemove={() => removeForm(formIdx)}
                  canRemove={formFields.length > 1}
                />
              ))}
              {errors.forms && !Array.isArray(errors.forms) && (
                <p className="cobsm__error">
                  <ReportProblemIcon />
                  {errors.forms.message}
                </p>
              )}
            </div>

            <div className="cobsm__footer">
              {selectedRow && (
                <button
                  type="button"
                  className="cobsm__back-btn"
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
                      : "Add COBS Form"
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

export default COBSModal;
