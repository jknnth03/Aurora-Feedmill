import { useState, useRef, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";
import Skeleton from "@mui/material/Skeleton";
import CloseIcon from "@mui/icons-material/Close";
import ChecklistIcon from "@mui/icons-material/Checklist";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import {
  useGetQuestionnaireQuery,
  useCreateCobMutation,
} from "../../features/api/cobs/cobsApi";
import COBSImagePreviewDialog from "./COBSImagePreviewDialog";
import ConfirmDialog from "../../reusable-components/comfirm-dialog/ConfirmDialog";
import "./COBSStartCheckingDialog.scss";

const SCORE_OPTIONS = [0, 50, 75, 100];
const TEMPORAL_AUDIT_OPTIONS = [
  "Spot/Ongoing",
  "Pre-operation",
  "Post-operation",
];

const getNow = () => {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
};

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

const formatDateDisplay = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const getWeekDateRange = (week, month, year) => {
  const m = parseInt(month) - 1;
  const y = parseInt(year);
  const w = parseInt(String(week).replace(/\D/g, ""));
  const lastDay = new Date(y, m + 1, 0).getDate();
  const ranges = [
    { start: 1, end: 7 },
    { start: 8, end: 14 },
    { start: 15, end: 21 },
    { start: 22, end: lastDay },
  ];
  const range = ranges[w - 1] ?? ranges[0];
  const pad = (n) => String(n).padStart(2, "0");
  const monthStr = pad(parseInt(month));
  return {
    min: `${y}-${monthStr}-${pad(range.start)}`,
    max: `${y}-${monthStr}-${pad(range.end)}`,
  };
};

const buildResponseMap = (responses = []) => {
  const map = {};
  responses.forEach(({ response, images }) => {
    if (!response) return;
    const subKey = response.sub_item ?? response.sub_name ?? "";
    const key = `${response.checklist}__${response.item}__${subKey}`;
    map[key] = { ...response, images: images ?? [] };
  });
  return map;
};

const buildDraftAnswers = (questionnaireData, responses = []) => {
  const answers = {};
  const remarks = {};
  const existingImages = {};

  const responseByKey = {};
  responses.forEach(({ response, images }) => {
    if (!response) return;
    const subKey = response.sub_item ?? response.sub_name ?? "";
    const key = `${response.checklist}__${response.item}__${subKey}`;
    responseByKey[key] = {
      score: response.score,
      remarks: response.remarks ?? "",
      images: images ?? [],
    };
  });

  if (!questionnaireData?.items) return { answers, remarks, existingImages };

  questionnaireData.items.forEach((category) => {
    category.items?.forEach((item, itemIdx) => {
      item.sub_items?.forEach((subItem, subIdx) => {
        const editKey = `${category.name}__${item.name}__${itemIdx}__${subIdx}`;
        const lookupKey = `${category.name}__${item.name}__${subItem.name}`;
        const found = responseByKey[lookupKey];
        if (found) {
          answers[editKey] = found.score;
          remarks[editKey] = found.remarks;
          if (found.images && found.images.length > 0) {
            existingImages[editKey] = found.images;
          }
        }
      });
    });
  });

  return { answers, remarks, existingImages };
};

const validateForm = async (isCompleted, formState) => {
  const {
    answers,
    remarks,
    startAt,
    temporalAudit,
    goodPoints,
    othersRemarks,
    questionnaireData,
  } = formState;

  const errors = {};

  if (isCompleted) {
    questionnaireData?.items?.forEach((category) => {
      category.items?.forEach((item, itemIdx) => {
        item.sub_items?.forEach((_subItem, subIdx) => {
          const key = `${category.name}__${item.name}__${itemIdx}__${subIdx}`;
          const score = answers[key];
          const remark = (remarks[key] ?? "").trim();

          if (score === undefined || score === null) {
            errors[`score__${key}`] = "Please select a score.";
          }

          if (score !== 100 && !remark) {
            errors[`remarks__${key}`] = "Remarks is required.";
          }
        });
      });
    });

    if (!startAt) errors.start_at = "Date is required.";
    if (!temporalAudit)
      errors.temporal_audit = "Please select a temporal audit type.";
    if (!goodPoints?.trim()) errors.good_points = "Good points is required.";
    if (!othersRemarks?.trim()) errors.remarks = "Remarks is required.";
  } else {
    if (!startAt) errors.start_at = "Date is required.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
};

const RequiredStar = () => <span className="cobs-sc__required">*</span>;

const COBSStartCheckingDialog = ({
  open,
  onClose,
  onSuccess,
  unitName,
  week,
  month,
  year,
  checklistId = 1,
  unitId,
  approverId,
  viewMode = false,
  continueMode = false,
  batchEntry = null,
}) => {
  const [answers, setAnswers] = useState({});
  const [remarks, setRemarks] = useState({});
  const [images, setImages] = useState({});
  const [existingImages, setExistingImages] = useState({});
  const [temporalAudit, setTemporalAudit] = useState("");
  const [goodPoints, setGoodPoints] = useState("");
  const [othersRemarks, setOthersRemarks] = useState("");
  const [startAt, setStartAt] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [errors, setErrors] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewState, setPreviewState] = useState({
    open: false,
    images: [],
    index: 0,
  });

  const cameraInputRefs = useRef({});
  const intervalRef = useRef(null);
  const firstErrorRef = useRef(null);

  const { data, isFetching } = useGetQuestionnaireQuery(checklistId, {
    skip: !open,
  });
  const [createCob, { isLoading }] = useCreateCobMutation();

  const questionnaireData = data?.data;
  const responseMap = viewMode ? buildResponseMap(batchEntry?.responses) : {};
  const errorCount = Object.keys(errors).length;
  const { min: dateMin, max: dateMax } = getWeekDateRange(week, month, year);

  useEffect(() => {
    if (viewMode) return;
    if (!open) {
      clearInterval(intervalRef.current);
      return;
    }

    setStartTime(getNow());
    setEndTime(getNow());
    intervalRef.current = setInterval(() => setEndTime(getNow()), 1000);

    if (continueMode && batchEntry) {
      const rawDate = batchEntry.start_at
        ? batchEntry.start_at.split(" ")[0]
        : "";
      setStartAt(rawDate);
      setTemporalAudit(batchEntry.temporal_audit ?? "");
      setGoodPoints(batchEntry.good_points ?? "");
      setOthersRemarks(batchEntry.remarks ?? "");
    } else {
      setStartAt(dateMin);
      setTemporalAudit("");
      setGoodPoints("");
      setOthersRemarks("");
    }

    setErrors({});
    setSubmitAttempted(false);
    return () => clearInterval(intervalRef.current);
  }, [open, viewMode, continueMode, batchEntry]);

  useEffect(() => {
    if (!open || viewMode) return;
    if (continueMode && batchEntry && questionnaireData) {
      const {
        answers: draftAnswers,
        remarks: draftRemarks,
        existingImages: draftImages,
      } = buildDraftAnswers(questionnaireData, batchEntry.responses ?? []);
      setAnswers(draftAnswers);
      setRemarks(draftRemarks);
      setExistingImages(draftImages);
      setImages({});
    } else if (!continueMode) {
      setAnswers({});
      setRemarks({});
      setImages({});
      setExistingImages({});
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

  const getKey = (categoryName, itemName, itemIndex, subItemIndex) =>
    `${categoryName}__${itemName}__${itemIndex}__${subItemIndex}`;

  const getViewKey = (categoryName, itemName, subItemName) =>
    `${categoryName}__${itemName}__${subItemName}`;

  const clearFieldError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleScore = (key, score) => {
    setAnswers((prev) => ({ ...prev, [key]: score }));
    clearFieldError(`score__${key}`);
    if (score === 100) {
      clearFieldError(`remarks__${key}`);
    }
  };

  const handleRemarks = (key, value) => {
    setRemarks((prev) => ({ ...prev, [key]: value }));
    if (value.trim()) clearFieldError(`remarks__${key}`);
  };

  const handleCameraCapture = (key, files) => {
    if (!files || files.length === 0) return;
    setImages((prev) => ({
      ...prev,
      [key]: [...(prev[key] ?? []), ...Array.from(files)],
    }));
  };

  const triggerCamera = (key) => {
    if (cameraInputRefs.current[key]) {
      cameraInputRefs.current[key].value = "";
    }
    cameraInputRefs.current[key]?.click();
  };

  const handleRemoveImage = (key, idx) =>
    setImages((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx),
    }));

  const handleRemoveExistingImage = (key, idx) =>
    setExistingImages((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== idx),
    }));

  const openPreview = (imgs, idx) =>
    setPreviewState({ open: true, images: imgs, index: idx });
  const closePreview = () => setPreviewState((p) => ({ ...p, open: false }));

  const buildFormData = (isCompleted) => {
    const formData = new FormData();
    formData.append("checklist_id", checklistId);
    formData.append("unit_id", unitId ?? "");
    formData.append("approver_id", approverId ?? "");
    formData.append("is_completed", isCompleted);
    formData.append("good_points", goodPoints);
    formData.append("temporal_audit", temporalAudit);
    formData.append("remarks", othersRemarks);
    formData.append("start_at", startAt);
    formData.append(
      "batch_no",
      continueMode ? (batchEntry?.batch_no ?? "") : "",
    );

    let responseIndex = 0;
    const keyToIndex = {};

    questionnaireData?.items?.forEach((category) => {
      category.items?.forEach((item, itemIdx) => {
        item.sub_items?.forEach((subItem, subIdx) => {
          const key = getKey(category.name, item.name, itemIdx, subIdx);
          formData.append(
            `response[${responseIndex}]`,
            JSON.stringify({
              checklist: category.name,
              item: item.name,
              sub_item: subItem.name,
              score: answers[key] ?? 0,
              remarks: remarks[key] ?? "",
            }),
          );
          keyToIndex[key] = responseIndex;
          responseIndex++;
        });
      });
    });

    Object.entries(images).forEach(([key, fileArr]) => {
      const idx = keyToIndex[key];
      if (idx === undefined) return;
      fileArr.forEach((file, fileIdx) => {
        formData.append(`image[${idx}][${fileIdx}]`, file);
      });
    });

    return formData;
  };

  const performSubmit = async (isCompleted) => {
    setIsSubmitting(true);
    try {
      const result = await createCob(buildFormData(isCompleted)).unwrap();
      onSuccess?.(result);
      setConfirmOpen(false);
      window.__snackbar__?.enqueueSnackbar(
        isCompleted
          ? "You successfully submitted the checklist!"
          : "You successfully saved your draft!",
        { variant: "success" },
      );
      handleClose();
    } catch {
      setErrors({ _submit: "Something went wrong. Please try again." });
      setConfirmOpen(false);
      window.__snackbar__?.enqueueSnackbar(
        "Something went wrong. Please try again.",
        { variant: "error" },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (isCompleted) => {
    setSubmitAttempted(true);
    const { valid, errors: validationErrors } = await validateForm(
      isCompleted,
      {
        answers,
        remarks,
        startAt,
        temporalAudit,
        goodPoints,
        othersRemarks,
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
      setAnswers({});
      setRemarks({});
      setImages({});
      setExistingImages({});
      setTemporalAudit("");
      setGoodPoints("");
      setOthersRemarks("");
      setStartAt("");
      setErrors({});
      setSubmitAttempted(false);
      setStartTime("");
      setEndTime("");
      clearInterval(intervalRef.current);
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

  return (
    <>
      <Dialog
        open={open}
        onClose={(_, reason) => {
          if (!viewMode && reason === "backdropClick") return;
          handleClose();
        }}
        disableEscapeKeyDown={!viewMode}
        maxWidth="md"
        fullWidth
        PaperProps={{ className: "cobs-sc__paper" }}>
        <div className="cobs-sc__header">
          <div className="cobs-sc__header-title">
            <ChecklistIcon className="cobs-sc__header-icon" />
            <span>{getDialogTitle()}</span>
          </div>
          <span className="cobs-sc__name-value">
            {unitName} — {week} ({month}/{year})
          </span>
          <IconButton
            size="small"
            className="cobs-sc__close"
            onClick={handleClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>

        {viewMode && batchEntry && !isFetching && (
          <div className="cobs-sc__info-strip">
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Submitted by</span>
              <span className="cobs-sc__info-value">
                {batchEntry.user ?? "—"}
              </span>
            </div>
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Approver</span>
              <span className="cobs-sc__info-value">
                {batchEntry.approver ?? "—"}
              </span>
            </div>
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Start</span>
              <span className="cobs-sc__info-value">
                {formatDateTime(batchEntry.start_at)}
              </span>
            </div>
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">End</span>
              <span className="cobs-sc__info-value">
                {formatDateTime(batchEntry.end_at)}
              </span>
            </div>
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Progress</span>
              <span className="cobs-sc__info-value cobs-sc__info-value--accent">
                {batchEntry.progress ?? "—"}
              </span>
            </div>
          </div>
        )}

        {continueMode && batchEntry && !isFetching && (
          <div className="cobs-sc__info-strip cobs-sc__info-strip--draft">
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Draft by</span>
              <span className="cobs-sc__info-value">
                {batchEntry.user ?? "—"}
              </span>
            </div>
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Started</span>
              <span className="cobs-sc__info-value">
                {formatDateTime(batchEntry.start_at)}
              </span>
            </div>
            <div className="cobs-sc__info-item">
              <span className="cobs-sc__info-label">Progress</span>
              <span className="cobs-sc__info-value cobs-sc__info-value--accent">
                {batchEntry.progress ?? "—"}
              </span>
            </div>
          </div>
        )}

        <DialogContent className="cobs-sc__content">
          {isFetching ? (
            <div className="cobs-sc__skeleton-wrap">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton
                  key={i}
                  variant="rectangular"
                  height={48}
                  sx={{
                    mb: 1,
                    borderRadius: 1,
                    bgcolor: "rgba(230, 100, 20, 0.15)",
                    "&::after": {
                      background:
                        "linear-gradient(90deg, transparent, rgba(230, 100, 20, 0.25), transparent)",
                    },
                  }}
                />
              ))}
            </div>
          ) : (
            <>
              {questionnaireData?.items?.map((category) => (
                <div key={category.name} className="cobs-sc__section">
                  <div className="cobs-sc__section-header">{category.name}</div>
                  <div className="cobs-sc__table-scroll">
                    <table className="cobs-sc__table">
                      <thead>
                        <tr className="cobs-sc__thead-row">
                          <th className="cobs-sc__th cobs-sc__th--item">
                            Item
                          </th>
                          <th className="cobs-sc__th cobs-sc__th--compliance">
                            Compliance <RequiredStar />
                          </th>
                          <th className="cobs-sc__th cobs-sc__th--remarks">
                            Remarks
                          </th>
                          <th className="cobs-sc__th cobs-sc__th--attachment">
                            Photo
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.items?.map((item, itemIdx) =>
                          item.sub_items?.map((subItem, subIdx) => {
                            const editKey = getKey(
                              category.name,
                              item.name,
                              itemIdx,
                              subIdx,
                            );
                            const viewKey = getViewKey(
                              category.name,
                              item.name,
                              subItem.name,
                            );
                            const resp = viewMode ? responseMap[viewKey] : null;
                            const fileList = !viewMode
                              ? (images[editKey] ?? [])
                              : [];
                            const existingFileList = continueMode
                              ? (existingImages[editKey] ?? [])
                              : [];
                            const scoreError = errors[`score__${editKey}`];
                            const remarksError = errors[`remarks__${editKey}`];
                            const rowHasError = !!(scoreError || remarksError);
                            const currentScore = answers[editKey];
                            const isScore100 = currentScore === 100;

                            return (
                              <tr
                                key={editKey}
                                ref={getFirstErrorRef(rowHasError)}
                                className={`cobs-sc__tr${rowHasError ? " cobs-sc__tr--error" : ""}`}>
                                <td className="cobs-sc__td cobs-sc__td--item">
                                  {subIdx + 1}. {subItem.name}
                                </td>

                                <td className="cobs-sc__td cobs-sc__td--compliance">
                                  <div
                                    className={`cobs-sc__radio-box${scoreError ? " cobs-sc__radio-box--error" : ""}`}>
                                    {SCORE_OPTIONS.map((score) => (
                                      <label
                                        key={score}
                                        className={`cobs-sc__radio-item${viewMode ? " cobs-sc__radio-item--readonly" : ""}`}>
                                        <input
                                          type="radio"
                                          name={
                                            viewMode
                                              ? `view-${editKey}`
                                              : editKey
                                          }
                                          value={score}
                                          checked={
                                            viewMode
                                              ? resp?.score === score
                                              : answers[editKey] === score
                                          }
                                          onChange={
                                            viewMode
                                              ? undefined
                                              : () =>
                                                  handleScore(editKey, score)
                                          }
                                          readOnly={viewMode}
                                          disabled={viewMode}
                                          className="cobs-sc__radio-input"
                                        />
                                        <span
                                          className={`cobs-sc__radio-circle cobs-sc__radio-circle--${score}`}
                                        />
                                        <span className="cobs-sc__radio-text">
                                          {score}
                                        </span>
                                      </label>
                                    ))}
                                  </div>
                                  {scoreError && (
                                    <span className="cobs-sc__inline-error">
                                      <ErrorOutlineIcon sx={{ fontSize: 11 }} />
                                      {scoreError}
                                    </span>
                                  )}
                                </td>

                                <td className="cobs-sc__td cobs-sc__td--remarks">
                                  <textarea
                                    placeholder={
                                      viewMode
                                        ? "—"
                                        : isScore100
                                          ? "Optional"
                                          : "(Required) Enter your response"
                                    }
                                    value={
                                      viewMode
                                        ? (resp?.remarks ?? "")
                                        : (remarks[editKey] ?? "")
                                    }
                                    onChange={
                                      viewMode
                                        ? undefined
                                        : (e) =>
                                            handleRemarks(
                                              editKey,
                                              e.target.value,
                                            )
                                    }
                                    readOnly={viewMode}
                                    rows={2}
                                    className={[
                                      "cobs-sc__textarea",
                                      viewMode
                                        ? "cobs-sc__textarea--readonly"
                                        : "",
                                      !viewMode && isScore100
                                        ? "cobs-sc__textarea--optional"
                                        : "",
                                      remarksError
                                        ? "cobs-sc__textarea--error"
                                        : "",
                                    ]
                                      .filter(Boolean)
                                      .join(" ")}
                                  />

                                  {remarksError && (
                                    <span className="cobs-sc__inline-error">
                                      <ErrorOutlineIcon sx={{ fontSize: 11 }} />
                                      {remarksError}
                                    </span>
                                  )}
                                </td>

                                <td className="cobs-sc__td cobs-sc__td--attachment">
                                  {viewMode ? (
                                    resp?.images?.length > 0 ? (
                                      <div className="cobs-sc__attach-file-list">
                                        {resp.images.map((url, i) => {
                                          const filename =
                                            decodeURIComponent(
                                              url
                                                .split("/")
                                                .pop()
                                                .split("?")[0],
                                            ) || `photo-${i + 1}`;
                                          return (
                                            <div
                                              key={i}
                                              className="cobs-sc__attach-file-row">
                                              <Tooltip
                                                title={filename}
                                                placement="top">
                                                <span className="cobs-sc__attach-file-name">
                                                  {filename}
                                                </span>
                                              </Tooltip>
                                              <Tooltip
                                                title="View photo"
                                                placement="top">
                                                <IconButton
                                                  size="small"
                                                  className="cobs-sc__attach-eye"
                                                  onClick={() =>
                                                    openPreview(resp.images, i)
                                                  }>
                                                  <VisibilityIcon
                                                    sx={{ fontSize: 13 }}
                                                  />
                                                </IconButton>
                                              </Tooltip>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <span className="cobs-sc__no-attach">
                                        —
                                      </span>
                                    )
                                  ) : (
                                    <>
                                      <input
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        style={{ display: "none" }}
                                        ref={(el) =>
                                          (cameraInputRefs.current[editKey] =
                                            el)
                                        }
                                        onChange={(e) =>
                                          handleCameraCapture(
                                            editKey,
                                            e.target.files,
                                          )
                                        }
                                      />

                                      {existingFileList.length > 0 ||
                                      fileList.length > 0 ? (
                                        <div className="cobs-sc__attach-list">
                                          {existingFileList.map((url, i) => {
                                            const filename =
                                              decodeURIComponent(
                                                url
                                                  .split("/")
                                                  .pop()
                                                  .split("?")[0],
                                              ) || `photo-${i + 1}`;
                                            return (
                                              <div
                                                key={`existing-${i}`}
                                                className="cobs-sc__attach-item">
                                                <Tooltip
                                                  title={filename}
                                                  placement="top">
                                                  <span className="cobs-sc__attach-name">
                                                    {filename}
                                                  </span>
                                                </Tooltip>
                                                <Tooltip
                                                  title="Preview"
                                                  placement="top">
                                                  <IconButton
                                                    size="small"
                                                    className="cobs-sc__attach-eye"
                                                    onClick={() =>
                                                      openPreview(
                                                        existingFileList,
                                                        i,
                                                      )
                                                    }>
                                                    <VisibilityIcon
                                                      sx={{ fontSize: 13 }}
                                                    />
                                                  </IconButton>
                                                </Tooltip>
                                                <IconButton
                                                  size="small"
                                                  className="cobs-sc__attach-remove"
                                                  onClick={() =>
                                                    handleRemoveExistingImage(
                                                      editKey,
                                                      i,
                                                    )
                                                  }>
                                                  <DeleteOutlineIcon
                                                    sx={{ fontSize: 13 }}
                                                  />
                                                </IconButton>
                                              </div>
                                            );
                                          })}
                                          {fileList.map((file, i) => (
                                            <div
                                              key={`new-${i}`}
                                              className="cobs-sc__attach-item">
                                              <Tooltip
                                                title={file.name}
                                                placement="top">
                                                <span className="cobs-sc__attach-name">
                                                  {file.name}
                                                </span>
                                              </Tooltip>
                                              <Tooltip
                                                title="Preview"
                                                placement="top">
                                                <IconButton
                                                  size="small"
                                                  className="cobs-sc__attach-eye"
                                                  onClick={() => {
                                                    const urls = (
                                                      images[editKey] ?? []
                                                    ).map((f) =>
                                                      URL.createObjectURL(f),
                                                    );
                                                    openPreview(urls, i);
                                                  }}>
                                                  <VisibilityIcon
                                                    sx={{ fontSize: 13 }}
                                                  />
                                                </IconButton>
                                              </Tooltip>
                                              <IconButton
                                                size="small"
                                                className="cobs-sc__attach-remove"
                                                onClick={() =>
                                                  handleRemoveImage(editKey, i)
                                                }>
                                                <DeleteOutlineIcon
                                                  sx={{ fontSize: 13 }}
                                                />
                                              </IconButton>
                                            </div>
                                          ))}
                                          <button
                                            type="button"
                                            className="cobs-sc__attach-btn cobs-sc__attach-btn--more"
                                            onClick={() =>
                                              triggerCamera(editKey)
                                            }>
                                            <CameraAltIcon
                                              sx={{ fontSize: 13 }}
                                            />
                                            Add photo
                                          </button>
                                        </div>
                                      ) : (
                                        <Tooltip
                                          title="Take photo"
                                          placement="top">
                                          <button
                                            type="button"
                                            className="cobs-sc__attach-btn"
                                            onClick={() =>
                                              triggerCamera(editKey)
                                            }>
                                            <CameraAltIcon
                                              sx={{ fontSize: 14 }}
                                            />
                                            <span>No photo</span>
                                          </button>
                                        </Tooltip>
                                      )}
                                    </>
                                  )}
                                </td>
                              </tr>
                            );
                          }),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              <div className="cobs-sc__others">
                <div className="cobs-sc__others-header">Others</div>
                <div className="cobs-sc__others-body">
                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">
                      Date <RequiredStar />
                    </span>
                    {viewMode ? (
                      <div className="cobs-sc__others-input-box">
                        <span className="cobs-sc__others-time">
                          {batchEntry?.start_at
                            ? formatDateDisplay(
                                batchEntry.start_at.split(" ")[0],
                              )
                            : "—"}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div
                          ref={errors.start_at ? getFirstErrorRef(true) : null}
                          className={`cobs-sc__date-picker-wrap${errors.start_at ? " cobs-sc__date-picker-wrap--error" : ""}`}>
                          <CalendarTodayIcon className="cobs-sc__date-icon" />
                          <input
                            type="date"
                            className="cobs-sc__date-input"
                            value={startAt}
                            min={dateMin}
                            max={dateMax}
                            onChange={(e) => {
                              setStartAt(e.target.value);
                              if (e.target.value) clearFieldError("start_at");
                            }}
                          />
                          <span className="cobs-sc__date-display">
                            {startAt ? formatDateDisplay(startAt) : ""}
                          </span>
                        </div>
                        {errors.start_at && (
                          <span className="cobs-sc__inline-error">
                            <ErrorOutlineIcon sx={{ fontSize: 11 }} />
                            {errors.start_at}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">Time</span>
                    <div className="cobs-sc__time-row">
                      <div className="cobs-sc__time-block cobs-sc__time-block--disabled">
                        <span className="cobs-sc__time-block-label">Start</span>
                        <span className="cobs-sc__time-block-value">
                          {viewMode
                            ? formatDateTime(batchEntry?.start_at)
                            : startTime || "—"}
                        </span>
                      </div>
                      <div className="cobs-sc__time-divider">—</div>
                      <div className="cobs-sc__time-block cobs-sc__time-block--disabled">
                        <span className="cobs-sc__time-block-label">End</span>
                        <span className="cobs-sc__time-block-value">
                          {viewMode
                            ? formatDateTime(batchEntry?.end_at)
                            : endTime || "—"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">
                      Temporal Audit <RequiredStar />
                    </span>
                    <div
                      ref={
                        errors.temporal_audit ? getFirstErrorRef(true) : null
                      }
                      className={`cobs-sc__others-input-box${errors.temporal_audit ? " cobs-sc__others-input-box--error" : ""}`}>
                      <div className="cobs-sc__temporal-options">
                        {TEMPORAL_AUDIT_OPTIONS.map((opt) => (
                          <label
                            key={opt}
                            className={`cobs-sc__temporal-item${viewMode ? " cobs-sc__temporal-item--readonly" : ""}`}>
                            <input
                              type="radio"
                              name={
                                viewMode
                                  ? "view_temporal_audit"
                                  : "temporal_audit"
                              }
                              value={opt}
                              checked={
                                viewMode
                                  ? (batchEntry?.temporal_audit ?? "") === opt
                                  : temporalAudit === opt
                              }
                              onChange={
                                viewMode
                                  ? undefined
                                  : () => {
                                      setTemporalAudit(opt);
                                      clearFieldError("temporal_audit");
                                    }
                              }
                              readOnly={viewMode}
                              disabled={viewMode}
                              className="cobs-sc__radio-input"
                            />
                            <span className="cobs-sc__temporal-circle" />
                            <span className="cobs-sc__temporal-text">
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    {errors.temporal_audit && (
                      <span className="cobs-sc__inline-error">
                        <ErrorOutlineIcon sx={{ fontSize: 11 }} />
                        {errors.temporal_audit}
                      </span>
                    )}
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">
                      Good Points <RequiredStar />
                    </span>
                    <textarea
                      ref={errors.good_points ? getFirstErrorRef(true) : null}
                      className={`cobs-sc__others-textarea${viewMode ? " cobs-sc__others-textarea--readonly" : ""}${errors.good_points ? " cobs-sc__others-textarea--error" : ""}`}
                      placeholder={
                        viewMode ? "—" : "Enter good points observed"
                      }
                      value={
                        viewMode ? (batchEntry?.good_points ?? "") : goodPoints
                      }
                      onChange={
                        viewMode
                          ? undefined
                          : (e) => {
                              setGoodPoints(e.target.value);
                              if (e.target.value.trim())
                                clearFieldError("good_points");
                            }
                      }
                      readOnly={viewMode}
                      rows={4}
                    />
                    {errors.good_points && (
                      <span className="cobs-sc__inline-error">
                        <ErrorOutlineIcon sx={{ fontSize: 11 }} />
                        {errors.good_points}
                      </span>
                    )}
                  </div>

                  <div className="cobs-sc__others-field">
                    <span className="cobs-sc__others-label">
                      Remarks <RequiredStar />
                    </span>
                    <textarea
                      ref={errors.remarks ? getFirstErrorRef(true) : null}
                      className={`cobs-sc__others-textarea${viewMode ? " cobs-sc__others-textarea--readonly" : ""}${errors.remarks ? " cobs-sc__others-textarea--error" : ""}`}
                      placeholder={viewMode ? "—" : "Enter remarks"}
                      value={
                        viewMode
                          ? (batchEntry?.other_remarks ?? "")
                          : othersRemarks
                      }
                      onChange={
                        viewMode
                          ? undefined
                          : (e) => {
                              setOthersRemarks(e.target.value);
                              if (e.target.value.trim())
                                clearFieldError("remarks");
                            }
                      }
                      readOnly={viewMode}
                      rows={4}
                    />
                    {errors.remarks && (
                      <span className="cobs-sc__inline-error">
                        <ErrorOutlineIcon sx={{ fontSize: 11 }} />
                        {errors.remarks}
                      </span>
                    )}
                  </div>

                  {errors._submit && (
                    <span className="cobs-sc__inline-error cobs-sc__inline-error--block">
                      <ErrorOutlineIcon sx={{ fontSize: 13 }} />
                      {errors._submit}
                    </span>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>

        <DialogActions className="cobs-sc__footer">
          {viewMode ? (
            <Button
              variant="text"
              onClick={handleClose}
              className="cobs-sc__btn-close">
              CLOSE
            </Button>
          ) : (
            <>
              <div className="cobs-sc__footer-left">
                {errorCount > 0 && (
                  <span className="cobs-sc__error-summary">
                    <ErrorOutlineIcon sx={{ fontSize: 13 }} />
                    {errorCount} field{errorCount > 1 ? "s" : ""} need
                    {errorCount === 1 ? "s" : ""} attention
                  </span>
                )}
              </div>
              <div className="cobs-sc__footer-right">
                <Button
                  variant="text"
                  onClick={handleClose}
                  disabled={isLoading || isSubmitting}
                  className="cobs-sc__btn-close">
                  CLOSE
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => handleSubmit(0)}
                  disabled={isLoading || isSubmitting}
                  className="cobs-sc__btn-draft">
                  {isLoading || isSubmitting ? "Saving..." : "SAVE AS DRAFT"}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleSubmit(1)}
                  disabled={isLoading || isSubmitting}
                  className="cobs-sc__btn-submit">
                  {isLoading || isSubmitting ? "Submitting..." : "SUBMIT"}
                </Button>
              </div>
            </>
          )}
        </DialogActions>
      </Dialog>

      <COBSImagePreviewDialog
        open={previewState.open}
        onClose={closePreview}
        images={previewState.images}
        initialIndex={previewState.index}
      />

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleConfirmSubmit}
        title="Submit Checklist?"
        message="Once submitted, this checklist will be marked as completed and can no longer be edited."
        confirmLabel="Submit"
        cancelLabel="Cancel"
        isLoading={isSubmitting}
        confirmVariant="primary"
      />
    </>
  );
};

export default COBSStartCheckingDialog;
