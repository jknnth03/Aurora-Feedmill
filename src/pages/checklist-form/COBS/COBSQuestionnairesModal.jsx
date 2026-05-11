import { useEffect, useState, useRef } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
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
import PushPinIcon from "@mui/icons-material/PushPin";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import CheckIcon from "@mui/icons-material/Check";
import SearchIcon from "@mui/icons-material/Search";
import {
  SaveButton,
  EditButton,
  BackModalButton,
} from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useLazyGetCobsByIdQuery,
  useCreateCobsMutation,
  useUpdateCobsMutation,
} from "../../../features/api/questionnaires/cobsQuestionnairesApi";
import { useGetUnitsQuery } from "../../../features/api/masterlist/unitsApi";
import { cobsSchema, TYPE_OPTIONS } from "./COBSSchema";
import "./COBSQuestionnairesModal.scss";

const SkeletonLoader = () => (
  <div className="cobsm__skeleton-wrap">
    <div className="cobsm__skeleton-group">
      <span className="ut__skeleton cobsm__skeleton-label" />
      <span className="ut__skeleton cobsm__skeleton-field" />
    </div>
    <div className="cobsm__skeleton-group">
      <span className="ut__skeleton cobsm__skeleton-label" />
      <span className="ut__skeleton cobsm__skeleton-field" />
      <span className="ut__skeleton cobsm__skeleton-field" />
      <span className="ut__skeleton cobsm__skeleton-field" />
    </div>
    <div className="cobsm__skeleton-footer">
      <span className="ut__skeleton cobsm__skeleton-btn" />
    </div>
  </div>
);

