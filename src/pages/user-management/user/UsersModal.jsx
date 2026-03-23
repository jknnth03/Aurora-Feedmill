import { useEffect, useState, useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { addSchema, editSchema } from "./UserModalSchema";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import UniversalButton from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
} from "../../../features/api/usermanagement/userApi";
import { useGetRolesQuery } from "../../../features/api/usermanagement/rolesApi";
import "./UsersModal.scss";

const FIELD_GROUPS = [
  {
    label: "Personal Information",
    fields: [
      { name: "first_name", label: "First Name", required: true, half: true },
      {
        name: "middle_name",
        label: "Middle Name",
        required: false,
        half: true,
      },
      { name: "last_name", label: "Last Name", required: true, half: true },
      { name: "suffix", label: "Suffix", required: false, half: true },
    ],
  },
  {
    label: "Employment Details",
    fields: [
      { name: "employee_id", label: "Employee ID", required: true, half: true },
      { name: "position", label: "Position", required: true, half: true },
    ],
  },
  {
    label: "Account Credentials",
    fields: [
      { name: "username", label: "Username", required: true, half: true },
      {
        name: "password",
        label: "Password",
        required: true,
        half: true,
        type: "password",
        addOnly: true,
        hidden: true,
      },
    ],
  },
];

const RoleAutocomplete = ({ value, onChange, error, displayValue }) => {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const { data, isFetching } = useGetRolesQuery(
    { status: 1, search, page: 1, per_page: 50 },
    { skip: !open },
  );
  const options = data?.data?.data ?? [];
  const selected = options.find((r) => r.id === value) ?? null;

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

  const handleSelect = (role) => {
    onChange(role.id);
    setSearch("");
    setOpen(false);
  };

  return (
    <div className={`um__ac${error ? " um__ac--error" : ""}`} ref={wrapRef}>
      <label className="um__label">
        Role
        <span className="um__required">
          <PushPinIcon />
        </span>
      </label>

      <div className="um__ac-box" onClick={() => setOpen((p) => !p)}>
        {open ? (
          <div className="um__ac-search-wrap">
            <SearchIcon
              sx={{ fontSize: "0.9rem", flexShrink: 0, color: "inherit" }}
            />
            <input
              autoFocus
              type="text"
              placeholder="Search role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="um__ac-input"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <span
            className={
              selected || displayValue ? "um__ac-value" : "um__ac-placeholder"
            }>
            {selected ? selected.name : displayValue || "Select role..."}
          </span>
        )}
        <span className="um__ac-arrow">
          {open ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
        </span>
      </div>

      {open && (
        <div className="um__ac-dropdown">
          <div className="um__ac-options">
            {isFetching ? (
              <p className="um__ac-empty">Loading...</p>
            ) : options.length === 0 ? (
              <p className="um__ac-empty">No roles found</p>
            ) : (
              options.map((r) => (
                <div
                  key={r.id}
                  className={`um__ac-option${value === r.id ? " um__ac-option--selected" : ""}`}
                  onClick={() => handleSelect(r)}>
                  {r.name}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const ViewField = ({ label, value, half }) => (
  <div className={half ? "um__col-half" : "um__col-full"}>
    <div className="um__field">
      <div className="um__input-wrap um__input-wrap--disabled">
        <label className="um__label">{label}</label>
        <input type="text" value={value ?? ""} disabled readOnly />
      </div>
    </div>
  </div>
);

const FormField = ({
  name,
  label,
  required,
  type = "text",
  register,
  errors,
  showPass,
  onTogglePass,
}) => {
  const isPassword = type === "password";
  const hasError = !!errors[name];

  return (
    <div className="um__field">
      <div
        className={`um__input-wrap${hasError ? " um__input-wrap--error" : ""}`}>
        <label className="um__label">
          {label}
          {required && (
            <span className="um__required">
              <PushPinIcon />
            </span>
          )}
        </label>
        <input
          type={isPassword ? (showPass ? "text" : "password") : "text"}
          {...register(name)}
          autoComplete={isPassword ? "new-password" : "off"}
        />
        {isPassword && (
          <button
            type="button"
            className="um__toggle-pass"
            onClick={onTogglePass}>
            {showPass ? (
              <RemoveRedEyeIcon fontSize="small" />
            ) : (
              <VisibilityOffOutlinedIcon fontSize="small" />
            )}
          </button>
        )}
      </div>
      {hasError && (
        <p className="um__error">
          <ReportProblemIcon />
          {errors[name]?.message}
        </p>
      )}
    </div>
  );
};

const UsersModal = ({ open, onClose, selectedRow = null }) => {
  const [mode, setMode] = useState("add");
  const [showPass, setShowPass] = useState(false);

  const { data: userDetail } = useGetUserByIdQuery(selectedRow?.id, {
    skip: !selectedRow?.id || !open,
  });
  const rowData = userDetail?.data ?? selectedRow;

  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const isLoading = isCreating || isUpdating;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(mode === "add" ? addSchema : editSchema),
    defaultValues: {
      role_id: "",
      employee_id: "",
      first_name: "",
      middle_name: "",
      last_name: "",
      suffix: "",
      position: "",
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    if (open) {
      setShowPass(false);
      setMode(selectedRow ? "view" : "add");
      if (!selectedRow) {
        reset({
          role_id: "",
          employee_id: "",
          first_name: "",
          middle_name: "",
          last_name: "",
          suffix: "",
          position: "",
          username: "",
          password: "",
        });
      }
    }
  }, [open, selectedRow, reset]);

  useEffect(() => {
    if (rowData && open && selectedRow) {
      reset({
        role_id: rowData.role?.id ?? "",
        employee_id: rowData.employee_id ?? "",
        first_name: rowData.first_name ?? "",
        middle_name: rowData.middle_name ?? "",
        last_name: rowData.last_name ?? "",
        suffix: rowData.suffix ?? "",
        position: rowData.position ?? "",
        username: rowData.username ?? "",
        password: "",
      });
    }
  }, [rowData, open, selectedRow, reset]);

  const onSubmit = async (form) => {
    try {
      if (mode === "edit") {
        const { password, ...rest } = form;
        const payload = { id: rowData?.id, ...rest };
        await updateUser(payload).unwrap();
        window.__snackbar__?.enqueueSnackbar("User updated successfully.", {
          variant: "success",
        });
      } else {
        await createUser(form).unwrap();
        window.__snackbar__?.enqueueSnackbar("User created successfully.", {
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
    add: <PersonAddIcon className="um__header-icon" />,
    view: <RemoveRedEyeIcon className="um__header-icon" />,
    edit: <EditIcon className="um__header-icon" />,
  };

  const headerTitle = { add: "Add User", view: "View User", edit: "Edit User" };
  const isView = mode === "view";

  const getVisibleFields = (fields) => fields;

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
      PaperProps={{ className: "um__paper" }}>
      <div className="um__header">
        <div className="um__header-title">
          {headerIcon[mode]}
          <span>{headerTitle[mode]}</span>
        </div>
        <div className="um__header-actions">
          <IconButton className="um__close" onClick={onClose} size="small">
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <DialogContent className="um__content">
        {isView ? (
          <>
            {FIELD_GROUPS.map((group) => {
              const visibleFields = getVisibleFields(group.fields);
              return (
                <div key={group.label} className="um__group">
                  <p className="um__group-label">{group.label}</p>
                  <div className="um__grid">
                    {visibleFields.map((f) => (
                      <ViewField
                        key={f.name}
                        label={f.label}
                        half={f.half}
                        value={rowData?.[f.name]}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
            <div className="um__group">
              <p className="um__group-label">Role</p>
              <div className="um__field">
                <div className="um__input-wrap um__input-wrap--disabled">
                  <label className="um__label">Role</label>
                  <input
                    type="text"
                    value={rowData?.role?.name ?? "—"}
                    disabled
                    readOnly
                  />
                </div>
              </div>
            </div>
            <div className="um__footer">
              <UniversalButton
                label="Edit"
                icon={<EditIcon />}
                onClick={() => setMode("edit")}
              />
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {FIELD_GROUPS.map((group) => {
              const visibleFields = getVisibleFields(group.fields);
              if (visibleFields.length === 0) return null;
              return (
                <div key={group.label} className="um__group">
                  <p className="um__group-label">{group.label}</p>
                  <div className="um__grid">
                    {visibleFields.map((f) => (
                      <div
                        key={f.name}
                        className={f.half ? "um__col-half" : "um__col-full"}
                        style={
                          f.addOnly && mode !== "add"
                            ? { display: "none" }
                            : undefined
                        }>
                        <FormField
                          name={f.name}
                          label={f.label}
                          required={f.required}
                          type={f.type || "text"}
                          register={register}
                          errors={errors}
                          showPass={showPass}
                          onTogglePass={() => setShowPass((p) => !p)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="um__group">
              <p className="um__group-label">Role</p>
              <Controller
                name="role_id"
                control={control}
                render={({ field }) => (
                  <RoleAutocomplete
                    value={field.value}
                    onChange={field.onChange}
                    error={!!errors.role_id}
                    displayValue={rowData?.role?.name}
                  />
                )}
              />
              {errors.role_id && (
                <p className="um__error" style={{ marginTop: 6 }}>
                  <ReportProblemIcon />
                  {errors.role_id?.message}
                </p>
              )}
            </div>

            <div className="um__footer">
              {selectedRow && (
                <button
                  type="button"
                  className="um__back-btn"
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
                      : "Add User"
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

export default UsersModal;
