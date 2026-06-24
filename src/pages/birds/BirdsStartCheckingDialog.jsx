import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import {
  useGetBirdsQuestionnaireTemplateQuery,
  useCreateBirdMutation,
} from "../../features/api/birds/birdsApi";
import { validateForm } from "./BirdsStartCheckingDialogValidation";
import "./BirdsStartCheckingDialog.scss";
import { useGetWastagesQuery } from "../../features/api/masterlist/wastagesApi";
import { useGetEvaluatorsQuery } from "../../features/api/usermanagement/userApi";
import ConfirmDialog from "../../reusable-components/comfirm-dialog/ConfirmDialog";

const formatDateTime = (raw) => {
  if (!raw) return "—";
  const date = new Date(raw);
  if (isNaN(date)) return "—";
  return date.toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

const getTodayString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const toDateString = (y, m, d) => {
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
};

const getPeriodNumber = (periodLabel) => {
  if (!periodLabel) return null;
  const match = String(periodLabel).match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
};

const getPeriodDateRange = (periodLabel, month, year) => {
  const periodNum = getPeriodNumber(periodLabel);
  if (!periodNum || !month || !year) return { min: null, max: null };

  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const rangeStart = (periodNum - 1) * 7 + 1;
  const rangeEnd = Math.min(periodNum * 7, lastDayOfMonth);

  if (rangeStart > lastDayOfMonth) return { min: null, max: null };

  return {
    min: toDateString(year, month, rangeStart),
    max: toDateString(year, month, rangeEnd),
  };
};

const clampDateToRange = (dateStr, min, max) => {
  if (!dateStr) return min ?? getTodayString();
  if (min && dateStr < min) return min;
  if (max && dateStr > max) return max;
  return dateStr;
};

const isLowLevel = (level) =>
  typeof level === "string" && level.toLowerCase() === "low";

const buildDraftState = (questionnaireData, responses = []) => {
  const infestationLevel = {};
  const treatmentDose = {};
  const entryPoints = {};
  const wastageSelection = {};

  const inspectionAreas =
    questionnaireData?.items?.find((s) => s.name === "Inspection Areas")
      ?.items ?? [];

  inspectionAreas.forEach((area) => {
    wastageSelection[area.name] = "";
  });

  responses.forEach((resp) => {
    const raw = resp?.response ?? resp;
    const areaName = raw?.inspection_area ?? "";
    if (raw?.infestation_level)
      infestationLevel[areaName] = raw.infestation_level;
    if (raw?.treatment_dose != null)
      treatmentDose[areaName] = raw.treatment_dose;
    if (raw?.entry_points != null) entryPoints[areaName] = raw.entry_points;
    const wastage = raw?.wastage ?? [];
    if (Array.isArray(wastage) && wastage.length > 0) {
      const first = wastage[0];
      wastageSelection[areaName] =
        typeof first === "string" ? first : (first?.name ?? "");
    }
  });

  return { infestationLevel, treatmentDose, entryPoints, wastageSelection };
};

const getResponseCompanion = (responses = []) => {
  for (const r of responses) {
    const raw = r?.response ?? r;
    if (raw?.others_companion != null && raw.others_companion !== "")
      return raw.others_companion;
    if (raw?.companion != null && raw.companion !== "") return raw.companion;
  }
  return "";
};

const skeletonSx = {
  bgcolor: "rgba(230, 100, 20, 0.10)",
  borderRadius: "6px",
  "&::after": {
    background:
      "linear-gradient(90deg, transparent, rgba(230, 100, 20, 0.07), transparent)",
  },
};

const getLevelColorClass = (levelName) => {
  if (!levelName) return "";
  const lower = levelName.toLowerCase();
  if (lower === "low") return "birds-sc__radio-box--low";
  if (lower === "average") return "birds-sc__radio-box--average";
  if (lower === "moderate") return "birds-sc__radio-box--moderate";
  return "";
};

const WastageDropdown = ({ value, options, onChange, hasError }) => {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 3,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setOpen((p) => !p);
  };

  return (
    <div
      ref={wrapRef}
      className={`birds-sc__dd-wrap${hasError ? " birds-sc__dd-wrap--error" : ""}`}
      onClick={handleOpen}>
      <div className="birds-sc__dd-box">
        <span
          className={value ? "birds-sc__dd-value" : "birds-sc__dd-placeholder"}>
          {value || "Select..."}
        </span>
        <ArrowDropDownIcon
          className={`birds-sc__dd-arrow${open ? " birds-sc__dd-arrow--open" : ""}`}
        />
      </div>
      {open &&
        createPortal(
          <div className="birds-sc__dd-dropdown" style={dropdownStyle}>
            <div
              className={`birds-sc__dd-option${value === "" ? " birds-sc__dd-option--selected" : ""}`}
              onMouseDown={(e) => {
                e.stopPropagation();
                onChange("");
                setOpen(false);
              }}></div>
            {options.map((w) => (
              <div
                key={w.id ?? w.name}
                className={`birds-sc__dd-option${value === w.name ? " birds-sc__dd-option--selected" : ""}`}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onChange(w.name);
                  setOpen(false);
                }}>
                {w.name}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
};

const GenericDropdown = ({
  value,
  options,
  onChange,
  hasError,
  placeholder = "Select...",
}) => {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});
  const wrapRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (wrapRef.current) {
      const rect = wrapRef.current.getBoundingClientRect();
      setDropdownStyle({
        position: "fixed",
        top: rect.bottom + 3,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    setOpen((p) => !p);
  };

  const selectedLabel =
    options.find((o) => o.id === value || o.value === value)?.label ??
    options.find((o) => o.id === value)?.name ??
    value ??
    "";

  return (
    <div
      ref={wrapRef}
      className={`birds-sc__dd-wrap${hasError ? " birds-sc__dd-wrap--error" : ""}`}
      onClick={handleOpen}>
      <div className="birds-sc__dd-box">
        <span
          className={
            selectedLabel ? "birds-sc__dd-value" : "birds-sc__dd-placeholder"
          }>
          {selectedLabel || placeholder}
        </span>
        <ArrowDropDownIcon
          className={`birds-sc__dd-arrow${open ? " birds-sc__dd-arrow--open" : ""}`}
        />
      </div>
      {open &&
        createPortal(
          <div className="birds-sc__dd-dropdown" style={dropdownStyle}>
            <div
              className={`birds-sc__dd-option${!value ? " birds-sc__dd-option--selected" : ""}`}
              onMouseDown={(e) => {
                e.stopPropagation();
                onChange("");
                setOpen(false);
              }}></div>
            {options.map((opt) => {
              const optId = opt.id ?? opt.value ?? opt.name;
              const optLabel = opt.label ?? opt.name ?? opt.full_name ?? "";
              return (
                <div
                  key={optId}
                  className={`birds-sc__dd-option${value === optId ? " birds-sc__dd-option--selected" : ""}`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    onChange(optId);
                    setOpen(false);
                  }}>
                  {optLabel}
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </div>
  );
};

const BirdsStartCheckingDialog = ({
  open,
  onClose,
  onSuccess,
  unitName,
  period,
  month,
  year,
  checklistId,
  unitId,
  evaluatorId,
  approverId,
  viewMode = false,
  continueMode = false,
  batchEntry = null,
}) => {
  const [infestationLevel, setInfestationLevel] = useState({});
  const [treatmentDose, setTreatmentDose] = useState({});
  const [entryPoints, setEntryPoints] = useState({});
  const [wastageSelection, setWastageSelection] = useState({});
  const [othersDate, setOthersDate] = useState(getTodayString());
  const [othersCompanion, setOthersCompanion] = useState("");
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const firstErrorRef = useRef(null);

  const { data, isFetching } = useGetBirdsQuestionnaireTemplateQuery(
    checklistId,
    { skip: !open || !checklistId },
  );
  const { data: wastagesData } = useGetWastagesQuery(undefined, {
    skip: !open,
  });
  const { data: usersData } = useGetEvaluatorsQuery(undefined, {
    skip: !open,
  });
  const [createBird, { isLoading }] = useCreateBirdMutation();

  const questionnaireData = data?.data;
  const inspectionAreas =
    questionnaireData?.items?.find((s) => s.name === "Inspection Areas")
      ?.items ?? [];
  const infestationLevelItems =
    questionnaireData?.items?.find((s) => s.name === "Infestation Level")
      ?.items ?? [];
  const wastageOptions = wastagesData?.data ?? [];
  const usersOptions = (usersData?.data ?? []).map((u) => ({
    id: u.id,
    label:
      u.full_name ??
      u.name ??
      `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim(),
  }));

  const errorCount = Object.keys(errors).length;

  const periodDateRange = getPeriodDateRange(period, month, year);

  useEffect(() => {
    if (viewMode) return;
    if (!open) return;
    setErrors({});
    setSubmitAttempted(false);
  }, [open, viewMode]);

  useEffect(() => {
    if (!open || viewMode) return;
    if (continueMode && batchEntry && questionnaireData) {
      const draft = buildDraftState(
        questionnaireData,
        batchEntry.responses ?? [],
      );
      setInfestationLevel(draft.infestationLevel);
      setTreatmentDose(draft.treatmentDose);
      setEntryPoints(draft.entryPoints);
      setWastageSelection(draft.wastageSelection);
      setOthersDate(
        clampDateToRange(
          batchEntry.start_at ?? getTodayString(),
          periodDateRange.min,
          periodDateRange.max,
        ),
      );
      setOthersCompanion(batchEntry.others_companion ?? "");
    } else if (!continueMode) {
      const initWastage = {};
      inspectionAreas.forEach((area) => {
        initWastage[area.name] = "";
      });
      setInfestationLevel({});
      setTreatmentDose({});
      setEntryPoints({});
      setWastageSelection(initWastage);
      setOthersDate(
        clampDateToRange(
          getTodayString(),
          periodDateRange.min,
          periodDateRange.max,
        ),
      );
      setOthersCompanion("");
    }
  }, [open, continueMode, batchEntry, questionnaireData, viewMode]);

  useEffect(() => {
    if (submitAttempted && firstErrorRef.current) {
      firstErrorRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [errors, submitAttempted]);

  const clearFieldError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleInfestationChange = (areaName, value) => {
    setInfestationLevel((prev) => ({ ...prev, [areaName]: value }));
    clearFieldError(`infestation__${areaName}`);
    if (isLowLevel(value)) {
      setTreatmentDose((prev) => ({ ...prev, [areaName]: "" }));
      setEntryPoints((prev) => ({ ...prev, [areaName]: "" }));
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`treatment__${areaName}`];
        delete next[`entry__${areaName}`];
        return next;
      });
    }
  };

  const handleTreatmentChange = (areaName, value) => {
    setTreatmentDose((prev) => ({ ...prev, [areaName]: value }));
    clearFieldError(`treatment__${areaName}`);
  };

  const handleEntryPointsChange = (areaName, value) => {
    setEntryPoints((prev) => ({ ...prev, [areaName]: value }));
    clearFieldError(`entry__${areaName}`);
  };

  const handleWastageChange = (areaName, value) => {
    setWastageSelection((prev) => ({ ...prev, [areaName]: value }));
    clearFieldError(`wastage__${areaName}`);
  };

  const handleOthersDateChange = (value) => {
    setOthersDate(
      clampDateToRange(value, periodDateRange.min, periodDateRange.max),
    );
  };

  const getViewInfestation = (areaName) => {
    if (!batchEntry?.responses) return null;
    for (const r of batchEntry.responses) {
      const raw = r?.response ?? r;
      if (raw?.inspection_area === areaName)
        return raw?.infestation_level ?? null;
    }
    return null;
  };

  const getViewTreatment = (areaName) => {
    if (!batchEntry?.responses) return "";
    for (const r of batchEntry.responses) {
      const raw = r?.response ?? r;
      if (raw?.inspection_area === areaName) return raw?.treatment_dose ?? "";
    }
    return "";
  };

  const getViewEntryPoints = (areaName) => {
    if (!batchEntry?.responses) return "";
    for (const r of batchEntry.responses) {
      const raw = r?.response ?? r;
      if (raw?.inspection_area === areaName) return raw?.entry_points ?? "";
    }
    return "";
  };

  const getViewWastage = (areaName) => {
    if (!batchEntry?.responses) return "";
    for (const r of batchEntry.responses) {
      const raw = r?.response ?? r;
      if (raw?.inspection_area === areaName) {
        const wastage = raw?.wastage ?? [];
        if (wastage.length === 0) return "";
        const first = wastage[0];
        return typeof first === "string" ? first : (first?.name ?? "");
      }
    }
    return "";
  };

  const buildFormData = (isCompleted) => {
    const formData = new FormData();
    formData.append("checklist_id", checklistId);
    formData.append("unit_id", unitId ?? "");
    formData.append("evaluator_id", evaluatorId ?? "");
    formData.append("approver_id", approverId ?? "");
    formData.append("is_completed", isCompleted);
    formData.append("start_at", othersDate ?? getTodayString());
    formData.append(
      "batch_no",
      continueMode ? (batchEntry?.batch_no ?? "") : "",
    );
    formData.append("others_companion", othersCompanion ?? "");

    inspectionAreas.forEach((area, index) => {
      const selected = wastageSelection[area.name] ?? "";
      const wastageList = selected ? [selected] : [];
      const level = infestationLevel[area.name] ?? "";
      const low = isLowLevel(level);

      formData.append(
        `response[${index}]`,
        JSON.stringify({
          inspection_area: area.name,
          infestation_level: level,
          treatment_dose: low ? "" : (treatmentDose[area.name] ?? ""),
          entry_points: low ? "" : (entryPoints[area.name] ?? ""),
          wastage: wastageList,
        }),
      );
    });

    return formData;
  };

  const handleSubmitClick = async (isCompleted) => {
    setSubmitAttempted(true);
    const { valid, errors: validationErrors } = await validateForm(
      isCompleted,
      {
        infestationLevel,
        treatmentDose,
        entryPoints,
        questionnaireData,
      },
    );

    if (!valid) {
      setErrors(validationErrors);
      return;
    }

    if (isCompleted) {
      setConfirmOpen(true);
      return;
    }

    await executeSubmit(isCompleted);
  };

  const executeSubmit = async (isCompleted) => {
    setIsSubmitting(true);
    try {
      const result = await createBird(buildFormData(isCompleted)).unwrap();
      onSuccess?.(result);
      handleClose();
    } catch {
      setErrors({ _submit: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmSubmit = async () => {
    setConfirmOpen(false);
    await executeSubmit(1);
  };

  const handleClose = () => {
    if (!viewMode) {
      setInfestationLevel({});
      setTreatmentDose({});
      setEntryPoints({});
      setWastageSelection({});
      setOthersDate(getTodayString());
      setOthersCompanion("");
      setErrors({});
      setSubmitAttempted(false);
    }
    onClose();
  };

  const getDialogTitle = () => {
    if (viewMode) return "View Checklist";
    if (continueMode) return "Continue Checking";
    return "Start Checking";
  };

  let firstErrorSet = false;
  const getFirstErrorRef = (hasError) => {
    if (hasError && !firstErrorSet) {
      firstErrorSet = true;
      return firstErrorRef;
    }
    return null;
  };

  const renderSkeleton = () => (
    <div className="birds-sc__skeleton-wrap">
      <div className="birds-sc__skeleton-section">
        <Skeleton
          variant="rectangular"
          height={34}
          width="40%"
          sx={skeletonSx}
        />
        <div className="birds-sc__skeleton-table">
          <div className="birds-sc__skeleton-header-row">
            <Skeleton
              variant="rectangular"
              height={28}
              sx={{ ...skeletonSx, flex: 2 }}
            />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={28}
                sx={{ ...skeletonSx, flex: 1 }}
              />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, rowIdx) => (
            <div key={rowIdx} className="birds-sc__skeleton-row">
              <Skeleton
                variant="rectangular"
                height={36}
                sx={{ ...skeletonSx, flex: 2 }}
              />
              {Array.from({ length: 5 }).map((_, colIdx) => (
                <Skeleton
                  key={colIdx}
                  variant="rectangular"
                  height={36}
                  sx={{ ...skeletonSx, flex: 1 }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="birds-sc__skeleton-section">
        <Skeleton
          variant="rectangular"
          height={34}
          width="20%"
          sx={skeletonSx}
        />
        <div className="birds-sc__skeleton-others-row">
          <Skeleton
            variant="rectangular"
            height={54}
            sx={{ ...skeletonSx, flex: 1 }}
          />
          <Skeleton
            variant="rectangular"
            height={54}
            sx={{ ...skeletonSx, flex: 1 }}
          />
        </div>
      </div>
    </div>
  );

  const viewCompanionLabel =
    getResponseCompanion(batchEntry?.responses) ||
    batchEntry?.evaluator ||
    batchEntry?.others_companion ||
    "—";

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (!viewMode && reason === "backdropClick") return;
          handleClose();
        }}
        disableEscapeKeyDown={!viewMode}
        maxWidth="lg"
        fullWidth
        PaperProps={{ className: "birds-sc__paper" }}>
        <div className="birds-sc__header">
          <div className="birds-sc__header-title">
            <ChecklistIcon className="birds-sc__header-icon" />
            <span>{getDialogTitle()}</span>
          </div>
          <span className="birds-sc__name-value">
            {unitName} — {period} ({month}/{year})
          </span>
          <IconButton
            size="small"
            className="birds-sc__close"
            onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {continueMode && batchEntry && !isFetching && (
          <div className="birds-sc__info-strip birds-sc__info-strip--draft">
            <div className="birds-sc__info-item">
              <span className="birds-sc__info-label">Draft by</span>
              <span className="birds-sc__info-value">
                {batchEntry.user ?? "—"}
              </span>
            </div>
            <div className="birds-sc__info-item">
              <span className="birds-sc__info-label">Started</span>
              <span className="birds-sc__info-value">
                {formatDateTime(batchEntry.start_at)}
              </span>
            </div>
          </div>
        )}

        <DialogContent className="birds-sc__content">
          {isFetching ? (
            renderSkeleton()
          ) : (
            <>
              <div className="birds-sc__section">
                <div className="birds-sc__section-header">Bird Inspection</div>
                <div className="birds-sc__table-scroll">
                  <table className="birds-sc__grid-table">
                    <thead>
                      <tr className="birds-sc__thead-row">
                        <th className="birds-sc__th birds-sc__th--area">
                          Inspection Areas
                        </th>
                        <th
                          className="birds-sc__th birds-sc__th--group"
                          colSpan={infestationLevelItems.length}>
                          Infestation Level{" "}
                          {!viewMode && (
                            <span className="birds-sc__required">*</span>
                          )}
                        </th>
                        <th className="birds-sc__th birds-sc__th--group">
                          Treatment / Action Dose
                        </th>
                        <th className="birds-sc__th birds-sc__th--group">
                          Presence of Feed/RM Wastage
                        </th>
                        <th className="birds-sc__th birds-sc__th--group">
                          Identify Entry Points
                        </th>
                      </tr>
                      <tr className="birds-sc__thead-row birds-sc__thead-row--sub">
                        <th className="birds-sc__th birds-sc__th--area-placeholder" />
                        {infestationLevelItems.map((lvl) => (
                          <th
                            key={lvl.name}
                            className="birds-sc__th birds-sc__th--col">
                            {lvl.name}
                          </th>
                        ))}
                        <th className="birds-sc__th birds-sc__th--col birds-sc__th--wide" />
                        <th className="birds-sc__th birds-sc__th--col birds-sc__th--wide" />
                        <th className="birds-sc__th birds-sc__th--col birds-sc__th--wide" />
                      </tr>
                    </thead>
                    <tbody>
                      {inspectionAreas.map((area) => {
                        const infestErrorKey = `infestation__${area.name}`;
                        const treatErrorKey = `treatment__${area.name}`;
                        const entryErrorKey = `entry__${area.name}`;
                        const infestError = !!errors[infestErrorKey];
                        const treatError = !!errors[treatErrorKey];
                        const entryError = !!errors[entryErrorKey];
                        const currentInfestation = viewMode
                          ? getViewInfestation(area.name)
                          : (infestationLevel[area.name] ?? null);
                        const currentTreatment = viewMode
                          ? getViewTreatment(area.name)
                          : (treatmentDose[area.name] ?? "");
                        const currentEntry = viewMode
                          ? getViewEntryPoints(area.name)
                          : (entryPoints[area.name] ?? "");
                        const currentWastage = viewMode
                          ? getViewWastage(area.name)
                          : (wastageSelection[area.name] ?? "");
                        const isDisabled =
                          !viewMode && isLowLevel(currentInfestation);

                        return (
                          <tr key={area.name} className="birds-sc__tr">
                            <td className="birds-sc__td birds-sc__td--area-name">
                              {area.name}
                            </td>
                            {infestationLevelItems.map((lvl, i) => {
                              const checked = currentInfestation === lvl.name;
                              const colorClass = getLevelColorClass(lvl.name);
                              const isFirstCol = i === 0;
                              return (
                                <td
                                  key={lvl.name}
                                  ref={
                                    isFirstCol
                                      ? getFirstErrorRef(infestError)
                                      : null
                                  }
                                  className={`birds-sc__td birds-sc__td--radio${infestError ? " birds-sc__td--error" : ""}`}>
                                  <label
                                    className={`birds-sc__radio-label${viewMode ? " birds-sc__radio-label--readonly" : ""}`}>
                                    <input
                                      type="radio"
                                      name={`infestation__${area.name}`}
                                      checked={checked}
                                      onChange={
                                        viewMode
                                          ? undefined
                                          : () =>
                                              handleInfestationChange(
                                                area.name,
                                                lvl.name,
                                              )
                                      }
                                      readOnly={viewMode}
                                      disabled={viewMode}
                                      className="birds-sc__radio-input"
                                    />
                                    <span
                                      className={`birds-sc__radio-box ${checked ? colorClass : ""}`}
                                    />
                                  </label>
                                  {infestError && isFirstCol && (
                                    <span className="birds-sc__inline-error birds-sc__inline-error--cell">
                                      <ErrorOutlineIcon sx={{ fontSize: 10 }} />
                                      {errors[infestErrorKey]}
                                    </span>
                                  )}
                                </td>
                              );
                            })}
                            <td
                              ref={getFirstErrorRef(treatError)}
                              className={`birds-sc__td birds-sc__td--text${treatError ? " birds-sc__td--error" : ""}${isDisabled ? " birds-sc__td--disabled" : ""}`}>
                              {viewMode ? (
                                <span className="birds-sc__text-display">
                                  {currentTreatment || "—"}
                                </span>
                              ) : (
                                <>
                                  <input
                                    type="text"
                                    className={`birds-sc__text-input${treatError ? " birds-sc__text-input--error" : ""}${isDisabled ? " birds-sc__text-input--disabled" : ""}`}
                                    value={currentTreatment}
                                    onChange={(e) =>
                                      handleTreatmentChange(
                                        area.name,
                                        e.target.value,
                                      )
                                    }
                                    placeholder={
                                      isDisabled ? "N/A" : "Enter dose"
                                    }
                                    disabled={isDisabled}
                                  />
                                  {treatError && (
                                    <span className="birds-sc__inline-error">
                                      <ErrorOutlineIcon sx={{ fontSize: 10 }} />
                                      {errors[treatErrorKey]}
                                    </span>
                                  )}
                                </>
                              )}
                            </td>
                            <td className="birds-sc__td birds-sc__td--text">
                              {viewMode ? (
                                <span className="birds-sc__text-display">
                                  {currentWastage || "—"}
                                </span>
                              ) : (
                                <WastageDropdown
                                  value={currentWastage}
                                  options={wastageOptions}
                                  onChange={(val) =>
                                    handleWastageChange(area.name, val)
                                  }
                                  hasError={false}
                                />
                              )}
                            </td>
                            <td
                              ref={getFirstErrorRef(entryError)}
                              className={`birds-sc__td birds-sc__td--text${entryError ? " birds-sc__td--error" : ""}${isDisabled ? " birds-sc__td--disabled" : ""}`}>
                              {viewMode ? (
                                <span className="birds-sc__text-display">
                                  {currentEntry || "—"}
                                </span>
                              ) : (
                                <>
                                  <input
                                    type="text"
                                    className={`birds-sc__text-input${entryError ? " birds-sc__text-input--error" : ""}${isDisabled ? " birds-sc__text-input--disabled" : ""}`}
                                    value={currentEntry}
                                    onChange={(e) =>
                                      handleEntryPointsChange(
                                        area.name,
                                        e.target.value,
                                      )
                                    }
                                    placeholder={
                                      isDisabled
                                        ? "N/A"
                                        : "e.g. North gate, Roof gap"
                                    }
                                    disabled={isDisabled}
                                  />
                                  {entryError && (
                                    <span className="birds-sc__inline-error">
                                      <ErrorOutlineIcon sx={{ fontSize: 10 }} />
                                      {errors[entryErrorKey]}
                                    </span>
                                  )}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="birds-sc__section birds-sc__section--others">
                <div className="birds-sc__section-header">Others</div>
                <div className="birds-sc__others-body">
                  <div className="birds-sc__others-field">
                    <label className="birds-sc__others-label">Date</label>
                    {viewMode ? (
                      <span className="birds-sc__text-display">
                        {batchEntry?.start_at
                          ? new Date(batchEntry.start_at).toLocaleDateString(
                              "en-PH",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "—"}
                      </span>
                    ) : (
                      <input
                        type="date"
                        className="birds-sc__text-input birds-sc__text-input--date"
                        value={othersDate}
                        min={periodDateRange.min ?? undefined}
                        max={periodDateRange.max ?? undefined}
                        onChange={(e) => handleOthersDateChange(e.target.value)}
                      />
                    )}
                  </div>
                  <div className="birds-sc__others-field">
                    <label className="birds-sc__others-label">Companion</label>
                    {viewMode ? (
                      <span className="birds-sc__text-display">
                        {viewCompanionLabel}
                      </span>
                    ) : (
                      <GenericDropdown
                        value={othersCompanion}
                        options={usersOptions}
                        onChange={setOthersCompanion}
                        placeholder="Select companion..."
                      />
                    )}
                  </div>
                </div>
              </div>

              {errors._submit && (
                <span className="birds-sc__inline-error birds-sc__inline-error--block">
                  <ErrorOutlineIcon sx={{ fontSize: 13 }} />
                  {errors._submit}
                </span>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions className="birds-sc__footer">
          {viewMode ? (
            <Button
              variant="text"
              onClick={handleClose}
              className="birds-sc__btn-close">
              CLOSE
            </Button>
          ) : (
            <>
              <div className="birds-sc__footer-left">
                {errorCount > 0 && (
                  <span className="birds-sc__error-summary">
                    <ErrorOutlineIcon sx={{ fontSize: 13 }} />
                    {errorCount} field{errorCount > 1 ? "s" : ""} need
                    {errorCount === 1 ? "s" : ""} attention
                  </span>
                )}
              </div>
              <div className="birds-sc__footer-right">
                <Button
                  variant="text"
                  onClick={handleClose}
                  disabled={isLoading || isSubmitting}
                  className="birds-sc__btn-close">
                  CLOSE
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleSubmitClick(0)}
                  disabled={isLoading || isSubmitting}
                  className="birds-sc__btn-draft">
                  {isLoading || isSubmitting ? "Saving..." : "SAVE AS DRAFT"}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleSubmitClick(1)}
                  disabled={isLoading || isSubmitting}
                  className="birds-sc__btn-submit">
                  {isLoading || isSubmitting ? "Submitting..." : "SUBMIT"}
                </Button>
              </div>
            </>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Submit Checklist?"
        message="Are you sure you want to submit this bird inspection checklist? This action cannot be undone."
        confirmLabel="Submit"
        cancelLabel="Cancel"
        isLoading={isSubmitting}
        confirmVariant="primary"
      />
    </>
  );
};

export default BirdsStartCheckingDialog;
