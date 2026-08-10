import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import CloseIcon from "@mui/icons-material/Close";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import EditIcon from "@mui/icons-material/Edit";
import RemoveRedEyeIcon from "@mui/icons-material/RemoveRedEye";
import PushPinIcon from "@mui/icons-material/PushPin";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import ArrowDropUpIcon from "@mui/icons-material/ArrowDropUp";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import ListAltIcon from "@mui/icons-material/ListAlt";
import AssignmentIcon from "@mui/icons-material/Assignment";
import BugReportIcon from "@mui/icons-material/BugReport";
import SanitizerIcon from "@mui/icons-material/Sanitizer";
import FlutterDashIcon from "@mui/icons-material/FlutterDash";
import GppMaybeIcon from "@mui/icons-material/GppMaybe";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ChecklistIcon from "@mui/icons-material/Checklist";
import {
  SaveButton,
  EditButton,
  BackModalButton,
} from "../../../reusable-components/universalbuttons/UniversalButtons";
import {
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
} from "../../../features/api/usermanagement/rolesApi";
import { useGetPermissionsQuery } from "../../../features/api/usermanagement/permissionsApi";
import { MODULES } from "../../../config/modules.jsx";
import "./RolesModal.scss";

const schema = yup.object({
  name: yup.string().required("Role name is required"),
  permission_id: yup
    .array()
    .of(yup.number())
    .min(1, "At least one permission is required"),
});

const PERMISSION_ICON_MAP = {
  Dashboard: <SpaceDashboardIcon />,
  "User Management": <ManageAccountsIcon />,
  Users: <ManageAccountsIcon />,
  Roles: <ManageAccountsIcon />,
  Permissions: <ManageAccountsIcon />,
  Masterlist: <ListAltIcon />,
  Questionnaires: <AssignmentIcon />,
  Pest: <BugReportIcon />,
  COBS: <SanitizerIcon />,
  Birds: <FlutterDashIcon />,
  Acknowledgement: <GppMaybeIcon />,
  "COBS Acknowledgement": <SanitizerIcon />,
  "BIRDS Acknowledgement": <FlutterDashIcon />,
  Monitoring: <VisibilityIcon />,
  "COBS Monitoring": <SanitizerIcon />,
};

const DEFAULT_PERMISSION_ICON = <ChecklistIcon />;

const buildPermissionGroups = (permissions) => {
  const byName = new Map(permissions.map((p) => [p.name, p]));
  const used = new Set();
  const groups = [];

  Object.values(MODULES).forEach((module) => {
    if (module.permissionId === "LOGIN") return;

    const parentPermission =
      byName.get(module.displayName) || byName.get(module.name);
    if (!parentPermission || used.has(parentPermission.id)) return;

    const children = [];
    if (module.children) {
      Object.values(module.children).forEach((child) => {
        const childPermission =
          byName.get(child.displayName) || byName.get(child.name);
        if (
          childPermission &&
          childPermission.id !== parentPermission.id &&
          !used.has(childPermission.id)
        ) {
          children.push(childPermission);
          used.add(childPermission.id);
        }
      });
    }

    used.add(parentPermission.id);
    groups.push({ ...parentPermission, children });
  });

  permissions.forEach((permission) => {
    if (!used.has(permission.id)) {
      groups.push({ ...permission, children: [] });
      used.add(permission.id);
    }
  });

  return groups;
};

const SkeletonLoader = () => (
  <div className="rm__skeleton-wrap">
    <div className="rm__skeleton-group">
      <span className="ut__skeleton rm__skeleton-label" />
      <span className="ut__skeleton rm__skeleton-field" />
    </div>
    <div className="rm__skeleton-group">
      <span className="ut__skeleton rm__skeleton-label" />
      <span className="ut__skeleton rm__skeleton-field rm__skeleton-field--tall" />
    </div>
    <div className="rm__skeleton-footer">
      <span className="ut__skeleton rm__skeleton-btn" />
    </div>
  </div>
);

