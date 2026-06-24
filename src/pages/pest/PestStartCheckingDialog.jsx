import { useState, useEffect, useRef } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import {
  useGetPestQuestionnaireQuery,
  useStorePestResponseMutation,
} from "../../features/api/pests/pestApi";
import { validateForm } from "./PestStartCheckingDialogValidation";
import ConfirmDialog from "../../reusable-components/comfirm-dialog/ConfirmDialog";
import "./PestStartCheckingDialog.scss";

const PEST_CHECKLIST_ID = 6;

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

const getPeriodStartDate = (period, month, year) => {
  if (!month || !year) return getTodayString();
  const mm = String(month).padStart(2, "0");
  const periodNum = parseInt(String(period).match(/\d+/)?.[0] ?? "1", 10);
  const day = periodNum === 1 ? "01" : "16";
  return `${year}-${mm}-${day}`;
};

const getGrade = (percent) => {
  if (percent <= 30) return { label: "Low", color: "#7bc67e" };
  if (percent <= 60) return { label: "Moderate", color: "#4db6ac" };
  return { label: "Critical", color: "#1a237e" };
};

const buildDraftGrid = (questionnaireData, responses = []) => {
  const pestGrid = {};
  const otherObservations = {};

  const inspectionAreas =
    questionnaireData?.items?.find((s) => s.name === "Inspection Areas")
      ?.items ?? [];
  const pests =
    questionnaireData?.items?.find((s) => s.name === "Pest")?.items ?? [];

  responses.forEach((resp) => {
    const raw = resp?.response ?? resp;
    const areaName = raw?.inspection_area ?? "";
    const pestList = raw?.pests ?? [];
    pestList.forEach((p) => {
      const pestName = typeof p === "string" ? p : p.name;
      const key = `${areaName}__${pestName}`;
      pestGrid[key] =
        typeof p === "object" && p.score != null ? String(p.score) : "";
    });
    const obsItems = raw?.other_obervation ?? raw?.other_observations ?? [];
    if (Array.isArray(obsItems)) {
      obsItems.forEach(({ name, score }) => {
        otherObservations[`${areaName}__${name}`] = score ?? "";
      });
    } else {
      Object.entries(obsItems).forEach(([k, v]) => {
        otherObservations[`${areaName}__${k}`] = v ?? "";
      });
    }
  });

  const initialGrid = {};
  inspectionAreas.forEach((area) => {
    pests.forEach((pest) => {
      const key = `${area.name}__${pest.name}`;
      initialGrid[key] = pestGrid[key] ?? "";
    });
  });

  return { pestGrid: initialGrid, otherObservations };
};

const RequiredStar = () => <span className="pest-sc__required">*</span>;

const skeletonSx = {
  bgcolor: "rgba(230, 100, 20, 0.10)",
  borderRadius: "6px",
  "&::after": {
    background:
      "linear-gradient(90deg, transparent, rgba(230, 100, 20, 0.07), transparent)",
  },
};

