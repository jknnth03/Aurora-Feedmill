import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SearchIcon from "@mui/icons-material/Search";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import UniversalButton, {
  SaveButton,
} from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
} from "../../../features/api/usermanagement/rolesApi";
import { useGetPermissionsQuery } from "../../../features/api/usermanagement/permissionsApi";
import "./RolesModal.scss";

const schema = yup.object({
  name: yup.string().required("Role name is required"),
  permission_id: yup
    .array()
    .of(yup.number())
    .min(1, "At least one permission is required"),
});

const SkeletonLoader = () => (
  <div className="rm__skeleton-wrap">
    {[50, 75, 60, 80].map((w, i) => (
      <span key={i} className="ut__skeleton" style={{ width: `${w}%` }} />
    ))}
    <div className="rm__skeleton-footer">
      <span className="ut__skeleton" style={{ width: "28%" }} />
    </div>
  </div>
);

const PermissionsAutocomplete = ({
  value = [],
  onChange,
  error,
  displayOptions = [],
}) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const { data, isFetching } = useGetPermissionsQuery({
    status: 1,
    search,
    page: 1,
    per_page: 50,
  });

  const options = data?.data ?? [];

  const handleSelect = (permission) => {
    const already = value.includes(permission.id);
    onChange(
      already
        ? value.filter((id) => id !== permission.id)
        : [...value, permission.id],
    );
  };

  const handleRemove = (id) => onChange(value.filter((v) => v !== id));

  const selectedOptions = options.filter((o) => value.includes(o.id));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`rm__ac${error ? " rm__ac--error" : ""}`} ref={wrapRef}>
      <label className="rm__label">
        Permissions
        <span className="rm__required">
          <PushPinIcon />
        </span>
      </label>

      <div className="rm__ac-box" onClick={() => setOpen((p) => !p)}>
        <div className="rm__ac-tags">
          {value.length === 0 && (
            <span className="rm__ac-placeholder">Select permissions...</span>
          )}
          {selectedOptions.map((p) => (
            <span key={p.id} className="rm__ac-tag">
              {p.name}
              <button
                type="button"
                className="rm__ac-tag-remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(p.id);
                }}>
                <CloseRoundedIcon sx={{ fontSize: "0.65rem" }} />
              </button>
            </span>
          ))}
          {value
            .filter((id) => !options.find((o) => o.id === id))
            .map((id) => {
              const fallback = displayOptions.find((o) => o.id === id);
              return (
                <span key={id} className="rm__ac-tag">
                  {fallback ? fallback.name : `#${id}`}
                  <button
                    type="button"
                    className="rm__ac-tag-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(id);
                    }}>
                    <CloseRoundedIcon sx={{ fontSize: "0.65rem" }} />
                  </button>
                </span>
              );
            })}
        </div>
        <span className="rm__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>

      {open && (
        <div className="rm__ac-dropdown">
          <div className="rm__ac-search">
            <SearchIcon
              sx={{ fontSize: "0.9rem", color: "var(--text-muted)" }}
            />
            <input
              autoFocus
              type="text"
              placeholder="Search permissions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rm__ac-search-input"
            />
          </div>
          <div className="rm__ac-options">
            {isFetching ? (
              <p className="rm__ac-empty">Loading...</p>
            ) : options.length === 0 ? (
              <p className="rm__ac-empty">No permissions found</p>
            ) : (
              options.map((p) => {
                const selected = value.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className={`rm__ac-option${selected ? " rm__ac-option--selected" : ""}`}
                    onClick={() => handleSelect(p)}>
                    <span
                      className={`rm__ac-checkbox${selected ? " rm__ac-checkbox--checked" : ""}`}
                    />
                    {p.name}
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

const RolesModal = ({ open, onClose, selectedId = null }) => {
  const [mode, setMode] = useState("add");
  const [selectedRow, setSelectedRow] = useState(null);

  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const isLoading = isCreating || isUpdating;

  const { data: roleData, isFetching: roleLoading } = useGetRoleByIdQuery(
    selectedId,
    { skip: !selectedId || !open },
  );

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { name: "", permission_id: [] },
  });

  useEffect(() => {
    if (open) {
      setMode(selectedId ? "view" : "add");
      if (!selectedId) {
        setSelectedRow(null);
        reset({ name: "", permission_id: [] });
      }
    }
  }, [open, selectedId, reset]);

  useEffect(() => {
    if (roleData) {
      const data = roleData?.data ?? null;
      setSelectedRow(data);
      reset({
        name: data?.name ?? "",
        permission_id: data?.permissions?.map((p) => p.id) ?? [],
      });
    }
  }, [roleData, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        await updateRole({ id: selectedId, ...form }).unwrap();
        window.__snackbar__?.enqueueSnackbar("Role updated successfully.", {
          variant: "success",
        });
      } else {
        await createRole(form).unwrap();
        window.__snackbar__?.enqueueSnackbar("Role created successfully.", {
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
    add: <PeopleAltIcon className="rm__header-icon" />,
    view: <RemoveRedEyeIcon className="rm__header-icon" />,
    edit: <EditIcon className="rm__header-icon" />,
  };

  const headerTitle = {
    add: "Add Role",
    view: "View Role",
    edit: "Edit Role",
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
      PaperProps={{ className: "rm__paper" }}>
      <div className="rm__header">
        <div className="rm__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <IconButton className="rm__close" onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </div>

      <DialogContent className="rm__content">
        {roleLoading ? (
          <SkeletonLoader />
        ) : isView ? (
          <>
            <div className="rm__group">
              <p className="rm__group-label">Role Details</p>
              <div className="rm__field">
                <div className="rm__input-wrap rm__input-wrap--disabled">
                  <label className="rm__label">Role Name</label>
                  <input
                    type="text"
                    value={selectedRow?.name ?? ""}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>

            <div className="rm__group">
              <p className="rm__group-label">Permissions</p>
              <div className="rm__field">
                <div className="rm__input-wrap rm__input-wrap--disabled rm__input-wrap--tags">
                  <label className="rm__label">Permissions</label>
                  <div className="rm__view-tags">
                    {selectedRow?.permissions?.length > 0 ? (
                      selectedRow.permissions.map((p) => (
                        <span
                          key={p.id}
                          className="rm__ac-tag rm__ac-tag--readonly">
                          {p.name}
                        </span>
                      ))
                    ) : (
                      <span className="rm__ac-placeholder">No permissions</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rm__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={() => setMode("edit")}
                modalVariant
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="rm__group">
              <p className="rm__group-label">Role Details</p>
              <div className="rm__field">
                <div
                  className={`rm__input-wrap${errors.name ? " rm__input-wrap--error" : ""}`}>
                  <label className="rm__label">
                    Role Name
                    <span className="rm__required">
                      <PushPinIcon />
                    </span>
                  </label>
                  <input type="text" {...register("name")} autoComplete="off" />
                </div>
                {errors.name && (
                  <p className="rm__error">
                    <ReportProblemIcon />
                    {errors.name?.message}
                  </p>
                )}
              </div>
            </div>

            <div className="rm__group">
              <p className="rm__group-label">Permissions</p>
              <Controller
                name="permission_id"
                control={control}
                render={({ field }) => (
                  <PermissionsAutocomplete
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.permission_id}
                    displayOptions={selectedRow?.permissions ?? []}
                  />
                )}
              />
              {errors.permission_id && (
                <p className="rm__error" style={{ marginTop: 6 }}>
                  <ReportProblemIcon />
                  {errors.permission_id?.message}
                </p>
              )}
            </div>

            <div className="rm__footer">
              {selectedId && (
                <button
                  type="button"
                  className="rm__back-btn"
                  onClick={() => setMode("view")}>
                  ← Back
                </button>
              )}
              <SaveButton
                label={
                  isLoading
                    ? "Saving..."
                    : mode === "edit"
                      ? "Save Changes"
                      : "Add Role"
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

export default RolesModal;