const CustomSelect = ({ value, onChange, options, error }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div
      className={`cobsm__custom-select${error ? " cobsm__custom-select--error" : ""}`}
      ref={ref}>
      <label className="cobsm__label">Type</label>
      <div
        className="cobsm__custom-select-box"
        onClick={() => setOpen((p) => !p)}>
        <span className="cobsm__custom-select-value">{value}</span>
        <KeyboardArrowDownIcon
          className={`cobsm__custom-select-arrow${open ? " cobsm__custom-select-arrow--open" : ""}`}
        />
      </div>
      {open && (
        <div className="cobsm__custom-select-dropdown">
          {options.map((opt) => (
            <div
              key={opt}
              className={`cobsm__custom-select-option${value === opt ? " cobsm__custom-select-option--selected" : ""}`}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}>
              <span>{opt}</span>
              {value === opt && <CheckIcon sx={{ fontSize: "0.85rem" }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SingleSelect = ({
  value = [],
  onChange,
  options = [],
  error,
  label,
  placeholder,
  searchable,
}) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = searchable
    ? options.filter((o) =>
        o.label.toLowerCase().includes(search.toLowerCase()),
      )
    : options;

  const selectedId = Array.isArray(value) && value.length > 0 ? value[0] : null;
  const selectedLabel =
    options.find((o) => o.value === selectedId)?.label ?? null;

  const handleSelect = (id) => {
    if (selectedId === id) {
      onChange([]);
    } else {
      onChange([id]);
    }
    setOpen(false);
    setSearch("");
  };

  return (
    <div
      className={`cobsm__multiselect${error ? " cobsm__multiselect--error" : ""}`}
      ref={ref}>
      <label className="cobsm__label">
        {label}
        <span className="cobsm__required">
          <PushPinIcon />
        </span>
      </label>
      <div
        className="cobsm__multiselect-box"
        onClick={() => setOpen((p) => !p)}>
        {selectedLabel ? (
          <div className="cobsm__multiselect-tags">
            <span className="cobsm__multiselect-tag">{selectedLabel}</span>
          </div>
        ) : (
          <span className="cobsm__multiselect-placeholder">{placeholder}</span>
        )}
        <KeyboardArrowDownIcon
          className={`cobsm__custom-select-arrow${open ? " cobsm__custom-select-arrow--open" : ""}`}
        />
      </div>
      {open && (
        <div className="cobsm__custom-select-dropdown">
          {searchable && (
            <div className="cobsm__multiselect-search">
              <SearchIcon sx={{ fontSize: "0.9rem" }} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            </div>
          )}
          <div className="cobsm__custom-select-options">
            {filtered.length === 0 ? (
              <p className="cobsm__ac-empty">No results found</p>
            ) : (
              filtered.map((opt) => {
                const selected = selectedId === opt.value;
                return (
                  <div
                    key={opt.value}
                    className={`cobsm__custom-select-option${selected ? " cobsm__custom-select-option--selected" : ""}`}
                    onClick={() => handleSelect(opt.value)}>
                    <span>{opt.label}</span>
                    {selected && <CheckIcon sx={{ fontSize: "0.85rem" }} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const SubItemRow = ({
  catIdx,
  areaIdx,
  subIdx,
  register,
  errors,
  onRemove,
  canRemove,
  watch,
  setValue,
}) => {
  const subError =
    errors?.items?.[catIdx]?.items?.[areaIdx]?.sub_items?.[subIdx];
  const typeValue = watch(
    `items.${catIdx}.items.${areaIdx}.sub_items.${subIdx}.type`,
  );

  return (
    <div className="cobsm__item-row">
      <div
        className={`cobsm__input-wrap cobsm__input-wrap--grow${subError?.name ? " cobsm__input-wrap--error" : ""}`}>
        <label className="cobsm__label">Sub-item Name</label>
        <input
          type="text"
          {...register(
            `items.${catIdx}.items.${areaIdx}.sub_items.${subIdx}.name`,
          )}
          autoComplete="off"
          placeholder="e.g. Malinis ang sahig."
        />
      </div>
      <CustomSelect
        value={typeValue}
        onChange={(val) =>
          setValue(
            `items.${catIdx}.items.${areaIdx}.sub_items.${subIdx}.type`,
            val,
            { shouldValidate: true },
          )
        }
        options={TYPE_OPTIONS}
        error={!!subError?.type}
      />
      {canRemove && (
        <button
          type="button"
          className="cobsm__remove-item-btn"
          onClick={onRemove}>
          <DeleteOutlineIcon sx={{ fontSize: "0.9rem" }} />
        </button>
      )}
    </div>
  );
};

const AreaCard = ({
  catIdx,
  areaIdx,
  control,
  register,
  errors,
  onRemove,
  canRemove,
  watch,
  setValue,
}) => {
  const {
    fields: subFields,
    append: appendSub,
    remove: removeSub,
  } = useFieldArray({
    control,
    name: `items.${catIdx}.items.${areaIdx}.sub_items`,
  });

  const areaError = errors?.items?.[catIdx]?.items?.[areaIdx];

  return (
    <div className="cobsm__area-card">
      <div className="cobsm__area-card-header">
        <span className="cobsm__area-badge">Area {areaIdx + 1}</span>
        {canRemove && (
          <button
            type="button"
            className="cobsm__remove-btn"
            onClick={onRemove}>
            <DeleteOutlineIcon sx={{ fontSize: "0.9rem" }} />
          </button>
        )}
      </div>

      <div
        className={`cobsm__input-wrap${areaError?.name ? " cobsm__input-wrap--error" : ""}`}
        style={{ marginBottom: 10 }}>
        <label className="cobsm__label">Area Name</label>
        <input
          type="text"
          {...register(`items.${catIdx}.items.${areaIdx}.name`)}
          autoComplete="off"
          placeholder="e.g. Front Gate"
        />
      </div>
      {areaError?.name && (
        <p className="cobsm__error" style={{ marginBottom: 8 }}>
          <ReportProblemIcon />
          {areaError.name.message}
        </p>
      )}

      <div className="cobsm__items-wrap">
        <div className="cobsm__items-header">
          <p className="cobsm__sub-label">Sub-items</p>
          <button
            type="button"
            className="cobsm__add-item-btn"
            onClick={() => appendSub({ name: "", type: "radio button" })}>
            <AddIcon sx={{ fontSize: "0.8rem" }} />
            Add Sub-item
          </button>
        </div>
        <div className="cobsm__subitems-list">
          {subFields.map((subField, subIdx) => (
            <SubItemRow
              key={subField.id}
              catIdx={catIdx}
              areaIdx={areaIdx}
              subIdx={subIdx}
              register={register}
              errors={errors}
              onRemove={() => removeSub(subIdx)}
              canRemove={subFields.length > 1}
              watch={watch}
              setValue={setValue}
            />
          ))}
        </div>
        {areaError?.sub_items && !Array.isArray(areaError.sub_items) && (
          <p className="cobsm__error" style={{ marginTop: 6 }}>
            <ReportProblemIcon />
            {areaError.sub_items.message}
          </p>
        )}
      </div>
    </div>
  );
};

const CategoryCard = ({
  catIdx,
  control,
  register,
  errors,
  onRemove,
  canRemove,
  watch,
  setValue,
}) => {
  const {
    fields: areaFields,
    append: appendArea,
    remove: removeArea,
  } = useFieldArray({
    control,
    name: `items.${catIdx}.items`,
  });

  const catError = errors?.items?.[catIdx];

  return (
    <div className="cobsm__section-card">
      <div className="cobsm__section-card-header">
        <span className="cobsm__section-badge">Category {catIdx + 1}</span>
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
          className={`cobsm__input-wrap${catError?.name ? " cobsm__input-wrap--error" : ""}`}>
          <label className="cobsm__label">Category Name</label>
          <input
            type="text"
            {...register(`items.${catIdx}.name`)}
            autoComplete="off"
            placeholder="e.g. CLEANLINESS"
          />
        </div>
        {catError?.name && (
          <p className="cobsm__error">
            <ReportProblemIcon />
            {catError.name.message}
          </p>
        )}
      </div>

      <div className="cobsm__items-wrap">
        <div className="cobsm__items-header">
          <p className="cobsm__sub-label">Areas</p>
          <button
            type="button"
            className="cobsm__add-item-btn"
            onClick={() =>
              appendArea({
                name: "",
                sub_items: [{ name: "", type: "radio button" }],
              })
            }>
            <AddIcon sx={{ fontSize: "0.8rem" }} />
            Add Area
          </button>
        </div>
        <div className="cobsm__subitems-list">
          {areaFields.map((areaField, areaIdx) => (
            <AreaCard
              key={areaField.id}
              catIdx={catIdx}
              areaIdx={areaIdx}
              control={control}
              register={register}
              errors={errors}
              onRemove={() => removeArea(areaIdx)}
              canRemove={areaFields.length > 1}
              watch={watch}
              setValue={setValue}
            />
          ))}
        </div>
        {catError?.items && !Array.isArray(catError.items) && (
          <p className="cobsm__error">
            <ReportProblemIcon />
            {catError.items.message}
          </p>
        )}
      </div>
    </div>
  );
};

const DEFAULT_VALUES = {
  checklist_name: "",
  unit_ids: [],
  items: [
    {
      name: "",
      items: [
        {
          name: "",
          sub_items: [{ name: "", type: "radio button" }],
        },
      ],
    },
  ],
};

const COBSQuestionnairesModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [cobsLoading, setCobsLoading] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);

  const [fetchCobsById] = useLazyGetCobsByIdQuery();
  const [createCobs, { isLoading: isCreating }] = useCreateCobsMutation();
  const [updateCobs, { isLoading: isUpdating }] = useUpdateCobsMutation();

  const { data: unitsData } = useGetUnitsQuery(undefined, {
    skip: !open || mode === "view",
  });

  const isLoading = isCreating || isUpdating;

  const unitOptions =
    unitsData?.data?.map((u) => ({ value: u.id, label: u.name })) ?? [];

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(cobsSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const unitIds = watch("unit_ids");

  const {
    fields: catFields,
    append: appendCat,
    remove: removeCat,
  } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      setSelectedRow(null);

      if (!selectedId) {
        reset(DEFAULT_VALUES);
      } else {
        setCobsLoading(true);
        fetchCobsById(selectedId, true)
          .unwrap()
          .then((res) => {
            const data = res?.data ?? null;
            setSelectedRow(data);

            const mappedUnitIds = Array.isArray(data?.units)
              ? data.units.slice(0, 1).map((u) => u.id)
              : [];

            reset({
              checklist_name: data?.checklist_name ?? "",
              unit_ids: mappedUnitIds,
              items:
                Array.isArray(data?.items) && data.items.length > 0
                  ? data.items.map((cat) => ({
                      name: cat.name ?? "",
                      items: Array.isArray(cat.items)
                        ? cat.items.map((area) => ({
                            name: area.name ?? "",
                            sub_items: Array.isArray(area.sub_items)
                              ? area.sub_items.map((s) => ({
                                  name: s.name ?? "",
                                  type: s.type ?? "radio button",
                                }))
                              : [{ name: "", type: "radio button" }],
                          }))
                        : [
                            {
                              name: "",
                              sub_items: [{ name: "", type: "radio button" }],
                            },
                          ],
                    }))
                  : DEFAULT_VALUES.items,
            });
          })
          .catch((err) => console.error("Fetch failed:", err))
          .finally(() => setCobsLoading(false));
      }
    }
  }, [open, selectedId, reset, fetchCobsById]);

  const onSubmit = async (form) => {
    const payload = { ...form, section_id: 1 };
    try {
      if (mode === "edit") {
        await updateCobs({ id: selectedId, ...payload }).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "COBS questionnaire updated successfully.",
          { variant: "success" },
        );
      } else {
        await createCobs(payload).unwrap();
        window.__snackbar__?.enqueueSnackbar(
          "COBS questionnaire created successfully.",
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
    add: <AssignmentIcon className="cobsm__header-icon" />,
    view: <RemoveRedEyeIcon className="cobsm__header-icon" />,
    edit: <EditIcon className="cobsm__header-icon" />,
  };

  const headerTitle = {
    add: "Add COBS Questionnaire",
    view: "View COBS Questionnaire",
    edit: "Edit COBS Questionnaire",
  };

  const isView = mode === "view";

  const viewUnitLabels = Array.isArray(selectedRow?.units)
    ? selectedRow.units.map((u) => u.name)
    : [];

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
        {cobsLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="cobsm__group">
              <p className="cobsm__group-label">Checklist Info</p>
              <div className="cobsm__input-wrap cobsm__input-wrap--disabled">
                <label className="cobsm__label">Checklist Name</label>
                <input
                  type="text"
                  value={selectedRow?.checklist_name ?? "—"}
                  disabled
                  readOnly
                  autoComplete="off"
                />
              </div>

              <div
                className="cobsm__input-wrap cobsm__input-wrap--disabled"
                style={{ marginTop: 14 }}>
                <label className="cobsm__label">Units</label>
                <input
                  type="text"
                  value={
                    viewUnitLabels.length > 0 ? viewUnitLabels.join(", ") : "—"
                  }
                  disabled
                  readOnly
                  autoComplete="off"
                />
              </div>

              <div
                className="cobsm__input-wrap cobsm__input-wrap--disabled"
                style={{ marginTop: 14 }}>
                <label className="cobsm__label">Section</label>
                <input
                  type="text"
                  value={selectedRow?.section?.name ?? "COBS"}
                  disabled
                  readOnly
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="cobsm__group">
              <p className="cobsm__group-label">Questionnaire Details</p>
              {(selectedRow?.items ?? []).map((cat, catIdx) => (
                <div
                  key={catIdx}
                  className="cobsm__section-card"
                  style={{ marginBottom: 12 }}>
                  <div className="cobsm__section-card-header">
                    <span className="cobsm__section-badge">
                      Category {catIdx + 1}: {cat.name}
                    </span>
                  </div>
                  {(cat.items ?? []).map((area, areaIdx) => (
                    <div
                      key={areaIdx}
                      className="cobsm__area-card"
                      style={{ marginBottom: 10 }}>
                      <div className="cobsm__area-card-header">
                        <span className="cobsm__area-badge">
                          Area {areaIdx + 1}
                          {area.name ? `: ${area.name}` : ""}
                        </span>
                      </div>
                      <p className="cobsm__sub-label">Sub-items</p>
                      <div className="cobsm__subitems-list">
                        {(area.sub_items ?? []).map((sub, subIdx) => (
                          <div
                            key={subIdx}
                            className="cobsm__item-row cobsm__item-row--disabled">
                            <div className="cobsm__input-wrap cobsm__input-wrap--disabled cobsm__input-wrap--grow">
                              <label className="cobsm__label">
                                Sub-item Name
                              </label>
                              <input
                                type="text"
                                value={sub.name}
                                disabled
                                readOnly
                                autoComplete="off"
                              />
                            </div>
                            <div className="cobsm__input-wrap cobsm__input-wrap--disabled cobsm__input-wrap--type">
                              <label className="cobsm__label">Type</label>
                              <input
                                type="text"
                                value={sub.type}
                                disabled
                                readOnly
                                autoComplete="off"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div className="cobsm__footer">
              <EditButton onClick={() => setMode("edit")} />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="cobsm__group">
              <p className="cobsm__group-label">Checklist Info</p>

              <div
                className={`cobsm__input-wrap${errors.checklist_name ? " cobsm__input-wrap--error" : ""}`}
                style={{ marginBottom: errors.checklist_name ? 6 : 14 }}>
                <label className="cobsm__label">
                  Checklist Name
                  <span className="cobsm__required">
                    <PushPinIcon />
                  </span>
                </label>
                <input
                  type="text"
                  {...register("checklist_name")}
                  autoComplete="off"
                  placeholder="e.g. Sample name"
                />
              </div>
              {errors.checklist_name && (
                <p className="cobsm__error" style={{ marginBottom: 14 }}>
                  <ReportProblemIcon />
                  {errors.checklist_name.message}
                </p>
              )}

              <SingleSelect
                label="Units"
                placeholder="Select a unit..."
                value={unitIds}
                onChange={(val) =>
                  setValue("unit_ids", val, { shouldValidate: true })
                }
                options={unitOptions}
                error={!!errors.unit_ids}
                searchable
              />
              {errors.unit_ids && (
                <p
                  className="cobsm__error"
                  style={{ marginTop: 6, marginBottom: 14 }}>
                  <ReportProblemIcon />
                  {errors.unit_ids.message}
                </p>
              )}

              <div
                className="cobsm__input-wrap cobsm__input-wrap--disabled"
                style={{ marginTop: 14 }}>
                <label className="cobsm__label">Section</label>
                <input
                  type="text"
                  value="COBS"
                  disabled
                  readOnly
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="cobsm__group">
              <div className="cobsm__section-header">
                <p className="cobsm__group-label">Categories</p>
                <button
                  type="button"
                  className="cobsm__add-section-btn"
                  onClick={() =>
                    appendCat({
                      name: "",
                      items: [
                        {
                          name: "",
                          sub_items: [{ name: "", type: "radio button" }],
                        },
                      ],
                    })
                  }>
                  <AddIcon sx={{ fontSize: "0.85rem" }} />
                  Add Category
                </button>
              </div>

              {catFields.map((catField, catIdx) => (
                <CategoryCard
                  key={catField.id}
                  catIdx={catIdx}
                  control={control}
                  register={register}
                  errors={errors}
                  onRemove={() => removeCat(catIdx)}
                  canRemove={catFields.length > 1}
                  watch={watch}
                  setValue={setValue}
                />
              ))}

              {errors.items && !Array.isArray(errors.items) && (
                <p className="cobsm__error">
                  <ReportProblemIcon />
                  {errors.items.message}
                </p>
              )}
            </div>

            <div className="cobsm__footer">
              {selectedId && (
                <BackModalButton onClick={() => setMode("view")} />
              )}
              <SaveButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add COBS Questionnaire"
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

export default COBSQuestionnairesModal;
