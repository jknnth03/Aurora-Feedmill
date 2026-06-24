import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import FormControl from "@mui/material/FormControl";
import CloseIcon from "@mui/icons-material/Close";
import SettingsIcon from "@mui/icons-material/Settings";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import SaveIcon from "@mui/icons-material/Save";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import DeleteIcon from "@mui/icons-material/Delete";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import EditIcon from "@mui/icons-material/Edit";
import {
  useStoreAcknowledgementSettingMutation,
  useUpdateAcknowledgementSettingMutation,
  useGetAcknowledgementSettingQuery,
} from "../../../features/api/masterlist/acknowledgementSettingsApi";
import { useGetUsersQuery } from "../../../features/api/usermanagement/userApi";
import { useGetSectionsQuery } from "../../../features/api/masterlist/sectionsApi";
import "./AcknowledgementSettingsModal.scss";

const RequiredStar = () => <span className="acksm__required">*</span>;

const SortableItem = ({ id, index, name, position, onRemove, disabled }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`acksm__hierarchy-item${isDragging ? " acksm__hierarchy-item--dragging" : ""}`}>
      <div className="acksm__hierarchy-drag" {...attributes} {...listeners}>
        <DragIndicatorIcon sx={{ fontSize: 16 }} />
      </div>
      <div className="acksm__hierarchy-index">{index + 1}</div>
      <div className="acksm__hierarchy-avatar">
        <AccountCircleIcon sx={{ fontSize: 28 }} />
      </div>
      <div className="acksm__hierarchy-info">
        <span className="acksm__hierarchy-name">{name || `User #${id}`}</span>
        {position && <span className="acksm__hierarchy-role">{position}</span>}
      </div>
      <IconButton
        size="small"
        className="acksm__hierarchy-remove"
        onClick={() => onRemove(id)}
        disabled={disabled}>
        <DeleteIcon sx={{ fontSize: 15 }} />
      </IconButton>
    </div>
  );
};

const ViewItem = ({ index, name, position }) => (
  <div className="acksm__hierarchy-item">
    <div className="acksm__hierarchy-index">{index + 1}</div>
    <div className="acksm__hierarchy-avatar">
      <AccountCircleIcon sx={{ fontSize: 28 }} />
    </div>
    <div className="acksm__hierarchy-info">
      <span className="acksm__hierarchy-name">{name}</span>
      {position && <span className="acksm__hierarchy-role">{position}</span>}
    </div>
  </div>
);