const PermissionsChecklist = ({
  value = [],
  onChange,
  error,
  displayOptions = [],
}) => {
  const [expanded, setExpanded] = useState({});

  const { data, isFetching } = useGetPermissionsQuery({
    status: 1,
    page: 1,
    per_page: 50,
  });

  const options = data?.data?.length ? data.data : displayOptions;
  const groups = buildPermissionGroups(options);

  useEffect(() => {
    if (options.length === 0) return;
    setExpanded((prev) => {
      const next = { ...prev };
      groups.forEach((group) => {
        if (
          group.children.length > 0 &&
          next[group.id] === undefined &&
          group.children.some((child) => value.includes(child.id))
        ) {
          next[group.id] = true;
        }
      });
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const allIds = options.map((o) => o.id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => value.includes(id));
  const someSelected = value.some((id) => allIds.includes(id));
  const selectAllIndeterminate = someSelected && !allSelected;

  const toggleId = (id) => {
    onChange(
      value.includes(id) ? value.filter((v) => v !== id) : [...value, id],
    );
  };

  const toggleSelectAll = () => {
    onChange(allSelected ? [] : allIds);
  };

  const toggleGroup = (group) => {
    const childIds = group.children.map((c) => c.id);
    const allChildrenChecked = childIds.every((id) => value.includes(id));

    if (allChildrenChecked) {
      onChange(value.filter((v) => v !== group.id && !childIds.includes(v)));
    } else {
      const toAdd = [group.id, ...childIds].filter((id) => !value.includes(id));
      onChange([...value, ...toAdd]);
    }
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className={`rm__perm${error ? " rm__perm--error" : ""}`}>
      <label className="rm__label">
        Permissions
        <span className="rm__required">
          <PushPinIcon />
        </span>
      </label>

      <div className="rm__perm-box">
        <div className="rm__perm-selectall" onClick={toggleSelectAll}>
          <span
            className={`rm__perm-checkbox${
              allSelected ? " rm__perm-checkbox--checked" : ""
            }${
              selectAllIndeterminate ? " rm__perm-checkbox--indeterminate" : ""
            }`}
          />
          <span className="rm__perm-selectall-label">Select All</span>
        </div>

        {isFetching && options.length === 0 ? (
          <p className="rm__ac-empty">Loading...</p>
        ) : groups.length === 0 ? (
          <p className="rm__ac-empty">No permissions found</p>
        ) : (
          groups.map((group) => {
            const hasChildren = group.children.length > 0;
            const isOpen = !!expanded[group.id];
            const childIds = group.children.map((c) => c.id);
            const allChildrenChecked =
              hasChildren && childIds.every((id) => value.includes(id));
            const someChildrenChecked =
              hasChildren && childIds.some((id) => value.includes(id));
            const checked = hasChildren
              ? allChildrenChecked
              : value.includes(group.id);
            const indeterminate =
              hasChildren && someChildrenChecked && !allChildrenChecked;

            return (
              <div key={group.id} className="rm__perm-group">
                <div
                  className="rm__perm-row"
                  onClick={() =>
                    hasChildren ? toggleExpand(group.id) : toggleId(group.id)
                  }>
                  <span
                    className={`rm__perm-checkbox${
                      checked ? " rm__perm-checkbox--checked" : ""
                    }${
                      indeterminate ? " rm__perm-checkbox--indeterminate" : ""
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      hasChildren ? toggleGroup(group) : toggleId(group.id);
                    }}
                  />
                  <span className="rm__perm-icon">
                    {PERMISSION_ICON_MAP[group.name] ?? DEFAULT_PERMISSION_ICON}
                  </span>
                  <span className="rm__perm-label">{group.name}</span>
                  {hasChildren && (
                    <span className="rm__perm-arrow">
                      {isOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
                    </span>
                  )}
                </div>

                {hasChildren && (
                  <Collapse in={isOpen}>
                    <div className="rm__perm-children">
                      {group.children.map((child) => {
                        const childChecked = value.includes(child.id);
                        return (
                          <div
                            key={child.id}
                            className={`rm__perm-chip${childChecked ? " rm__perm-chip--checked" : ""}`}
                            onClick={() => toggleId(child.id)}>
                            <span
                              className={`rm__perm-checkbox${childChecked ? " rm__perm-checkbox--checked" : ""}`}
                            />
                            <span className="rm__perm-chip-label">
                              {child.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </Collapse>
                )}
              </div>
            );
          })
        )}
      </div>
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
              <EditButton onClick={() => setMode("edit")} />
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
                  <PermissionsChecklist
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
                <BackModalButton onClick={() => setMode("view")} />
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