const PestStartCheckingDialog = ({
  open,
  onClose,
  onSuccess,
  unitName,
  period,
  month,
  year,
  checklistId = PEST_CHECKLIST_ID,
  unitId,
  evaluatorId,
  approverId,
  viewMode = false,
  continueMode = false,
  batchEntry = null,
}) => {
  const [pestGrid, setPestGrid] = useState({});
  const [otherObservations, setOtherObservations] = useState({});
  const [remarks, setRemarks] = useState("");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const firstErrorRef = useRef(null);

  const { data, isFetching } = useGetPestQuestionnaireQuery(checklistId, {
    skip: !open,
  });
  const [storePestResponse, { isLoading }] = useStorePestResponseMutation();

  const questionnaireData = data?.data;
  const inspectionAreas =
    questionnaireData?.items?.find((s) => s.name === "Inspection Areas")
      ?.items ?? [];
  const pests =
    questionnaireData?.items?.find((s) => s.name === "Pest")?.items ?? [];
  const otherObsItems =
    questionnaireData?.items?.find((s) => s.name === "Other Observation")
      ?.items ?? [];

  const obsFieldErrors = Object.keys(errors).filter((key) =>
    key.startsWith("obs__"),
  );
  const otherFieldErrorCount = Object.keys(errors).filter(
    (key) => !key.startsWith("obs__") && key !== "_submit",
  ).length;
  const errorCount = obsFieldErrors.length + otherFieldErrorCount;

  const getPestTotalScore = (pestName) => {
    return inspectionAreas.reduce((sum, area) => {
      const val = pestGrid[`${area.name}__${pestName}`];
      return sum + (val !== "" && val != null ? Number(val) : 0);
    }, 0);
  };

  const getMaxPossibleScorePerPest = () => inspectionAreas.length * 10;

  const getBarPercent = (totalScore) => {
    const max = getMaxPossibleScorePerPest();
    if (max === 0) return 0;
    return Math.min(Math.round((totalScore / max) * 100), 100);
  };

  const getViewPestTotalScore = (pestName) => {
    if (!batchEntry?.responses) return 0;
    return batchEntry.responses.reduce((sum, r) => {
      const raw = r?.response ?? r;
      const pestList = raw?.pests ?? [];
      const found = pestList.find((p) =>
        typeof p === "string" ? p === pestName : p.name === pestName,
      );
      if (found && typeof found === "object") {
        return sum + Number(found.score ?? 0);
      }
      return sum;
    }, 0);
  };

  useEffect(() => {
    if (viewMode) return;
    if (!open) return;
    setErrors({});
    setSubmitAttempted(false);
    setRemarks("");
    setNotes("");
  }, [open, viewMode]);

  useEffect(() => {
    if (!open || viewMode) return;
    if (continueMode && batchEntry && questionnaireData) {
      const { pestGrid: draftGrid, otherObservations: draftObs } =
        buildDraftGrid(questionnaireData, batchEntry.responses ?? []);
      setPestGrid(draftGrid);
      setOtherObservations(draftObs);
      setRemarks(batchEntry.remarks ?? "");
      setNotes(batchEntry.notes ?? "");
    } else if (!continueMode) {
      const initialGrid = {};
      inspectionAreas.forEach((area) => {
        pests.forEach((pest) => {
          initialGrid[`${area.name}__${pest.name}`] = "";
        });
      });
      setPestGrid(initialGrid);
      setOtherObservations({});
      setRemarks("");
      setNotes("");
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

  const handlePestScoreChange = (areaName, pestName, value) => {
    if (value !== "" && !/^\d*$/.test(value)) return;
    const key = `${areaName}__${pestName}`;
    setPestGrid((prev) => ({ ...prev, [key]: value }));
    clearFieldError(`grid__${key}`);
  };

  const handleObsToggle = (areaName, itemName, subName) => {
    const key = `${areaName}__${itemName}`;
    setOtherObservations((prev) => ({ ...prev, [key]: subName }));
    clearFieldError(`obs__${areaName}__${itemName}`);
  };

  const getViewGridValue = (areaName, pestName) => {
    if (!batchEntry?.responses) return "";
    for (const r of batchEntry.responses) {
      const raw = r?.response ?? r;
      if (raw?.inspection_area === areaName) {
        const pestList = raw?.pests ?? [];
        const found = pestList.find((p) =>
          typeof p === "string" ? p === pestName : p.name === pestName,
        );
        if (found != null) {
          return typeof found === "object" ? String(found.score ?? "") : "";
        }
      }
    }
    return "";
  };

  const getViewObsValue = (areaName, itemName) => {
    if (!batchEntry?.responses) return null;
    for (const r of batchEntry.responses) {
      const raw = r?.response ?? r;
      if (raw?.inspection_area === areaName) {
        const obs = raw?.other_obervation ?? raw?.other_observations ?? {};
        if (Array.isArray(obs)) {
          const found = obs.find((o) => o.name === itemName);
          if (found) return found.score;
        } else {
          return obs[itemName] ?? null;
        }
      }
    }
    return null;
  };

  const buildFormData = (isCompleted) => {
    const formData = new FormData();
    formData.append("checklist_id", checklistId);
    formData.append("unit_id", unitId ?? "");
    formData.append("evaluator_id", evaluatorId ?? "");
    formData.append("approver_id", approverId ?? "");
    formData.append("is_completed", isCompleted);
    formData.append("start_at", getPeriodStartDate(period, month, year));
    formData.append(
      "batch_no",
      continueMode ? (batchEntry?.batch_no ?? "") : "",
    );
    formData.append("remarks", remarks);
    formData.append("notes", notes);

    let responseIndex = 0;
    inspectionAreas.forEach((area) => {
      const pestList = pests
        .filter((pest) => {
          const val = pestGrid[`${area.name}__${pest.name}`];
          return val !== "" && val != null;
        })
        .map((pest) => ({
          name: pest.name,
          score: Number(pestGrid[`${area.name}__${pest.name}`]),
        }));
      const obsMap = {};
      otherObsItems.forEach((item) => {
        const val = otherObservations[`${area.name}__${item.name}`];
        if (val) obsMap[item.name] = val;
      });
      formData.append(
        `response[${responseIndex}]`,
        JSON.stringify({
          inspection_area: area.name,
          pests: pestList,
          other_observations: obsMap,
        }),
      );
      responseIndex++;
    });

    return formData;
  };

  const performSubmit = async (isCompleted) => {
    setIsSubmitting(true);
    try {
      const result = await storePestResponse(
        buildFormData(isCompleted),
      ).unwrap();
      onSuccess?.(result);
      setConfirmOpen(false);
      handleClose();
    } catch {
      setErrors({ _submit: "Something went wrong. Please try again." });
      setConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (isCompleted) => {
    setSubmitAttempted(true);
    const { valid, errors: validationErrors } = await validateForm(
      isCompleted,
      {
        pestGrid,
        otherObservations,
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

    await performSubmit(isCompleted);
  };

  const handleConfirmSubmit = () => {
    performSubmit(1);
  };

  const handleClose = () => {
    if (!viewMode) {
      setPestGrid({});
      setOtherObservations({});
      setRemarks("");
      setNotes("");
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

  const graphPests = viewMode
    ? pests.map((pest) => ({
        name: pest.name,
        total: getViewPestTotalScore(pest.name),
      }))
    : pests.map((pest) => ({
        name: pest.name,
        total: getPestTotalScore(pest.name),
      }));

  const renderSkeleton = () => (
    <div className="pest-sc__skeleton-wrap">
      <div className="pest-sc__skeleton-section">
        <Skeleton
          variant="rectangular"
          height={34}
          width="40%"
          sx={skeletonSx}
        />
        <div className="pest-sc__skeleton-table">
          <div className="pest-sc__skeleton-header-row">
            <Skeleton
              variant="rectangular"
              height={28}
              sx={{ ...skeletonSx, flex: 2 }}
            />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangular"
                height={28}
                sx={{ ...skeletonSx, flex: 1 }}
              />
            ))}
          </div>
          {Array.from({ length: 6 }).map((_, rowIdx) => (
            <div key={rowIdx} className="pest-sc__skeleton-row">
              <Skeleton
                variant="rectangular"
                height={36}
                sx={{ ...skeletonSx, flex: 2 }}
              />
              {Array.from({ length: 6 }).map((_, colIdx) => (
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
      <div className="pest-sc__skeleton-section">
        <Skeleton
          variant="rectangular"
          height={34}
          width="35%"
          sx={skeletonSx}
        />
        <div className="pest-sc__skeleton-graph">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="pest-sc__skeleton-graph-row">
              <Skeleton
                variant="rectangular"
                height={20}
                width={140}
                sx={skeletonSx}
              />
              <Skeleton
                variant="rectangular"
                height={20}
                sx={{ ...skeletonSx, flex: 1 }}
              />
              <Skeleton
                variant="rectangular"
                height={20}
                width={40}
                sx={skeletonSx}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="pest-sc__skeleton-section">
        <Skeleton
          variant="rectangular"
          height={34}
          width="20%"
          sx={skeletonSx}
        />
        <Skeleton variant="rectangular" height={90} sx={skeletonSx} />
        <Skeleton variant="rectangular" height={90} sx={skeletonSx} />
      </div>
    </div>
  );

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
        PaperProps={{ className: "pest-sc__paper" }}>
        <div className="pest-sc__header">
          <div className="pest-sc__header-title">
            <ChecklistIcon className="pest-sc__header-icon" />
            <span>{getDialogTitle()}</span>
          </div>
          <span className="pest-sc__name-value">
            {unitName} — {period} ({month}/{year})
          </span>
          <IconButton
            size="small"
            className="pest-sc__close"
            onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {viewMode && batchEntry && !isFetching && (
          <div className="pest-sc__info-strip">
            <div className="pest-sc__info-item">
              <span className="pest-sc__info-label">Submitted by</span>
              <span className="pest-sc__info-value">
                {batchEntry.user ?? "—"}
              </span>
            </div>
            <div className="pest-sc__info-item">
              <span className="pest-sc__info-label">Approver</span>
              <span className="pest-sc__info-value">
                {batchEntry.approver ?? "—"}
              </span>
            </div>
            <div className="pest-sc__info-item">
              <span className="pest-sc__info-label">Start</span>
              <span className="pest-sc__info-value">
                {formatDateTime(batchEntry.start_at)}
              </span>
            </div>
            <div className="pest-sc__info-item">
              <span className="pest-sc__info-label">End</span>
              <span className="pest-sc__info-value">
                {formatDateTime(batchEntry.end_at)}
              </span>
            </div>
          </div>
        )}

        {continueMode && batchEntry && !isFetching && (
          <div className="pest-sc__info-strip pest-sc__info-strip--draft">
            <div className="pest-sc__info-item">
              <span className="pest-sc__info-label">Draft by</span>
              <span className="pest-sc__info-value">
                {batchEntry.user ?? "—"}
              </span>
            </div>
            <div className="pest-sc__info-item">
              <span className="pest-sc__info-label">Started</span>
              <span className="pest-sc__info-value">
                {formatDateTime(batchEntry.start_at)}
              </span>
            </div>
          </div>
        )}

        <DialogContent className="pest-sc__content">
          {isFetching ? (
            renderSkeleton()
          ) : (
            <>
              <div className="pest-sc__section">
                <div className="pest-sc__section-header">Pest Inspection</div>
                <div className="pest-sc__table-scroll">
                  <table className="pest-sc__grid-table">
                    <thead>
                      <tr className="pest-sc__thead-row">
                        <th
                          className="pest-sc__th pest-sc__th--area"
                          rowSpan={2}>
                          Inspection Areas
                        </th>
                        <th
                          className="pest-sc__th pest-sc__th--group pest-sc__th--divider"
                          colSpan={pests.length}>
                          Pest
                        </th>
                        <th
                          className="pest-sc__th pest-sc__th--group"
                          colSpan={otherObsItems.reduce(
                            (acc, item) => acc + (item.sub_items?.length ?? 0),
                            0,
                          )}>
                          Other Observation {!viewMode && <RequiredStar />}
                        </th>
                      </tr>
                      <tr className="pest-sc__thead-row pest-sc__thead-row--sub">
                        {pests.map((pest, idx) => {
                          const isLastPest = idx === pests.length - 1;
                          return (
                            <th
                              key={pest.name}
                              className={`pest-sc__th pest-sc__th--col${isLastPest ? " pest-sc__th--divider" : ""}`}>
                              {pest.name}
                            </th>
                          );
                        })}
                        {otherObsItems.map((item, itemIdx) =>
                          item.sub_items?.map((sub, subIdx) => {
                            const isLastSub =
                              subIdx === item.sub_items.length - 1;
                            const isLastItem =
                              itemIdx === otherObsItems.length - 1;
                            const addDivider = isLastSub && !isLastItem;
                            return (
                              <th
                                key={`${item.name}__${sub.name}`}
                                className={`pest-sc__th pest-sc__th--col pest-sc__th--obs-sub${addDivider ? " pest-sc__th--divider" : ""}`}>
                                <div className="pest-sc__th-obs-group">
                                  {item.name}
                                </div>
                                <div className="pest-sc__th-obs-sub">
                                  {sub.name}
                                </div>
                              </th>
                            );
                          }),
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {inspectionAreas.map((area) => (
                        <tr key={area.name} className="pest-sc__tr">
                          <td className="pest-sc__td pest-sc__td--area-name">
                            {area.name}
                          </td>
                          {pests.map((pest, idx) => {
                            const key = `${area.name}__${pest.name}`;
                            const hasError = !!errors[`grid__${key}`];
                            const val = viewMode
                              ? getViewGridValue(area.name, pest.name)
                              : (pestGrid[key] ?? "");
                            const isLastPest = idx === pests.length - 1;
                            return (
                              <td
                                key={pest.name}
                                ref={getFirstErrorRef(hasError)}
                                className={`pest-sc__td pest-sc__td--input${hasError ? " pest-sc__td--error" : ""}${isLastPest ? " pest-sc__td--divider" : ""}`}>
                                {viewMode ? (
                                  <span className="pest-sc__score-display">
                                    {val !== "" ? val : "—"}
                                  </span>
                                ) : (
                                  <input
                                    type="number"
                                    min={0}
                                    className={`pest-sc__score-input${hasError ? " pest-sc__score-input--error" : ""}`}
                                    value={val}
                                    onChange={(e) =>
                                      handlePestScoreChange(
                                        area.name,
                                        pest.name,
                                        e.target.value,
                                      )
                                    }
                                    placeholder="0"
                                  />
                                )}
                              </td>
                            );
                          })}
                          {otherObsItems.map((item, itemIdx) =>
                            item.sub_items?.map((sub, subIdx) => {
                              const obsKey = `${area.name}__${item.name}`;
                              const errorKey = `obs__${area.name}__${item.name}`;
                              const hasError = !!errors[errorKey];
                              const currentVal = viewMode
                                ? getViewObsValue(area.name, item.name)
                                : (otherObservations[obsKey] ?? null);
                              const checked = currentVal === sub.name;
                              const isLastSub =
                                subIdx === item.sub_items.length - 1;
                              const isLastItem =
                                itemIdx === otherObsItems.length - 1;
                              const addDivider = isLastSub && !isLastItem;
                              const isFirstSub = subIdx === 0;
                              return (
                                <td
                                  key={`${item.name}__${sub.name}`}
                                  ref={getFirstErrorRef(
                                    hasError && sub === item.sub_items[0],
                                  )}
                                  className={`pest-sc__td pest-sc__td--checkbox${hasError ? " pest-sc__td--error" : ""}${addDivider ? " pest-sc__td--divider" : ""}`}>
                                  <label
                                    className={`pest-sc__checkbox-label${viewMode ? " pest-sc__checkbox-label--readonly" : ""}`}>
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={
                                        viewMode
                                          ? undefined
                                          : () =>
                                              handleObsToggle(
                                                area.name,
                                                item.name,
                                                sub.name,
                                              )
                                      }
                                      readOnly={viewMode}
                                      disabled={viewMode}
                                      className="pest-sc__checkbox-input"
                                    />
                                    <span className="pest-sc__checkbox-box" />
                                  </label>
                                  {hasError && isFirstSub && (
                                    <span className="pest-sc__inline-error pest-sc__inline-error--cell">
                                      <ErrorOutlineIcon sx={{ fontSize: 10 }} />
                                      {errors[errorKey]}
                                    </span>
                                  )}
                                </td>
                              );
                            }),
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pest-sc__section">
                <div className="pest-sc__section-header">Grading Summary</div>
                <div className="pest-sc__graph-body">
                  {graphPests.map(({ name, total }) => {
                    const percent = getBarPercent(total);
                    const grade = getGrade(percent);
                    return (
                      <div key={name} className="pest-sc__graph-row">
                        <span className="pest-sc__graph-label">{name}</span>
                        <div className="pest-sc__graph-bar-track">
                          <div
                            className="pest-sc__graph-bar-fill"
                            style={{
                              width: `${percent}%`,
                              background: grade.color,
                            }}
                          />
                        </div>
                        <span className="pest-sc__graph-percent">
                          {percent}%
                        </span>
                      </div>
                    );
                  })}
                  <div className="pest-sc__graph-legend">
                    <span className="pest-sc__legend-item">
                      <span
                        className="pest-sc__legend-dot"
                        style={{ background: "#7bc67e" }}
                      />
                      Low (0–30%)
                    </span>
                    <span className="pest-sc__legend-item">
                      <span
                        className="pest-sc__legend-dot"
                        style={{ background: "#4db6ac" }}
                      />
                      Moderate (31–60%)
                    </span>
                    <span className="pest-sc__legend-item">
                      <span
                        className="pest-sc__legend-dot"
                        style={{ background: "#1a237e" }}
                      />
                      Critical (61%+)
                    </span>
                  </div>
                </div>
              </div>

              <div className="pest-sc__section">
                <div className="pest-sc__section-header">Others</div>
                <div className="pest-sc__others-body">
                  <div className="pest-sc__others-field">
                    <span className="pest-sc__others-label">
                      Remarks for Observation
                    </span>
                    <div className="pest-sc__others-textarea-wrap">
                      <textarea
                        className="pest-sc__others-textarea"
                        placeholder="Type here*"
                        value={viewMode ? (batchEntry?.remarks ?? "") : remarks}
                        onChange={
                          viewMode
                            ? undefined
                            : (e) => {
                                setRemarks(e.target.value);
                                clearFieldError("remarks");
                              }
                        }
                        readOnly={viewMode}
                        disabled={viewMode}
                        rows={4}
                      />
                    </div>
                    {errors.remarks && (
                      <span className="pest-sc__inline-error">
                        <ErrorOutlineIcon sx={{ fontSize: 11 }} />
                        {errors.remarks}
                      </span>
                    )}
                  </div>

                  <div className="pest-sc__others-field">
                    <span className="pest-sc__others-label">Notes</span>
                    <div className="pest-sc__others-textarea-wrap">
                      <textarea
                        className="pest-sc__others-textarea"
                        placeholder="Type here"
                        value={viewMode ? (batchEntry?.notes ?? "") : notes}
                        onChange={
                          viewMode ? undefined : (e) => setNotes(e.target.value)
                        }
                        readOnly={viewMode}
                        disabled={viewMode}
                        rows={4}
                      />
                    </div>
                  </div>

                  {errors._submit && (
                    <span className="pest-sc__inline-error pest-sc__inline-error--block">
                      <ErrorOutlineIcon sx={{ fontSize: 13 }} />
                      {errors._submit}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>

        <DialogActions className="pest-sc__footer">
          {viewMode ? (
            <Button
              variant="text"
              onClick={handleClose}
              className="pest-sc__btn-close">
              CLOSE
            </Button>
          ) : (
            <>
              <div className="pest-sc__footer-left">
                {errorCount > 0 && (
                  <span className="pest-sc__error-summary">
                    <ErrorOutlineIcon sx={{ fontSize: 13 }} />
                    {errorCount} field{errorCount > 1 ? "s" : ""} need
                    {errorCount === 1 ? "s" : ""} attention
                  </span>
                )}
              </div>
              <div className="pest-sc__footer-right">
                <Button
                  variant="text"
                  onClick={handleClose}
                  disabled={isLoading || isSubmitting}
                  className="pest-sc__btn-close">
                  CLOSE
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleSubmit(0)}
                  disabled={isLoading || isSubmitting}
                  className="pest-sc__btn-draft">
                  {isLoading || isSubmitting ? "Saving..." : "SAVE AS DRAFT"}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleSubmit(1)}
                  disabled={isLoading || isSubmitting}
                  className="pest-sc__btn-submit">
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
        title="Submit Pest Inspection?"
        message="Once submitted, this checklist will be marked as completed and can no longer be edited."
        confirmLabel="Submit"
        cancelLabel="Cancel"
        isLoading={isSubmitting}
        confirmVariant="primary"
      />
    </>
  );
};

export default PestStartCheckingDialog;