const AcknowledgementSettingsModal = ({
  open,
  onClose,
  setting,
  onSuccess,
}) => {
  const [mode, setMode] = useState("add");
  const [name, setName] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [approverId, setApproverId] = useState("");
  const [evaluatorId, setEvaluatorId] = useState("");
  const [hierarchy, setHierarchy] = useState([]);
  const [selectedApprover, setSelectedApprover] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!setting?.id;
  const isView = mode === "view";
  const isEdit = mode === "edit";

  const { data: settingDetail, isFetching: isFetchingDetail } =
    useGetAcknowledgementSettingQuery(setting?.id, {
      skip: !open || !isEditMode,
    });

  const { data: sectionsData, isFetching: isLoadingSections } =
    useGetSectionsQuery(undefined, { skip: !open || (!isEdit && isEditMode) });

  const { data: usersData, isFetching: isLoadingUsers } = useGetUsersQuery(
    undefined,
    { skip: !open || (!isEdit && isEditMode) },
  );

  const [storeSetting, { isLoading: isStoring }] =
    useStoreAcknowledgementSettingMutation();

  const [updateSetting, { isLoading: isUpdating }] =
    useUpdateAcknowledgementSettingMutation();

  const isLoading = isStoring || isUpdating;

  const normalizeUsers = (data) =>
    (data?.data ?? data ?? []).map((u) => ({
      ...u,
      full_name:
        u.full_name || `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
    }));

  const sections = sectionsData?.data ?? sectionsData ?? [];
  const users = normalizeUsers(usersData);

  const sensors = useSensors(useSensor(PointerSensor));

  const selectedSection = sections.find((s) => String(s.id) === sectionId);
  const selectedSectionName = selectedSection?.name?.toUpperCase() ?? "";
  const isPests = selectedSectionName === "PESTS";

  const detail = settingDetail?.data ?? settingDetail;
  const detailSectionName = detail?.sections?.name?.toUpperCase() ?? "";
  const isDetailPests = detailSectionName === "PESTS";

  const populateFormFromDetail = (d) => {
    setName(d?.name ?? "");
    setSectionId(d?.sections?.id ? String(d.sections.id) : "");
    setApproverId(d?.approver?.id ? String(d.approver.id) : "");
    setEvaluatorId(d?.user?.id ? String(d.user.id) : "");
    setHierarchy(
      Array.isArray(d?.hierarchy)
        ? d.hierarchy.map((item) =>
            typeof item === "object" ? String(item.id) : String(item),
          )
        : [],
    );
  };

  useEffect(() => {
    if (!open) {
      setMode("add");
      setName("");
      setSectionId("");
      setApproverId("");
      setEvaluatorId("");
      setHierarchy([]);
      setSelectedApprover("");
      setErrors({});
      return;
    }
    if (isEditMode) {
      setMode("view");
    } else {
      setMode("add");
      setName("");
      setSectionId("");
      setApproverId("");
      setEvaluatorId("");
      setHierarchy([]);
      setSelectedApprover("");
    }
  }, [open, isEditMode]);

  useEffect(() => {
    if (sectionId && mode === "add") {
      setApproverId("");
      setEvaluatorId("");
      setHierarchy([]);
      setSelectedApprover("");
      setErrors({});
    }
  }, [sectionId]);

  useEffect(() => {
    if (isEditMode && settingDetail && mode === "edit") {
      populateFormFromDetail(detail);
    }
  }, [isEditMode, settingDetail, mode]);

  const handleEnterEdit = () => {
    populateFormFromDetail(detail);
    setErrors({});
    setSelectedApprover("");
    setMode("edit");
  };

  const handleCancelEdit = () => {
    setErrors({});
    setSelectedApprover("");
    setMode("view");
  };

  const validate = () => {
    const errs = {};
    if (!name.trim()) errs.name = "Name is required.";
    if (!sectionId) errs.section_id = "Section is required.";
    if (isPests) {
      if (!approverId) errs.approver_id = "Approver is required.";
    } else if (sectionId) {
      if (!evaluatorId) errs.evaluator_id = "Evaluator is required.";
      if (hierarchy.length === 0)
        errs.hierarchy = "At least one acknowledger is required.";
    }
    return errs;
  };

  const clearFieldError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleAddApprover = () => {
    if (!selectedApprover) return;
    if (hierarchy.includes(selectedApprover)) return;
    setHierarchy((prev) => [...prev, selectedApprover]);
    setSelectedApprover("");
    clearFieldError("hierarchy");
  };

  const handleRemoveApprover = (id) => {
    setHierarchy((prev) => prev.filter((h) => h !== id));
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setHierarchy((prev) => {
        const oldIndex = prev.indexOf(active.id);
        const newIndex = prev.indexOf(over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async () => {
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        section_id: Number(sectionId),
      };

      if (isPests) {
        payload.user_id = Number(approverId);
        payload.hierarchy = [];
      } else {
        payload.user_id = Number(evaluatorId);
        payload.hierarchy = hierarchy.map(Number);
      }

      if (mode === "edit") {
        await updateSetting({ id: setting.id, ...payload }).unwrap();
        onSuccess?.("Setting updated successfully.");
        setMode("view");
      } else {
        await storeSetting(payload).unwrap();
        onSuccess?.("Setting created successfully.");
      }
    } catch {
      setErrors({ _submit: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isLoading || isSubmitting) return;
    onClose();
  };

  const isBusy = isLoading || isSubmitting || isFetchingDetail;

  const availableAcknowledgers = users.filter(
    (u) => !hierarchy.includes(String(u.id)),
  );

  const renderFormFields = () => (
    <div className="acksm__form">
      <div className="acksm__field">
        <label className="acksm__label">
          Name <RequiredStar />
        </label>
        <input
          type="text"
          className={`acksm__input${errors.name ? " acksm__input--error" : ""}`}
          placeholder="Enter setting name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (e.target.value.trim()) clearFieldError("name");
          }}
          disabled={isBusy}
        />
        {errors.name && (
          <span className="acksm__inline-error">
            <ErrorOutlineIcon sx={{ fontSize: 11 }} />
            {errors.name}
          </span>
        )}
      </div>

      <div className="acksm__field">
        <label className="acksm__label">
          Section <RequiredStar />
        </label>
        <FormControl
          fullWidth
          size="small"
          className={`acksm__select-control${errors.section_id ? " acksm__select-control--error" : ""}`}>
          <Select
            value={sectionId}
            onChange={(e) => {
              setSectionId(e.target.value);
              if (e.target.value) clearFieldError("section_id");
            }}
            displayEmpty
            disabled={isBusy || isLoadingSections}
            className="acksm__select"
            MenuProps={{
              PaperProps: { className: "acksm__select-menu" },
            }}>
            <MenuItem value="" disabled>
              {isLoadingSections ? "Loading..." : "Select section"}
            </MenuItem>
            {sections.map((s) => (
              <MenuItem key={s.id} value={String(s.id)}>
                {s.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {errors.section_id && (
          <span className="acksm__inline-error">
            <ErrorOutlineIcon sx={{ fontSize: 11 }} />
            {errors.section_id}
          </span>
        )}
      </div>

      {sectionId && isPests && (
        <div className="acksm__field">
          <label className="acksm__label">
            Approver <RequiredStar />
          </label>
          <FormControl
            fullWidth
            size="small"
            className={`acksm__select-control${errors.approver_id ? " acksm__select-control--error" : ""}`}>
            <Select
              value={approverId}
              onChange={(e) => {
                setApproverId(e.target.value);
                if (e.target.value) clearFieldError("approver_id");
              }}
              displayEmpty
              disabled={isBusy || isLoadingUsers}
              className="acksm__select"
              MenuProps={{
                PaperProps: { className: "acksm__select-menu" },
              }}>
              <MenuItem value="" disabled>
                {isLoadingUsers ? "Loading..." : "Select approver"}
              </MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={String(u.id)}>
                  {u.full_name || `User #${u.id}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {errors.approver_id && (
            <span className="acksm__inline-error">
              <ErrorOutlineIcon sx={{ fontSize: 11 }} />
              {errors.approver_id}
            </span>
          )}
        </div>
      )}

      {sectionId && !isPests && (
        <>
          <div className="acksm__field">
            <label className="acksm__label">
              Evaluator <RequiredStar />
            </label>
            <FormControl
              fullWidth
              size="small"
              className={`acksm__select-control${errors.evaluator_id ? " acksm__select-control--error" : ""}`}>
              <Select
                value={evaluatorId}
                onChange={(e) => {
                  setEvaluatorId(e.target.value);
                  if (e.target.value) clearFieldError("evaluator_id");
                }}
                displayEmpty
                disabled={isBusy || isLoadingUsers}
                className="acksm__select"
                MenuProps={{
                  PaperProps: { className: "acksm__select-menu" },
                }}>
                <MenuItem value="" disabled>
                  {isLoadingUsers ? "Loading..." : "Select evaluator"}
                </MenuItem>
                {users.map((u) => (
                  <MenuItem key={u.id} value={String(u.id)}>
                    {u.full_name || `User #${u.id}`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {errors.evaluator_id && (
              <span className="acksm__inline-error">
                <ErrorOutlineIcon sx={{ fontSize: 11 }} />
                {errors.evaluator_id}
              </span>
            )}
          </div>

          <div className="acksm__field">
            <label className="acksm__label">
              Acknowledger Sequence <RequiredStar />
            </label>
            <div className="acksm__approver-row">
              <FormControl
                fullWidth
                size="small"
                className={`acksm__select-control${errors.hierarchy ? " acksm__select-control--error" : ""}`}>
                <Select
                  value={selectedApprover}
                  onChange={(e) => setSelectedApprover(e.target.value)}
                  displayEmpty
                  disabled={isBusy || isLoadingUsers}
                  className="acksm__select"
                  MenuProps={{
                    PaperProps: { className: "acksm__select-menu" },
                  }}>
                  <MenuItem value="" disabled>
                    {isLoadingUsers ? "Loading..." : "Select Acknowledger"}
                  </MenuItem>
                  {availableAcknowledgers.map((u) => (
                    <MenuItem key={u.id} value={String(u.id)}>
                      {u.full_name || `User #${u.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                variant="outlined"
                className="acksm__add-approver-btn"
                onClick={handleAddApprover}
                disabled={!selectedApprover || isBusy}>
                + ADD
              </Button>
            </div>
            {errors.hierarchy && (
              <span className="acksm__inline-error">
                <ErrorOutlineIcon sx={{ fontSize: 11 }} />
                {errors.hierarchy}
              </span>
            )}

            {hierarchy.length > 0 && (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}>
                <SortableContext
                  items={hierarchy}
                  strategy={verticalListSortingStrategy}>
                  <div className="acksm__hierarchy-list">
                    {hierarchy.map((id, index) => {
                      const user = users.find((u) => String(u.id) === id);
                      return (
                        <SortableItem
                          key={id}
                          id={id}
                          index={index}
                          name={user?.full_name}
                          position={user?.position}
                          onRemove={handleRemoveApprover}
                          disabled={isBusy}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </>
      )}

      {errors._submit && (
        <span className="acksm__inline-error acksm__inline-error--block">
          <ErrorOutlineIcon sx={{ fontSize: 13 }} />
          {errors._submit}
        </span>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        if (reason === "backdropClick") return;
        handleClose();
      }}
      disableEscapeKeyDown
      maxWidth="sm"
      fullWidth
      PaperProps={{ className: "acksm__paper" }}>
      <div className="acksm__header">
        <div className="acksm__header-title">
          {isView ? (
            <RemoveRedEyeIcon className="acksm__header-icon" />
          ) : isEdit ? (
            <EditIcon className="acksm__header-icon" />
          ) : (
            <SettingsIcon className="acksm__header-icon" />
          )}
          <span>
            {isView ? "View Setting" : isEdit ? "Edit Setting" : "Add Setting"}
          </span>
        </div>
        <div className="acksm__header-actions">
          {isView && (
            <IconButton
              size="small"
              className="acksm__edit-btn"
              onClick={handleEnterEdit}
              disabled={isBusy}
              title="Edit">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            className="acksm__close"
            onClick={handleClose}
            disabled={isBusy}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent className="acksm__content">
        {isFetchingDetail ? (
          <div className="acksm__skeleton-wrap">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="acksm__skeleton-row" />
            ))}
          </div>
        ) : isView ? (
          <div className="acksm__form">
            <div className="acksm__field">
              <label className="acksm__label">Name</label>
              <input
                type="text"
                className="acksm__input"
                value={detail?.name ?? ""}
                disabled
                readOnly
              />
            </div>

            <div className="acksm__field">
              <label className="acksm__label">Section</label>
              <input
                type="text"
                className="acksm__input"
                value={detail?.sections?.name ?? "—"}
                disabled
                readOnly
              />
            </div>

            {isDetailPests ? (
              <div className="acksm__field">
                <label className="acksm__label">Approver</label>
                <input
                  type="text"
                  className="acksm__input"
                  value={detail?.approver?.name ?? "—"}
                  disabled
                  readOnly
                />
              </div>
            ) : (
              <>
                <div className="acksm__field">
                  <label className="acksm__label">Evaluator</label>
                  <input
                    type="text"
                    className="acksm__input"
                    value={detail?.user?.name ?? "—"}
                    disabled
                    readOnly
                  />
                </div>

                <div className="acksm__field">
                  <label className="acksm__label">Acknowledger Sequence</label>
                  {Array.isArray(detail?.hierarchy) &&
                  detail.hierarchy.length > 0 ? (
                    <div className="acksm__hierarchy-list">
                      {detail.hierarchy.map((item, index) => (
                        <ViewItem
                          key={item.id}
                          index={index}
                          name={item.name}
                          position={item.role}
                        />
                      ))}
                    </div>
                  ) : (
                    <span className="acksm__empty-hint">
                      No acknowledgers set.
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          renderFormFields()
        )}
      </DialogContent>

      <DialogActions className="acksm__footer">
        {isView ? (
          <Button
            variant="text"
            onClick={handleClose}
            className="acksm__btn-close">
            CLOSE
          </Button>
        ) : isEdit ? (
          <>
            <Button
              variant="text"
              onClick={handleCancelEdit}
              disabled={isBusy}
              className="acksm__btn-close">
              CANCEL
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
              onClick={handleSubmit}
              disabled={isBusy}
              className="acksm__btn-save">
              {isBusy ? "Saving..." : "UPDATE"}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="text"
              onClick={handleClose}
              disabled={isBusy}
              className="acksm__btn-close">
              CANCEL
            </Button>
            <Button
              variant="contained"
              startIcon={<SaveIcon sx={{ fontSize: 16 }} />}
              onClick={handleSubmit}
              disabled={isBusy}
              className="acksm__btn-save">
              {isBusy ? "Saving..." : "SAVE"}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default AcknowledgementSettingsModal;
